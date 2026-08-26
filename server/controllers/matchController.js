const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');
const { fetchUsersPublicMap } = require('../utils/userSql');
const normalizePublicUser = (user) => ({
  id: Number(user.id),
  name: user.name,
  avatar: user.avatar || '',
  bio: user.bio || '',
  location: user.location || '',
  averageRating: Number(user.average_rating || user.averageRating || 0),
  totalReviews: Number(user.total_reviews || user.totalReviews || 0),
  skillsOffered: user.skillsOffered || [],
  skillsWanted: user.skillsWanted || [],
});

const getMatchWithUsers = async (matchId) => {
  const [rows] = await pool.execute(
    `SELECT m.id, m.sender_id, m.receiver_id, m.status, m.message, m.created_at, m.updated_at,
            s.id AS sender_user_id, s.name AS sender_name, s.avatar AS sender_avatar,
            s.bio AS sender_bio, s.location AS sender_location,
            s.average_rating AS sender_average_rating, s.total_reviews AS sender_total_reviews,
            r.id AS receiver_user_id, r.name AS receiver_name, r.avatar AS receiver_avatar,
            r.bio AS receiver_bio, r.location AS receiver_location,
            r.average_rating AS receiver_average_rating, r.total_reviews AS receiver_total_reviews
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.id = ? LIMIT 1`,
    [matchId]
  );

  const row = rows[0];
  if (!row) return null;

  const senderUser = normalizePublicUser({
    id: row.sender_user_id,
    name: row.sender_name,
    avatar: row.sender_avatar,
    bio: row.sender_bio,
    location: row.sender_location,
    average_rating: row.sender_average_rating,
    total_reviews: row.sender_total_reviews,
  });

  const receiverUser = normalizePublicUser({
    id: row.receiver_user_id,
    name: row.receiver_name,
    avatar: row.receiver_avatar,
    bio: row.receiver_bio,
    location: row.receiver_location,
    average_rating: row.receiver_average_rating,
    total_reviews: row.receiver_total_reviews,
  });

  const userMap = await fetchUsersPublicMap([Number(row.sender_user_id), Number(row.receiver_user_id)]);
  senderUser.skillsOffered = (userMap.get(Number(row.sender_user_id))?.skillsOffered) || [];
  senderUser.skillsWanted = (userMap.get(Number(row.sender_user_id))?.skillsWanted) || [];
  receiverUser.skillsOffered = (userMap.get(Number(row.receiver_user_id))?.skillsOffered) || [];
  receiverUser.skillsWanted = (userMap.get(Number(row.receiver_user_id))?.skillsWanted) || [];

  return {
    id: Number(row.id),
    sender: senderUser,
    receiver: receiverUser,
    status: row.status,
    message: row.message || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getMatchList = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  if (!rows.length) return [];

  const userIds = [...new Set(rows.flatMap((row) => [Number(row.sender_id), Number(row.receiver_id)]))];
  const userMap = await fetchUsersPublicMap(userIds);

  return rows.map((row) => {
    const sender = userMap.get(Number(row.sender_id)) || normalizePublicUser({
      id: row.sender_id,
      name: row.sender_name,
      avatar: row.sender_avatar,
      bio: row.sender_bio,
      location: row.sender_location,
      average_rating: row.sender_average_rating,
      total_reviews: row.sender_total_reviews,
    });

    const receiver = userMap.get(Number(row.receiver_id)) || normalizePublicUser({
      id: row.receiver_id,
      name: row.receiver_name,
      avatar: row.receiver_avatar,
      bio: row.receiver_bio,
      location: row.receiver_location,
      average_rating: row.receiver_average_rating,
      total_reviews: row.receiver_total_reviews,
    });

    return {
      id: Number(row.id),
      sender,
      receiver,
      status: row.status,
      message: row.message || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
};

const sendRequest = async (req, res) => {
  const { receiverId, message } = req.body;

  if (!receiverId) {
    throw new AppError('receiverId is required', 400);
  }

  if (Number(req.user.id) === Number(receiverId)) {
    throw new AppError('You cannot send a match request to yourself', 400);
  }

  const trimmedMessage = message ? String(message).trim() : '';
  if (trimmedMessage.length > 300) {
    throw new AppError('Message cannot exceed 300 characters', 400);
  }

  const [receiverRows] = await pool.execute(
    'SELECT id, is_active FROM users WHERE id = ? LIMIT 1',
    [receiverId]
  );

  const receiver = receiverRows[0];
  if (!receiver) {
    throw new AppError('User not found', 404);
  }
  if (!receiver.is_active) {
    throw new AppError('This user account is no longer active', 400);
  }

  const [existingRows] = await pool.execute(
    `SELECT id, sender_id, receiver_id, status, message
     FROM matches
     WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       AND status IN (?, ?)
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, receiverId, receiverId, req.user.id, MATCH_STATUS.PENDING, MATCH_STATUS.ACCEPTED]
  );

  if (existingRows[0]) {
    const existing = existingRows[0];
    const msg = existing.status === MATCH_STATUS.PENDING
      ? 'A pending match request already exists with this user'
      : 'You are already matched with this user';

    if (existing.status === MATCH_STATUS.PENDING || existing.status === MATCH_STATUS.ACCEPTED) {
      throw new AppError(msg, 409);
    }
  }

  const [reverseRows] = await pool.execute(
    `SELECT id, status FROM matches
     WHERE sender_id = ? AND receiver_id = ? AND status IN (?, ?)
     ORDER BY created_at DESC LIMIT 1`,
    [receiverId, req.user.id, MATCH_STATUS.PENDING, MATCH_STATUS.ACCEPTED]
  );

  if (reverseRows[0]) {
    const reverseMatch = reverseRows[0];
    const msg = reverseMatch.status === MATCH_STATUS.PENDING
      ? 'A pending match request already exists with this user'
      : 'You are already matched with this user';
    throw new AppError(msg, 409);
  }

  const [sameSenderRows] = await pool.execute(
    `SELECT id, status FROM matches
     WHERE sender_id = ? AND receiver_id = ?
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, receiverId]
  );

  if (sameSenderRows[0]) {
    const sameSender = sameSenderRows[0];
    if (sameSender.status === MATCH_STATUS.PENDING || sameSender.status === MATCH_STATUS.ACCEPTED) {
      throw new AppError(sameSender.status === MATCH_STATUS.PENDING ? 'A pending match request already exists with this user' : 'You are already matched with this user', 409);
    }

    await pool.execute(
      'UPDATE matches SET status = ?, message = ? WHERE id = ?',
      [MATCH_STATUS.PENDING, trimmedMessage, sameSender.id]
    );

    const match = await getMatchWithUsers(sameSender.id);
    return res.status(201).json({
      success: true,
      message: 'Match request sent successfully',
      match,
    });
  }

  const [result] = await pool.execute(
    'INSERT INTO matches (sender_id, receiver_id, message, status) VALUES (?, ?, ?, ?)',
    [req.user.id, receiverId, trimmedMessage, MATCH_STATUS.PENDING]
  );

  const match = await getMatchWithUsers(result.insertId);
  res.status(201).json({
    success: true,
    message: 'Match request sent successfully',
    match,
  });
};

const acceptRequest = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
    [req.params.id]
  );

  const match = rows[0];
  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  if (Number(match.receiver_id) !== Number(req.user.id)) {
    throw new AppError('Only the recipient of this request can accept it', 403);
  }

  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(`Cannot accept a request that is already '${match.status}'`, 400);
  }

  await pool.execute('UPDATE matches SET status = ? WHERE id = ?', [MATCH_STATUS.ACCEPTED, req.params.id]);
  const updated = await getMatchWithUsers(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Match request accepted',
    match: updated,
  });
};

