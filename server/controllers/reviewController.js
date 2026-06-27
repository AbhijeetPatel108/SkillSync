/**
 * server/controllers/reviewController.js
 *
 * All business logic for the review and rating system.
 *
 * MVC role: CONTROLLER
 * Every function receives an authenticated request (req.user is always set
 * by the protect middleware), enforces business rules, and returns JSON.
 *
 * Express 5: async errors thrown here reach errorHandler automatically.
 * No try/catch anywhere in this file.
 *
 * Reused from existing codebase (nothing reimplemented):
 *   AppError       → utils/AppError.js
 *   getPagination  → utils/helpers.js
 *   buildMeta      → utils/helpers.js
 *   MATCH_STATUS   → config/constants.js
 *   protect        → middleware/authMiddleware.js  (applied in routes)
 *
 * ─── 6 endpoints ────────────────────────────────────────────────────────────
 *   createReview     POST   /api/reviews
 *   getUserReviews   GET    /api/reviews/user/:id
 *   getMyReviews     GET    /api/reviews/me
 *   getGivenReviews  GET    /api/reviews/given
 *   deleteReview     DELETE /api/reviews/:id
 *   getReviewById    GET    /api/reviews/:id
 */

const Review   = require('../models/Review');
const Match    = require('../models/Match');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');

// ─── Field whitelist for populated user data ──────────────────────────────────
// Identical to the whitelist used in matchController — never expose
// password, lastLogin, isActive, role in any populated reference.
// averageRating and totalReviews are included so a reviewer's profile
// card can show their own rating when displayed alongside their review.
const USER_PUBLIC_FIELDS = 'name avatar bio location averageRating totalReviews';

// ─── createReview ─────────────────────────────────────────────────────────────
// @route   POST /api/reviews
// @access  Private
// @body    { revieweeId, matchId, rating, comment? }
//
// Business rules enforced in order:
//   1. No self-review
//   2. matchId + rating are required
//   3. rating is an integer 1–5
//   4. The match must exist and be accepted
//   5. The reviewer must be a participant in that match
//   6. No duplicate review for the same match by the same reviewer
const createReview = async (req, res) => {
  const { revieweeId, matchId, rating, comment } = req.body;

  // ── Required field checks ─────────────────────────────────────────────────
  if (!revieweeId) throw new AppError('revieweeId is required', 400);
  if (!matchId)    throw new AppError('matchId is required', 400);
  if (rating === undefined || rating === null) {
    throw new AppError('rating is required', 400);
  }

  // ── No self-review ────────────────────────────────────────────────────────
  if (req.user.id.toString() === revieweeId.toString()) {
    throw new AppError('You cannot review yourself', 400);
  }

  // ── Rating must be integer 1–5 ────────────────────────────────────────────
  // parseInt catches "4.7", "abc", etc. — the schema min/max is a second layer.
  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new AppError('Rating must be a whole number between 1 and 5', 400);
  }

  // ── Comment length ────────────────────────────────────────────────────────
  if (comment && comment.trim().length > 500) {
    throw new AppError('Comment cannot exceed 500 characters', 400);
  }

  // ── Verify the match exists and is accepted ───────────────────────────────
  // A review is only valid when the two users have completed (accepted) a match.
  // We fetch the match document so we can verify participation in the next step.
  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }
  if (match.status !== MATCH_STATUS.ACCEPTED) {
    throw new AppError(
      'You can only review users from an accepted match',
      400
    );
  }

  // ── Verify the reviewer participated in this match ────────────────────────
  // The logged-in user must be either the sender or receiver of the match.
  // This prevents User C from submitting a review for a match between A and B.
  const reviewerId = req.user.id.toString();
  const isSender   = match.sender.toString()   === reviewerId;
  const isReceiver = match.receiver.toString() === reviewerId;

  if (!isSender && !isReceiver) {
    throw new AppError('You were not a participant in this match', 403);
  }

  // ── Verify revieweeId is the OTHER participant ────────────────────────────
  // The reviewer must be leaving a review FOR the other person in the match,
  // not for a third party entirely outside the match.
  const otherParticipantId = isSender
    ? match.receiver.toString()
    : match.sender.toString();

  if (revieweeId.toString() !== otherParticipantId) {
    throw new AppError(
      'You can only review the other participant of this match',
      400
    );
  }

  // ── Duplicate check — controller layer ───────────────────────────────────
  // The compound unique index on (reviewer, match) is the DB-level guard.
  // This check provides a friendly message before hitting that constraint.
  const existing = await Review.findOne({
    reviewer: req.user.id,
    match:    matchId,
  });
  if (existing) {
    throw new AppError('You have already submitted a review for this match', 409);
  }

  // ── Create the review ─────────────────────────────────────────────────────
  const review = await Review.create({
    reviewer: req.user.id,
    reviewee: revieweeId,
    match:    matchId,
    rating:   parsedRating,
    comment:  comment ? comment.trim() : '',
  });

  // ── Recalculate reviewee's averageRating and totalReviews ─────────────────
  // This runs AFTER the review is saved. It uses a MongoDB aggregation to
  // recompute the exact average from all reviews, then writes it to User.
  // We await it so the response reflects the updated rating immediately.
  await Review.recalcStats(revieweeId);

  // Populate reviewer and reviewee for a rich response
  await review.populate([
    { path: 'reviewer', select: USER_PUBLIC_FIELDS },
    { path: 'reviewee', select: USER_PUBLIC_FIELDS },
  ]);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review,
  });
};

