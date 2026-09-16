const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');

const serializeMessageRow = (row) => ({
  id: Number(row.id),
  match: Number(row.match_id || row.matchId || 0),
  content: row.content || '',
  createdAt: row.created_at || row.createdAt,
  sender: {
    id: Number(row.sender_id),
    name: row.sender_name || row.senderName || '',
    avatar: row.sender_avatar || row.senderAvatar || '',
  },
});

const getMyRooms = async (req, res) => {
  const [matchRows] = await pool.execute(
    `SELECT m.id, m.sender_id, m.receiver_id, m.status, m.updated_at,
            s.id AS sender_user_id, s.name AS sender_name, s.avatar AS sender_avatar,
            r.id AS receiver_user_id, r.name AS receiver_name, r.avatar AS receiver_avatar
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.status = ? AND (m.sender_id = ? OR m.receiver_id = ?)
     ORDER BY m.updated_at DESC`,
    [MATCH_STATUS.ACCEPTED, req.user.id, req.user.id]
  );

  const rooms = await Promise.all(
    matchRows.map(async (match) => {
      const isUserSender = Number(match.sender_id) === Number(req.user.id);
      const otherUser = isUserSender
        ? { id: Number(match.receiver_user_id), name: match.receiver_name, avatar: match.receiver_avatar || '' }
        : { id: Number(match.sender_user_id), name: match.sender_name, avatar: match.sender_avatar || '' };

      const [latestRows] = await pool.execute(
        `SELECT m.id, m.content, m.created_at, u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.match_id = ?
         ORDER BY m.created_at DESC LIMIT 1`,
        [match.id]
      );

      const [unreadRows] = await pool.execute(
        `SELECT COUNT(*) AS unread_count
         FROM messages m
         LEFT JOIN message_read_by mr
           ON mr.message_id = m.id AND mr.user_id = ?
         WHERE m.match_id = ? AND mr.user_id IS NULL`,
        [req.user.id, match.id]
      );

      return {
        matchId: Number(match.id),
        otherUser,
        latestMessage: latestRows[0] ? serializeMessageRow({
          ...latestRows[0],
          match_id: match.id,
        }) : null,
        unreadCount: Number(unreadRows[0]?.unread_count || 0),
        updatedAt: match.updated_at,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: rooms.length,
    rooms,
  });
};

const getMessageHistory = async (req, res) => {
  const { matchId } = req.params;

  const [matchRows] = await pool.execute(
    'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
    [matchId]
  );
  const match = matchRows[0];

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const isSender = Number(match.sender_id) === Number(req.user.id);
  const isReceiver = Number(match.receiver_id) === Number(req.user.id);

  if (!isSender && !isReceiver) {
    throw new AppError('You do not have access to this conversation', 403);
  }

  if (match.status !== MATCH_STATUS.ACCEPTED) {
    throw new AppError('Chat is only available for accepted matches', 400);
  }

  const rawQuery = { ...req.query };
  if (!rawQuery.limit) rawQuery.limit = '20';
  const { page, limit, skip } = getPagination(rawQuery);

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM messages WHERE match_id = ?',
    [matchId]
  );

  const [messageRows] = await pool.execute(
    `SELECT m.id, m.match_id, m.content, m.created_at,
            u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.match_id = ?
     ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [matchId, limit, skip]
  );

  const messages = messageRows.map((row) => serializeMessageRow(row)).reverse();

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0]?.total || 0), page, limit),
    messages,
  });
};

const markRoomAsRead = async (req, res) => {
  const { matchId } = req.params;

  const [matchRows] = await pool.execute(
    'SELECT id, sender_id, receiver_id FROM matches WHERE id = ? LIMIT 1',
    [matchId]
  );
  const match = matchRows[0];
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const isSender = Number(match.sender_id) === Number(req.user.id);
  const isReceiver = Number(match.receiver_id) === Number(req.user.id);
  if (!isSender && !isReceiver) {
    throw new AppError('You do not have access to this conversation', 403);
  }

  const [result] = await pool.execute(
    `INSERT INTO message_read_by (message_id, user_id)
     SELECT m.id, ?
     FROM messages m
     WHERE m.match_id = ?
       AND NOT EXISTS (SELECT 1 FROM message_read_by mr WHERE mr.message_id = m.id AND mr.user_id = ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
    [req.user.id, matchId, req.user.id]
  );

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
    updatedCount: Number(result && result.affectedRows ? result.affectedRows : 0),
  });
};

module.exports = { getMyRooms, getMessageHistory, markRoomAsRead };
