
const Match    = require('../models/Match');
const Message  = require('../models/Message');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');


const USER_PUBLIC_FIELDS = 'name avatar';
const getMyRooms = async (req, res) => {

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
    .lean(); 

  const rooms = await Promise.all(
    matches.map(async (match) => {
      const matchId = match._id;

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
