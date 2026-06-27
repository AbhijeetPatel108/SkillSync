/**
 * server/models/Message.js
 *
 * The Message schema — one document per chat message sent between
 * two matched users.
 *
 * ─── Design decisions ────────────────────────────────────────────────────────
 *
 * 1. Tied to a Match, not to a "Conversation" collection.
 *    Each accepted match IS the conversation. We do not need a separate
 *    Conversation model — the Match document already stores both participants
 *    and its matchId becomes the room identifier for Socket.IO.
 *
 *    matchId → room name in Socket.IO AND the query key for message history.
 *
 * 2. readBy array instead of a single boolean.
 *    A boolean `isRead` only works for 1-to-1. The readBy array is correct for
 *    group chats if SkillSync ever expands, and it lets us compute unread counts
 *    per user with a single MongoDB query instead of two.
 *
 * 3. Soft content: stored as plain text.
 *    No markdown rendering, no HTML — prevents XSS from the database layer.
 *    The frontend is responsible for rendering decisions.
 *
 * MVC role: MODEL layer.
 */

const mongoose           = require('mongoose');
const { MESSAGE_MAX_LENGTH } = require('../config/constants');

const messageSchema = new mongoose.Schema(
  {
    // ── match ─────────────────────────────────────────────────────────────────
    // References the Match document that this conversation belongs to.
    // This is the "room key" — all messages in one conversation share the
    // same matchId. Querying { match: matchId } gives the full history.
    match: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match reference is required'],
    },

    // ── sender ────────────────────────────────────────────────────────────────
    // The user who sent this message.
    // Populated in REST history responses for display name + avatar.
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },

    // ── content ───────────────────────────────────────────────────────────────
    // The plain-text message body.
    // Capped at MESSAGE_MAX_LENGTH (1000 chars) from constants.js.
    // trim: true strips leading/trailing whitespace before saving.
    content: {
      type:      String,
      required:  [true, 'Message content is required'],
      trim:      true,
      maxlength: [MESSAGE_MAX_LENGTH, `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`],
    },

    // ── readBy ────────────────────────────────────────────────────────────────
    // Array of userIds who have read this message.
    // The sender is added at creation time (they "read" their own message).
    // The receiver is added when they call mark_read (socket event) or
    // PATCH /api/chat/rooms/:matchId/read (REST endpoint).
    //
    // Unread count for user X in a conversation:
    //   Message.countDocuments({ match: matchId, readBy: { $ne: X } })
    //   → counts messages NOT yet read by X (fast with the compound index below)
    readBy: {
      type:    [mongoose.Schema.Types.ObjectId],
      ref:     'User',
      default: [],
    },
  },
  {
    timestamps: true, // createdAt = message send time, updatedAt = last edit time

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

// Primary index: fetch all messages in a conversation, newest first.
// This is the most common query — used by getMessageHistory every page load.
messageSchema.index({ match: 1, createdAt: -1 });

// Secondary: "unread messages in this conversation not yet seen by user X".
// Compound on match + readBy supports the $ne query efficiently.
messageSchema.index({ match: 1, readBy: 1 });

// Tertiary: "all messages sent by user X" — for moderation / admin.
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
