/**
 * server/controllers/matchController.js
 *
 * All business logic for the match request system.
 *
 * MVC role: CONTROLLER — sits between routes and models.
 * Receives authenticated requests (req.user is always set by protect),
 * enforces business rules, talks to Match + User models, sends JSON.
 *
 * Express 5: async errors thrown here are forwarded to errorHandler
 * automatically — no try/catch anywhere in this file.
 *
 * Reused from existing codebase:
 *   AppError         → utils/AppError.js
 *   getPagination    → utils/helpers.js
 *   buildMeta        → utils/helpers.js
 *   MATCH_STATUS     → config/constants.js
 *
 * ─── 8 endpoints handled ────────────────────────────────────────────────────
 *   sendRequest       POST   /api/matches
 *   acceptRequest     PATCH  /api/matches/:id/accept
 *   rejectRequest     PATCH  /api/matches/:id/reject
 *   cancelRequest     PATCH  /api/matches/:id/cancel
 *   getSentRequests   GET    /api/matches/sent
 *   getReceivedRequests GET  /api/matches/received
 *   getAcceptedMatches  GET  /api/matches/accepted
 *   getMatchById      GET    /api/matches/:id
 */

const Match    = require('../models/Match');
const User     = require('../models/User');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');

// ─── Field whitelist for populated user data ──────────────────────────────────
// When we .populate() the sender/receiver fields, we only want to return
// the public-facing fields — never password, lastLogin, isActive, role.
// This string is passed to .populate({ select: USER_PUBLIC_FIELDS }).
const USER_PUBLIC_FIELDS = 'name avatar bio location skillsOffered skillsWanted';

// ─── sendRequest ─────────────────────────────────────────────────────────────
// @route   POST /api/matches
// @access  Private
// @body    { receiverId: string, message?: string }
//
// Creates a new match request from the logged-in user to another user.
// Enforces: no self-request, receiver must exist and be active,
//           no duplicate active request to the same person.
const sendRequest = async (req, res) => {
  const { receiverId, message } = req.body;

  // ── Validate receiverId is present ───────────────────────────────────────
  if (!receiverId) {
    throw new AppError('receiverId is required', 400);
  }

  // ── Prevent sending to yourself (Requirement 9) ───────────────────────────
  // Compare as strings — req.user.id is a string, receiverId from body is a string.
  // toString() on both ensures ObjectId vs string comparison never misfires.
  if (req.user.id.toString() === receiverId.toString()) {
    throw new AppError('You cannot send a match request to yourself', 400);
  }

  // ── Verify receiver exists and is active (Requirement 10) ─────────────────
  // We must confirm the target user is real before creating any document.
  // isActive check prevents sending to soft-deleted accounts.
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new AppError('User not found', 404);
  }
  if (!receiver.isActive) {
    throw new AppError('This user account is no longer active', 400);
  }

  // ── Duplicate prevention — controller layer (Requirement 8) ───────────────
  // Check if ANY match document already exists between this pair,
  // regardless of direction (A→B or B→A) and regardless of status.
  //
  // Why check both directions?
  //   If User A already sent to User B (pending/accepted/rejected),
  //   User B should not be able to also send a new request to User A —
  //   that would create two separate "relationship" documents for the same pair.
  //
  // Why check all statuses, not just pending?
  //   - If A sent to B and B rejected, A can send again after rejection.
  //   - If A sent to B and A cancelled, A can send again.
  //   - If A sent to B and it's accepted, no new request is needed.
  //
  //   Business rule: only block if a PENDING or ACCEPTED request exists.
  //   Rejected/cancelled means the relationship is "closed" — re-request is OK.
 // Existing request from same sender
let existingMatch = await Match.findOne({
  sender: req.user.id,
  receiver: receiverId,
});

if (existingMatch) {

  if (
    existingMatch.status === MATCH_STATUS.PENDING ||
    existingMatch.status === MATCH_STATUS.ACCEPTED
  ) {
    const msg =
      existingMatch.status === MATCH_STATUS.PENDING
        ? 'A pending match request already exists with this user'
        : 'You are already matched with this user';

    throw new AppError(msg, 409);
  }

  existingMatch.message = message ? message.trim() : '';
  existingMatch.status = MATCH_STATUS.PENDING;

  await existingMatch.save();

  await existingMatch.populate([
    { path: 'sender', select: USER_PUBLIC_FIELDS },
    { path: 'receiver', select: USER_PUBLIC_FIELDS },
  ]);

  return res.status(201).json({
    success: true,
    message: 'Match request sent successfully',
    match: existingMatch,
  });
}