const rejectRequest = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
    [req.params.id]
  );

  const match = rows[0];
  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  if (Number(match.receiver_id) !== Number(req.user.id)) {
    throw new AppError('Only the recipient of this request can reject it', 403);
  }

  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(`Cannot reject a request that is already '${match.status}'`, 400);
  }

  await pool.execute('UPDATE matches SET status = ? WHERE id = ?', [MATCH_STATUS.REJECTED, req.params.id]);
  const updated = await getMatchWithUsers(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Match request rejected',
    match: updated,
  });
};

const cancelRequest = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
    [req.params.id]
  );

  const match = rows[0];
  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  if (Number(match.sender_id) !== Number(req.user.id)) {
    throw new AppError('Only the sender of this request can cancel it', 403);
  }

  if (match.status !== MATCH_STATUS.PENDING) {
    throw new AppError(`Cannot cancel a request that is already '${match.status}'`, 400);
  }

  await pool.execute('UPDATE matches SET status = ? WHERE id = ?', [MATCH_STATUS.CANCELLED, req.params.id]);
  const updated = await getMatchWithUsers(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Match request cancelled',
    match: updated,
  });
};

const getSentRequests = async (req, res) => {
  const { status } = req.query;
  const validStatus = Object.values(MATCH_STATUS);
  const filterStatus = status && validStatus.includes(status) ? status : MATCH_STATUS.PENDING;
  const { page, limit, skip } = getPagination(req.query);

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM matches WHERE sender_id = ? AND status = ?',
    [req.user.id, filterStatus]
  );

  const [rows] = await pool.execute(
    `SELECT m.*, s.id AS sender_id, s.name AS sender_name, s.avatar AS sender_avatar,
            s.bio AS sender_bio, s.location AS sender_location,
            s.average_rating AS sender_average_rating, s.total_reviews AS sender_total_reviews,
            r.id AS receiver_id, r.name AS receiver_name, r.avatar AS receiver_avatar,
            r.bio AS receiver_bio, r.location AS receiver_location,
            r.average_rating AS receiver_average_rating, r.total_reviews AS receiver_total_reviews
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.sender_id = ? AND m.status = ?
     ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, filterStatus, limit, skip]
  );

  const matches = await getMatchList(
    `SELECT m.*, s.id AS sender_id, s.name AS sender_name, s.avatar AS sender_avatar,
            s.bio AS sender_bio, s.location AS sender_location,
            s.average_rating AS sender_average_rating, s.total_reviews AS sender_total_reviews,
            r.id AS receiver_id, r.name AS receiver_name, r.avatar AS receiver_avatar,
            r.bio AS receiver_bio, r.location AS receiver_location,
            r.average_rating AS receiver_average_rating, r.total_reviews AS receiver_total_reviews
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.sender_id = ? AND m.status = ?
     ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, filterStatus, limit, skip]
  );

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    matches,
  });
};

