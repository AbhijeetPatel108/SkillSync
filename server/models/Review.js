/**
 * server/models/Review.js
 *
 * The Review schema — one document per review left by one user for another
 * after a completed (accepted) match.
 *
 * ─── Why a separate collection? ──────────────────────────────────────────────
 *
 * Same reasoning as the Match collection (Module 5):
 *   - Embedding reviews inside User would make every profile fetch load all
 *     reviews, even when you only need their name and avatar.
 *   - A separate collection lets you query reviews independently with indexes.
 *   - Aggregation pipelines (for averageRating) work cleanly on a flat collection.
 *
 * ─── Document shape ──────────────────────────────────────────────────────────
 * {
 *   _id:       ObjectId,
 *   reviewer:  ObjectId → User,   who wrote this review
 *   reviewee:  ObjectId → User,   who received this review
 *   match:     ObjectId → Match,  the accepted match that unlocked this review
 *   rating:    Number (1–5),
 *   comment:   String (max 500 chars, optional),
 *   createdAt: Date,
 *   updatedAt: Date,
 * }
 *
 * ─── Duplicate prevention ─────────────────────────────────────────────────────
 *
 * Compound unique index on { reviewer, match }:
 *   One reviewer can submit exactly one review per match.
 *   Controller check → friendly 409 message.
 *   DB index         → race-condition safety net (same two-layer approach as Match).
 *
 * ─── averageRating recalculation ─────────────────────────────────────────────
 *
 * Static method `recalcStats` uses MongoDB's $avg aggregation on the reviews
 * collection to recompute the reviewee's averageRating and totalReviews atomically.
 * Called after every create and delete — no stale cached values.
 *
 * MVC role: MODEL layer.
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // ── reviewer ─────────────────────────────────────────────────────────────
    // The user who wrote this review.
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewer is required'],
    },

    // ── reviewee ─────────────────────────────────────────────────────────────
    // The user being reviewed. Their averageRating and totalReviews are
    // updated on the User document whenever a review is created or deleted.
    reviewee: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewee is required'],
    },

    // ── match ─────────────────────────────────────────────────────────────────
    // The accepted Match document that connects the two users.
    // A review can only be created when this match exists and has status:'accepted'.
    // Stored as a reference so we can verify it at review-creation time and
    // display match context on the review if needed.
    match: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match reference is required'],
    },

    // ── rating ────────────────────────────────────────────────────────────────
    // Integer 1–5. Required — a review without a rating is not meaningful.
    // min/max enforced at the schema level; controller also validates.
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
      // Storing as an integer. We use Math.round() in the controller
      // before saving to reject 3.7, 4.2, etc.
    },

    // ── comment ───────────────────────────────────────────────────────────────
    // Optional free-text feedback. 500 char cap keeps it readable.
    comment: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default:   '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically

    // Consistent toJSON transform used throughout the project:
    //   _id → id, remove __v
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// PRIMARY DUPLICATE GUARD — one review per reviewer per match.
// unique: true means MongoDB rejects a second document with the same
// (reviewer, match) pair with error code 11000, which errorHandler.js
// converts to a 409 Conflict response.
reviewSchema.index({ reviewer: 1, match: 1 }, { unique: true });

// Speed up "all reviews for a user" queries (GET /api/reviews/user/:id).
// Without this, MongoDB scans every review document to find those where
// reviewee = someUserId. With this index, it jumps directly.
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Speed up "reviews I wrote" queries (GET /api/reviews/given).
reviewSchema.index({ reviewer: 1, createdAt: -1 });

// ─── Static method: recalcStats ───────────────────────────────────────────────
/**
 * Recalculates and persists averageRating + totalReviews on the reviewee's
 * User document after any create or delete operation.
 *
 * Why a static method on the model rather than logic in the controller?
 *   The model owns its data integrity. Any future controller or service that
 *   creates/deletes reviews just calls Review.recalcStats(revieweeId) — the
 *   logic is never duplicated.
 *
 * How it works:
 *   MongoDB $group aggregation computes the average and count in ONE query.
 *   We then write those values directly to the User document with $set.
 *   This is atomic at the document level and avoids loading all reviews
 *   into Node.js memory.
 *
 * If a user has no reviews (all deleted), averageRating resets to 0
 * and totalReviews resets to 0.
 *
 * @param {ObjectId|string} revieweeId - The user whose stats need updating
 */
reviewSchema.statics.recalcStats = async function (revieweeId) {
  // $match narrows to reviews for this specific user.
  // $group with _id: null collapses ALL matching docs into ONE output doc
  // containing the average rating and count.
  const stats = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId) } },
    {
      $group: {
        _id:           null,
        averageRating: { $avg: '$rating' },
        totalReviews:  { $sum: 1 },
      },
    },
  ]);

  // stats is an array. If there are reviews, stats[0] has our values.
  // If no reviews exist (all deleted), stats is empty → reset to 0.
  const averageRating = stats.length > 0
    ? Math.round(stats[0].averageRating * 10) / 10  // round to 1 decimal
    : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  // Write the recalculated values to the User document.
  // We require User here (not at top of file) to avoid circular dependency:
  //   User.js → Review.js → User.js (circular).
  // Requiring inside the function breaks the cycle — by the time this runs,
  // both models are already fully registered with Mongoose.
  const User = require('./User');
  await User.findByIdAndUpdate(revieweeId, {
    $set: { averageRating, totalReviews },
  });
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