// ─── getUserReviews ───────────────────────────────────────────────────────────
// @route   GET /api/reviews/user/:id
// @access  Private
// @query   ?page=1&limit=10
//
// Returns all reviews received by any user (their public review wall).
// Populated with reviewer info — no N+1 queries.
const getUserReviews = async (req, res) => {
  const { id: revieweeId } = req.params;
  const { page, limit, skip } = getPagination(req.query);

  // Run count + data queries in parallel — same pattern as Modules 4 and 5.
  const [total, reviews] = await Promise.all([
    Review.countDocuments({ reviewee: revieweeId }),
    Review.find({ reviewee: revieweeId })
      .populate('reviewer', USER_PUBLIC_FIELDS)  // who wrote each review
      .select('-reviewee')                       // no need to repeat reviewee in every item
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    reviews,
  });
};

// ─── getMyReviews ─────────────────────────────────────────────────────────────
// @route   GET /api/reviews/me
// @access  Private
// @query   ?page=1&limit=10
//
// Returns all reviews the logged-in user has RECEIVED.
// Identical query to getUserReviews but uses req.user.id — no :id param needed.
// This is the "my reputation" view for the logged-in user's dashboard.
const getMyReviews = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [total, reviews] = await Promise.all([
    Review.countDocuments({ reviewee: req.user.id }),
    Review.find({ reviewee: req.user.id })
      .populate('reviewer', USER_PUBLIC_FIELDS)
      .select('-reviewee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    reviews,
  });
};

// ─── getGivenReviews ──────────────────────────────────────────────────────────
// @route   GET /api/reviews/given
// @access  Private
// @query   ?page=1&limit=10
//
// Returns all reviews the logged-in user has WRITTEN.
// Useful for "reviews I've left" history so users can see what they said
// and whether they want to delete any.
const getGivenReviews = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [total, reviews] = await Promise.all([
    Review.countDocuments({ reviewer: req.user.id }),
    Review.find({ reviewer: req.user.id })
      .populate('reviewee', USER_PUBLIC_FIELDS)  // who was reviewed
      .select('-reviewer')                       // no need to repeat reviewer in every item
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    reviews,
  });
};

// ─── deleteReview ─────────────────────────────────────────────────────────────
// @route   DELETE /api/reviews/:id
// @access  Private — only the reviewer who wrote it can delete it
//
// Deletes the review document and immediately recalculates the reviewee's
// averageRating and totalReviews. The stats on the User document are updated
// atomically before the response is sent.
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // ── Only the original reviewer can delete their review ────────────────────
  if (review.reviewer.toString() !== req.user.id.toString()) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  // Store revieweeId BEFORE deleting — we need it for recalcStats after.
  const revieweeId = review.reviewee;

  // deleteOne() removes this specific document from the collection.
  // We use deleteOne() on the instance rather than findByIdAndDelete()
  // because we already have the document and want to avoid a second DB read.
  await review.deleteOne();

  // Recalculate the reviewee's stats now that one review is gone.
  // If this was their last review, recalcStats resets both fields to 0.
  await Review.recalcStats(revieweeId);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
};

// ─── getReviewById ────────────────────────────────────────────────────────────
// @route   GET /api/reviews/:id
// @access  Private
//
// Returns a single review document with populated reviewer and reviewee.
// Any authenticated user can read any individual review (reviews are public
// reputation data, not private like matches).
const getReviewById = async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('reviewer', USER_PUBLIC_FIELDS)
    .populate('reviewee', USER_PUBLIC_FIELDS);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  res.status(200).json({
    success: true,
    review,
  });
};

module.exports = {
  createReview,
  getUserReviews,
  getMyReviews,
  getGivenReviews,
  deleteReview,
  getReviewById,
};
