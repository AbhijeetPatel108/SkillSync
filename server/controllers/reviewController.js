const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { MATCH_STATUS } = require('../config/constants');
const { fetchUsersPublicMap } = require('../utils/userSql');

const recalcUserStats = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
     FROM reviews WHERE reviewee_id = ?`,
    [userId]
  );

  const avg = Number(rows[0]?.avg_rating || 0);
  const total = Number(rows[0]?.total_reviews || 0);

  await pool.execute(
    'UPDATE users SET average_rating = ?, total_reviews = ? WHERE id = ?',
    [avg, total, userId]
  );
};

const serializeUserSummary = (row) => ({
  id: Number(row.id),
  name: row.name,
  avatar: row.avatar || '',
  bio: row.bio || '',
  location: row.location || '',
  averageRating: Number(row.average_rating || row.averageRating || 0),
  totalReviews: Number(row.total_reviews || row.totalReviews || 0),
  skillsOffered: row.skillsOffered || [],
  skillsWanted: row.skillsWanted || [],
});

const getReviewWithUsers = async (reviewId) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.match_id, r.rating, r.comment, r.created_at, r.updated_at,
            rr.id AS reviewer_user_id, rr.name AS reviewer_name, rr.avatar AS reviewer_avatar,
            rr.bio AS reviewer_bio, rr.location AS reviewer_location,
            rr.average_rating AS reviewer_average_rating, rr.total_reviews AS reviewer_total_reviews,
            re.id AS reviewee_user_id, re.name AS reviewee_name, re.avatar AS reviewee_avatar,
            re.bio AS reviewee_bio, re.location AS reviewee_location,
            re.average_rating AS reviewee_average_rating, re.total_reviews AS reviewee_total_reviews
     FROM reviews r
     JOIN users rr ON rr.id = r.reviewer_id
     JOIN users re ON re.id = r.reviewee_id
     WHERE r.id = ? LIMIT 1`,
    [reviewId]
  );

  const reviewRow = rows[0];
  if (!reviewRow) return null;

  const reviewerMap = await fetchUsersPublicMap([Number(reviewRow.reviewer_user_id), Number(reviewRow.reviewee_user_id)]);
  const reviewer = serializeUserSummary({
    id: reviewRow.reviewer_user_id,
    name: reviewRow.reviewer_name,
    avatar: reviewRow.reviewer_avatar,
    bio: reviewRow.reviewer_bio,
    location: reviewRow.reviewer_location,
    average_rating: reviewRow.reviewer_average_rating,
    total_reviews: reviewRow.reviewer_total_reviews,
    skillsOffered: reviewerMap.get(Number(reviewRow.reviewer_user_id))?.skillsOffered || [],
    skillsWanted: reviewerMap.get(Number(reviewRow.reviewer_user_id))?.skillsWanted || [],
  });

  const reviewee = serializeUserSummary({
    id: reviewRow.reviewee_user_id,
    name: reviewRow.reviewee_name,
    avatar: reviewRow.reviewee_avatar,
    bio: reviewRow.reviewee_bio,
    location: reviewRow.reviewee_location,
    average_rating: reviewRow.reviewee_average_rating,
    total_reviews: reviewRow.reviewee_total_reviews,
    skillsOffered: reviewerMap.get(Number(reviewRow.reviewee_user_id))?.skillsOffered || [],
    skillsWanted: reviewerMap.get(Number(reviewRow.reviewee_user_id))?.skillsWanted || [],
  });

  return {
    id: Number(reviewRow.id),
    reviewer,
    reviewee,
    rating: Number(reviewRow.rating),
    comment: reviewRow.comment || '',
    createdAt: reviewRow.created_at,
    updatedAt: reviewRow.updated_at,
    matchId: Number(reviewRow.match_id),
  };
};