// Reverse direction
const reverseMatch = await Match.findOne({
  sender: receiverId,
  receiver: req.user.id,
  status: {
    $in: [MATCH_STATUS.PENDING, MATCH_STATUS.ACCEPTED],
  },
});

if (reverseMatch) {
  const msg =
    reverseMatch.status === MATCH_STATUS.PENDING
      ? 'A pending match request already exists with this user'
      : 'You are already matched with this user';

  throw new AppError(msg, 409);
}

  // ── Validate optional message ──────────────────────────────────────────────
  if (message && message.trim().length > 300) {
    throw new AppError('Message cannot exceed 300 characters', 400);
  }

  // ── Create the match request ───────────────────────────────────────────────
  // The DB-level compound unique index on (sender, receiver) is a second layer
  // of protection against race conditions — two simultaneous POSTs cannot both
  // succeed even if both pass the controller check above.
  const match = await Match.create({
    sender:   req.user.id,
    receiver: receiverId,
    message:  message ? message.trim() : '',
    status:   MATCH_STATUS.PENDING,
  });

  // Populate both sides so the response includes user info, not just IDs
  await match.populate([
    { path: 'sender',   select: USER_PUBLIC_FIELDS },
    { path: 'receiver', select: USER_PUBLIC_FIELDS },
  ]);

  res.status(201).json({
    success: true,
    message: 'Match request sent successfully',
    match,
  });
};

// ─── acceptRequest ────────────────────────────────────────────────────────────
// @route   PATCH /api/matches/:id/accept
// @access  Private — only the RECEIVER can accept
//
// Changes status from 'pending' → 'accepted'.
const acceptRequest = async (req, res) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  // ── Only the receiver can accept ──────────────────────────────────────────
  // The sender cannot accept their own request.
  // We compare as strings because match.receiver is an ObjectId.
  if (match.receiver.toString() !== req.user.id.toString()) {
    throw new AppError('Only the recipient of this request can accept it', 403);
  }

  // ── Can only accept a pending request ────────────────────────────────────
  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(
      `Cannot accept a request that is already '${match.status}'`,
      400
    );
  }

  match.status = MATCH_STATUS.ACCEPTED;
  await match.save();

  await match.populate([
    { path: 'sender',   select: USER_PUBLIC_FIELDS },
    { path: 'receiver', select: USER_PUBLIC_FIELDS },
  ]);

  res.status(200).json({
    success: true,
    message: 'Match request accepted',
    match,
  });
};

// ─── rejectRequest ────────────────────────────────────────────────────────────
// @route   PATCH /api/matches/:id/reject
// @access  Private — only the RECEIVER can reject
//
// Changes status from 'pending' → 'rejected'.
const rejectRequest = async (req, res) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  if (match.receiver.toString() !== req.user.id.toString()) {
    throw new AppError('Only the recipient of this request can reject it', 403);
  }

  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(
      `Cannot reject a request that is already '${match.status}'`,
      400
    );
  }

  match.status = MATCH_STATUS.REJECTED;
  await match.save();

  await match.populate([
    { path: 'sender',   select: USER_PUBLIC_FIELDS },
    { path: 'receiver', select: USER_PUBLIC_FIELDS },
  ]);

  res.status(200).json({
    success: true,
    message: 'Match request rejected',
    match,
  });
};

// ─── cancelRequest ────────────────────────────────────────────────────────────
// @route   PATCH /api/matches/:id/cancel
// @access  Private — only the SENDER can cancel
//
// Changes status from 'pending' → 'cancelled'.
// Only the person who sent the request can withdraw it.
const cancelRequest = async (req, res) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  // ── Only the sender can cancel ────────────────────────────────────────────
  if (match.sender.toString() !== req.user.id.toString()) {
    throw new AppError('Only the sender of this request can cancel it', 403);
  }

  // ── Can only cancel a pending request ────────────────────────────────────
  // Once accepted, the match is live — cancellation of a live match
  // would be a different UX action (e.g. "end match"), handled later.
  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(
      `Cannot cancel a request that is already '${match.status}'`,
      400
    );
  }

  match.status = MATCH_STATUS.CANCELLED;
  await match.save();

  await match.populate([
    { path: 'sender',   select: USER_PUBLIC_FIELDS },
    { path: 'receiver', select: USER_PUBLIC_FIELDS },
  ]);

  res.status(200).json({
    success: true,
    message: 'Match request cancelled',
    match,
  });
};