const getReceivedRequests = async (req, res) => {
  const { status } = req.query;
  const validStatus = Object.values(MATCH_STATUS);
  const filterStatus = status && validStatus.includes(status) ? status : MATCH_STATUS.PENDING;
  const { page, limit, skip } = getPagination(req.query);

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM matches WHERE receiver_id = ? AND status = ?',
    [req.user.id, filterStatus]
  );

  const matches = await getMatchList(
    `SELECT m.*, s.id AS sender_id, s.name AS sender_name, s.avatar AS sender_avatar,
            s.bio AS sender_bio, s.location AS sender_location,
            s.average_rating AS sender_average_rating, s.total_reviews AS sender_total_reviews,
            r.id AS receiver_id, r.name AS receiver_name, r.avatar AS receiver_avatar,
            r.bio AS receiver_bio, r.location AS receiver_location,
            r.average_rating AS receiver_average_rating, r.total_reviews AS receiver_total_reviews
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.receiver_id = ? AND m.status = ?
     ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, filterStatus, limit, skip]
  );

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    matches,
  });
};

const getAcceptedMatches = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM matches WHERE status = ? AND (sender_id = ? OR receiver_id = ?)`,
    [MATCH_STATUS.ACCEPTED, req.user.id, req.user.id]
  );

  const matches = await getMatchList(
    `SELECT m.*, s.id AS sender_id, s.name AS sender_name, s.avatar AS sender_avatar,
            s.bio AS sender_bio, s.location AS sender_location,
            s.average_rating AS sender_average_rating, s.total_reviews AS sender_total_reviews,
            r.id AS receiver_id, r.name AS receiver_name, r.avatar AS receiver_avatar,
            r.bio AS receiver_bio, r.location AS receiver_location,
            r.average_rating AS receiver_average_rating, r.total_reviews AS receiver_total_reviews
     FROM matches m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.status = ? AND (m.sender_id = ? OR m.receiver_id = ?)
     ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`,
    [MATCH_STATUS.ACCEPTED, req.user.id, req.user.id, limit, skip]
  );

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    matches,
  });
};

const getMatchById = async (req, res) => {
  const match = await getMatchWithUsers(req.params.id);
  if (!match) {
    throw new AppError('Match request not found', 404);
  }

  const userId = Number(req.user.id);
  const isSender = Number(match.sender.id) === userId;
  const isReceiver = Number(match.receiver.id) === userId;

  if (!isSender && !isReceiver) {
    throw new AppError('You do not have permission to view this match', 403);
  }

  res.status(200).json({ success: true, match });
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