const createReview = async (req, res) => {
  const { revieweeId, matchId, rating, comment } = req.body;

  if (!revieweeId) throw new AppError('revieweeId is required', 400);
  if (!matchId) throw new AppError('matchId is required', 400);
  if (rating === undefined || rating === null) throw new AppError('rating is required', 400);

  if (Number(req.user.id) === Number(revieweeId)) {
    throw new AppError('You cannot review yourself', 400);
  }

  const parsedRating = Number.parseInt(rating, 10);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new AppError('Rating must be a whole number between 1 and 5', 400);
  }

  if (comment && String(comment).trim().length > 500) {
    throw new AppError('Comment cannot exceed 500 characters', 400);
  }

  const [matchRows] = await pool.execute(
    'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
    [matchId]
  );
  const match = matchRows[0];

  if (!match) {
    throw new AppError('Match not found', 404);
  }
  if (match.status !== MATCH_STATUS.ACCEPTED) {
    throw new AppError('You can only review users from an accepted match', 400);
  }

  const isSender = Number(match.sender_id) === Number(req.user.id);
  const isReceiver = Number(match.receiver_id) === Number(req.user.id);
  if (!isSender && !isReceiver) {
    throw new AppError('You were not a participant in this match', 403);
  }

  const otherParticipantId = isSender ? match.receiver_id : match.sender_id;
  if (Number(revieweeId) !== Number(otherParticipantId)) {
    throw new AppError('You can only review the other participant of this match', 400);
  }

  const [existingRows] = await pool.execute(
    'SELECT id FROM reviews WHERE reviewer_id = ? AND match_id = ? LIMIT 1',
    [req.user.id, matchId]
  );
  if (existingRows[0]) {
    throw new AppError('You have already submitted a review for this match', 409);
  }

  const trimmedComment = comment ? String(comment).trim() : '';
  const [result] = await pool.execute(
    'INSERT INTO reviews (reviewer_id, reviewee_id, match_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, revieweeId, matchId, parsedRating, trimmedComment]
  );

  await recalcUserStats(revieweeId);

  const review = await getReviewWithUsers(result.insertId);
  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review,
  });
};

const getUserReviews = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { id: revieweeId } = req.params;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM reviews WHERE reviewee_id = ?',
    [revieweeId]
  );

  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
            rr.id AS reviewer_id, rr.name AS reviewer_name, rr.avatar AS reviewer_avatar,
            rr.bio AS reviewer_bio, rr.location AS reviewer_location,
            rr.average_rating AS reviewer_average_rating, rr.total_reviews AS reviewer_total_reviews
     FROM reviews r
     JOIN users rr ON rr.id = r.reviewer_id
     WHERE r.reviewee_id = ?
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [revieweeId, limit, skip]
  );

  const mappedReviews = rows.map((row) => ({
    id: Number(row.id),
    reviewer: serializeUserSummary({
      id: row.reviewer_id,
      name: row.reviewer_name,
      avatar: row.reviewer_avatar,
      bio: row.reviewer_bio,
      location: row.reviewer_location,
      average_rating: row.reviewer_average_rating,
      total_reviews: row.reviewer_total_reviews,
    }),
    rating: Number(row.rating),
    comment: row.comment || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    reviews: mappedReviews,
  });
};

const getMyReviews = async (req, res) => {
  req.params = { id: req.user.id };
  return getUserReviews(req, res);
};

const getGivenReviews = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM reviews WHERE reviewer_id = ?',
    [req.user.id]
  );

  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
            re.id AS reviewee_id, re.name AS reviewee_name, re.avatar AS reviewee_avatar,
            re.bio AS reviewee_bio, re.location AS reviewee_location,
            re.average_rating AS reviewee_average_rating, re.total_reviews AS reviewee_total_reviews
     FROM reviews r
     JOIN users re ON re.id = r.reviewee_id
     WHERE r.reviewer_id = ?
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, skip]
  );

  const mappedReviews = rows.map((row) => ({
    id: Number(row.id),
    reviewee: serializeUserSummary({
      id: row.reviewee_id,
      name: row.reviewee_name,
      avatar: row.reviewee_avatar,
      bio: row.reviewee_bio,
      location: row.reviewee_location,
      average_rating: row.reviewee_average_rating,
      total_reviews: row.reviewee_total_reviews,
    }),
    rating: Number(row.rating),
    comment: row.comment || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    reviews: mappedReviews,
  });
};

const deleteReview = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, reviewer_id, reviewee_id FROM reviews WHERE id = ? LIMIT 1',
    [req.params.id]
  );

  const review = rows[0];
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (Number(review.reviewer_id) !== Number(req.user.id)) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  await pool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  await recalcUserStats(review.reviewee_id);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
};

const getReviewById = async (req, res) => {
  const review = await getReviewWithUsers(req.params.id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  res.status(200).json({ success: true, review });
};

module.exports = {
  createReview,
  getUserReviews,
  getMyReviews,
  getGivenReviews,
  deleteReview,
  getReviewById,
};
