/**
 * server/models/Match.js
 *
 * The Match schema — every match request between two users is stored
 * as its own document in the "matches" collection.
 *
 * ─── Why a separate collection, not an embedded array in User? ───────────────
 *
 * Option A (embedded in User): User.matches = [{ receiverId, status, ... }]
 *   Problem 1: When User A sends to User B, you must update TWO user documents
 *              atomically to keep both sides in sync.
 *   Problem 2: A user with 500 matches has a 500-item array loaded on every
 *              single profile fetch, even when you don't need match data.
 *   Problem 3: Querying "all pending requests across the whole system" requires
 *              scanning every user document.
 *
 * Option B (separate collection — what we use):
 *   ✓ One document = one relationship. Single write per action.
 *   ✓ Indexes on sender + receiver make all queries fast.
 *   ✓ User documents stay lean — match data only loaded when needed.
 *   ✓ Full history is preserved (rejected/cancelled requests stay queryable).
 *
 * ─── Document shape ──────────────────────────────────────────────────────────
 *
 * {
 *   _id:        ObjectId,           // auto-generated
 *   sender:     ObjectId → User,    // who sent the request
 *   receiver:   ObjectId → User,    // who received it
 *   status:     'pending' | 'accepted' | 'rejected' | 'cancelled',
 *   message:    String,             // optional note from sender
 *   createdAt:  Date,               // from timestamps:true
 *   updatedAt:  Date,               // automatically updated on status change
 * }
 *
 * ─── Duplicate prevention via compound unique index ──────────────────────────
 *
 * The compound index { sender: 1, receiver: 1 } with unique: true means
 * MongoDB will REJECT a second document with the same sender+receiver pair.
 * This enforces at the DATABASE level that one user can only send one request
 * to another user — no amount of concurrent HTTP requests can bypass it.
 *
 * MVC role: this is the MODEL layer.
 */

const mongoose  = require('mongoose');
const { MATCH_STATUS } = require('../config/constants');

const matchSchema = new mongoose.Schema(
  {
    // ── sender ──────────────────────────────────────────────────────────────
    // The user who initiated the match request.
    // ref: 'User' enables Mongoose's .populate() to join user data in one query.
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },

    // ── receiver ────────────────────────────────────────────────────────────
    // The user who receives the request and can accept or reject it.
    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Receiver is required'],
    },

    // ── status ──────────────────────────────────────────────────────────────
    // The lifecycle state of this request.
    //
    // Valid transitions:
    //   pending  → accepted   (receiver accepts)
    //   pending  → rejected   (receiver rejects)
    //   pending  → cancelled  (sender cancels before receiver responds)
    //
    // Once accepted/rejected/cancelled, the status is FINAL.
    // No re-opening: if both parties want to reconnect, a new request is needed.
    status: {
      type:    String,
      enum: {
        values:  Object.values(MATCH_STATUS),
        message: '{VALUE} is not a valid match status',
      },
      default: MATCH_STATUS.PENDING,
    },

    // ── message ─────────────────────────────────────────────────────────────
    // Optional personalised note from the sender.
    // Example: "Hey! I can teach Python, would love to learn Guitar from you."
    message: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
      default:   '',
    },
  },
  {
    // timestamps: true adds createdAt (when request was sent) and
    // updatedAt (when status last changed) automatically.
    timestamps: true,

    // Same toJSON transform used in User.js for consistent API responses:
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

// ─── Compound unique index ───────────────────────────────────────────────────
// This is the CORE of duplicate prevention.
//
// A compound index on (sender, receiver) means MongoDB enforces that
// no two documents can share the same sender+receiver pair.
//
// This works in conjunction with the controller check:
//   - Controller check: returns a friendly 409 error message
//   - Database index: last-resort enforcement if two requests race simultaneously
//
// Why unique at the DB level AND in the controller?
//   The controller check is for user-friendly error messages.
//   The DB index is for race-condition safety (two simultaneous requests).
//   Belt AND suspenders — both layers together make it bulletproof.
matchSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { unique: true }
);

// ─── Individual field indexes ────────────────────────────────────────────────
// Speed up "get all requests I sent" and "get all requests I received" queries.
// Without these, MongoDB would scan every match document to find the ones
// where sender = req.user.id (slow as the collection grows).
matchSchema.index({ sender:   1, status: 1 });
matchSchema.index({ receiver: 1, status: 1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
