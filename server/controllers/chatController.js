/**
 * server/controllers/chatController.js
 *
 * REST HTTP endpoints for the chat system.
 *
 * ─── Why REST alongside Socket.IO? ───────────────────────────────────────────
 *
 * Socket.IO handles REAL-TIME delivery of new messages.
 * REST handles HISTORY and MANAGEMENT:
 *
 *   REST endpoint                     | When the frontend uses it
 *   ─────────────────────────────────────────────────────────────
 *   GET  /api/chat/rooms              | Load chat sidebar (all conversations)
 *   GET  /api/chat/rooms/:id/messages | Full paginated history on room open
 *   PATCH /api/chat/rooms/:id/read    | Mark all as read via HTTP (not socket)
 *
 * This hybrid approach is standard in production chat systems.
 * The socket connection sends live messages; REST fetches history.
 *
 * MVC role: CONTROLLER layer.
 * Express 5: async errors thrown here reach errorHandler automatically.
 *
 * Reused from existing codebase:
 *   AppError       → utils/AppError.js
 *   getPagination  → utils/helpers.js
 *   buildMeta      → utils/helpers.js
 *   MATCH_STATUS   → config/constants.js
 *   protect        → applied in chatRoutes.js
 */

const Match    = require('../models/Match');
const Message  = require('../models/Message');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');

// ─── Field whitelist — consistent with all previous modules ───────────────────
const USER_PUBLIC_FIELDS = 'name avatar';

// ─── getMyRooms ───────────────────────────────────────────────────────────────
// @route   GET /api/chat/rooms
// @access  Private
//
// Returns all chat rooms the logged-in user has access to.
// Each room is one accepted match. We enrich each room with:
//   - The other participant's public profile
//   - The most recent message (for the chat sidebar preview)
//   - The count of unread messages (for the badge)
//
// This is the data needed to render a WhatsApp/iMessage-style sidebar.
const getMyRooms = async (req, res) => {
  // Fetch all accepted matches where this user is a participant.
  // Same query pattern used in matchController.getAcceptedMatches.
  const matches = await Match.find({
    status: MATCH_STATUS.ACCEPTED,
    $or: [
      { sender:   req.user.id },
      { receiver: req.user.id },
    ],
  })
    .populate('sender',   USER_PUBLIC_FIELDS)
    .populate('receiver', USER_PUBLIC_FIELDS)
    .sort({ updatedAt: -1 })
    .lean(); // lean() = plain JS objects, no Mongoose overhead, faster

  // For each match, fetch the latest message and unread count IN PARALLEL.
  // Promise.all() fires all queries simultaneously — no sequential round trips.
  // N matches → N parallel pairs = 2N queries total in one event loop tick.
  const rooms = await Promise.all(
    matches.map(async (match) => {
      const matchId = match._id;

      // Run latest message + unread count in parallel for this match
      const [latestMessage, unreadCount] = await Promise.all([
        Message.findOne({ match: matchId })
          .populate('sender', 'name')
          .sort({ createdAt: -1 })
          .lean(),

        Message.countDocuments({
          match:  matchId,
          readBy: { $ne: req.user.id },   // messages not yet read by current user
        }),
      ]);

      // Determine the "other" participant for display in the sidebar
      const isUserSender = match.sender._id.toString() === req.user.id.toString();
      const otherUser    = isUserSender ? match.receiver : match.sender;

      return {
        matchId:       matchId,
        otherUser,
        latestMessage: latestMessage || null,
        unreadCount,
        updatedAt:     match.updatedAt,
      };
    })
  );

  res.status(200).json({
    success: true,
    count:   rooms.length,
    rooms,
  });
};

// ─── getMessageHistory ────────────────────────────────────────────────────────
// @route   GET /api/chat/rooms/:matchId/messages
// @access  Private
// @query   ?page=1&limit=20
//
// Returns paginated message history for a specific chat room.
// Messages are sorted newest-first (descending createdAt) so the client
// receives the most recent messages on page 1 and can load older messages
// by incrementing the page (infinite scroll upwards).
//
// Authorization: user must be a participant in the match.
const getMessageHistory = async (req, res) => {
  const { matchId } = req.params;

  // ── Verify match exists and user participates ─────────────────────────────
  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const isSender   = match.sender.toString()   === req.user.id.toString();
  const isReceiver = match.receiver.toString() === req.user.id.toString();

  if (!isSender && !isReceiver) {
    throw new AppError('You do not have access to this conversation', 403);
  }

  if (match.status !== MATCH_STATUS.ACCEPTED) {
    throw new AppError('Chat is only available for accepted matches', 400);
  }

  // ── Paginate ──────────────────────────────────────────────────────────────
  // Default limit is 20 for chat (more than the 10 default in getPagination).
  // We pass req.query with a fallback so the helper handles edge cases.
  const rawQuery = { ...req.query };
  if (!rawQuery.limit) rawQuery.limit = '20';

  const { page, limit, skip } = getPagination(rawQuery);

  // ── Parallel count + data fetch ───────────────────────────────────────────
  const [total, messages] = await Promise.all([
    Message.countDocuments({ match: matchId }),
    Message.find({ match: matchId })
      .populate('sender', USER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 })  // newest first — client reverses for display
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    messages,
  });
};

// ─── markRoomAsRead ───────────────────────────────────────────────────────────
// @route   PATCH /api/chat/rooms/:matchId/read
// @access  Private
//
// Marks all messages in a conversation as read by the current user.
// Called when the user opens a chat window via the REST API.
// The socket also fires mark_read events, but this endpoint handles
// the initial open and cases where the socket isn't connected.
//
// Uses $addToSet — idempotent, safe to call multiple times.
const markRoomAsRead = async (req, res) => {
  const { matchId } = req.params;

  // ── Verify participation ──────────────────────────────────────────────────
  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const isSender   = match.sender.toString()   === req.user.id.toString();
  const isReceiver = match.receiver.toString() === req.user.id.toString();

  if (!isSender && !isReceiver) {
    throw new AppError('You do not have access to this conversation', 403);
  }

  // ── Mark all unread messages in this room as read ─────────────────────────
  // $addToSet prevents adding the same userId twice — fully idempotent.
  // updateMany runs a single bulk operation — not a per-message loop.
  const result = await Message.updateMany(
    {
      match:  matchId,
      readBy: { $ne: req.user.id },
    },
    {
      $addToSet: { readBy: req.user.id },
    }
  );

  res.status(200).json({
    success:       true,
    message:       'Messages marked as read',
    updatedCount:  result.modifiedCount,
  });
};

module.exports = { getMyRooms, getMessageHistory, markRoomAsRead };