// ─── getSentRequests ──────────────────────────────────────────────────────────
// @route   GET /api/matches/sent
// @access  Private
// @query   ?status=pending|accepted|rejected|cancelled  (optional filter)
//          ?page=1&limit=10
//
// Returns all match requests the logged-in user has SENT.
// Optionally filtered by status. Paginated.
const getSentRequests = async (req, res) => {
  const { status } = req.query;

  // ── Build filter ──────────────────────────────────────────────────────────
  const filter = { sender: req.user.id };

  if (status) {
    // Validate the status value before it touches the DB
    if (!Object.values(MATCH_STATUS).includes(status)) {
      throw new AppError(
        `Invalid status. Valid values: ${Object.values(MATCH_STATUS).join(', ')}`,
        400
      );
    }
    filter.status = status;
  }

  const { page, limit, skip } = getPagination(req.query);

  // Parallel queries — same pattern used in Module 4 skillController
  const [total, matches] = await Promise.all([
    Match.countDocuments(filter),
    Match.find(filter)
      .populate('receiver', USER_PUBLIC_FIELDS)  // show who was sent to
      .sort({ createdAt: -1 })                   // newest first
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    matches,
  });
};

// ─── getReceivedRequests ──────────────────────────────────────────────────────
// @route   GET /api/matches/received
// @access  Private
// @query   ?status=pending|accepted|rejected|cancelled  (optional)
//          ?page=1&limit=10
//
// Returns all match requests the logged-in user has RECEIVED.
// The "inbox" view — typically filtered to status=pending to show action items.
const getReceivedRequests = async (req, res) => {
  const { status } = req.query;

  const filter = { receiver: req.user.id };

  if (status) {
    if (!Object.values(MATCH_STATUS).includes(status)) {
      throw new AppError(
        `Invalid status. Valid values: ${Object.values(MATCH_STATUS).join(', ')}`,
        400
      );
    }
    filter.status = status;
  }

  const { page, limit, skip } = getPagination(req.query);

  const [total, matches] = await Promise.all([
    Match.countDocuments(filter),
    Match.find(filter)
      .populate('sender', USER_PUBLIC_FIELDS)   // show who sent the request
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    matches,
  });
};

// ─── getAcceptedMatches ───────────────────────────────────────────────────────
// @route   GET /api/matches/accepted
// @access  Private
// @query   ?page=1&limit=10
//
// Returns all ACCEPTED matches where the logged-in user is either sender
// or receiver. This is the "my matches" / connections view.
//
// Why $or on both sender and receiver?
//   An accepted match is mutual. User A sending and User B accepting means
//   both A and B should see this in their "accepted matches" list.
//   Querying only sender: req.user.id would miss matches where this user
//   was the receiver.
const getAcceptedMatches = async (req, res) => {
  const filter = {
    status: MATCH_STATUS.ACCEPTED,
    $or: [
      { sender:   req.user.id },
      { receiver: req.user.id },
    ],
  };

  const { page, limit, skip } = getPagination(req.query);

  const [total, matches] = await Promise.all([
    Match.countDocuments(filter),
    Match.find(filter)
      .populate('sender',   USER_PUBLIC_FIELDS)
      .populate('receiver', USER_PUBLIC_FIELDS)
      .sort({ updatedAt: -1 })   // sort by when they were accepted (updatedAt)
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    meta:    buildMeta(total, page, limit),
    matches,
  });
};

// ─── getMatchById ─────────────────────────────────────────────────────────────
// @route   GET /api/matches/:id
// @access  Private — only sender or receiver can view a specific match
//
// Returns a single match document by its ID.
// Useful when the frontend needs to show the full detail of one request.
const getMatchById = async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('sender',   USER_PUBLIC_FIELDS)
    .populate('receiver', USER_PUBLIC_FIELDS);

  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  // ── Access control: only the two parties can view this match ─────────────
  // A match is private to its two participants.
  // Other users must not be able to read it by guessing the ID.
  const userId = req.user.id.toString();
  const isSender   = match.sender.id.toString()   === userId;
  const isReceiver = match.receiver.id.toString() === userId;

  if (!isSender && !isReceiver) {
    throw new AppError('You do not have permission to view this match', 403);
  }

  res.status(200).json({
    success: true,
    match,
  });
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getSentRequests,
  getReceivedRequests,
  getAcceptedMatches,
  getMatchById,
};
