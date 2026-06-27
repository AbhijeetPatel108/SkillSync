/**
 * server/routes/reviewRoutes.js
 *
 * All review endpoints. Every route requires a valid JWT via protect.
 *
 * Route table:
 * ┌────────┬──────────────────────────────┬──────────┬──────────────────────────────────────┐
 * │ Method │ Path                         │ Access   │ What it does                         │
 * ├────────┼──────────────────────────────┼──────────┼──────────────────────────────────────┤
 * │ POST   │ /api/reviews                 │ Private  │ Submit a review for a matched user    │
 * │ GET    │ /api/reviews/me              │ Private  │ Reviews I have received               │
 * │ GET    │ /api/reviews/given           │ Private  │ Reviews I have written                │
 * │ GET    │ /api/reviews/user/:id        │ Private  │ All reviews for any user by their ID  │
 * │ GET    │ /api/reviews/:id             │ Private  │ Single review by its document ID      │
 * │ DELETE │ /api/reviews/:id             │ Private  │ Delete my own review                  │
 * └────────┴──────────────────────────────┴──────────┴──────────────────────────────────────┘
 *
 * ─── Critical route ordering ─────────────────────────────────────────────────
 *
 * /me, /given, /user/:id  →  defined BEFORE  /:id
 *
 * Express matches routes top-to-bottom. If /:id were first:
 *   GET /api/reviews/me    → Express reads "me" as the :id param
 *   GET /api/reviews/given → Express reads "given" as the :id param
 * Both would try to cast "me"/"given" to a MongoDB ObjectId and throw CastError.
 *
 * Rule (same as all previous modules):
 *   Static paths always above parameterised paths.
 */

const express = require('express');
const {
  createReview,
  getUserReviews,
  getMyReviews,
  getGivenReviews,
  deleteReview,
  getReviewById,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All review routes require authentication
router.use(protect);

// ── Static paths (MUST come before /:id) ──────────────────────────────────
router.get('/me',          getMyReviews);
router.get('/given',       getGivenReviews);
router.get('/user/:id',    getUserReviews);

// ── Root ───────────────────────────────────────────────────────────────────
router.post('/', createReview);

// ── Parameterised (must come last) ─────────────────────────────────────────
router.get   ('/:id', getReviewById);
router.delete('/:id', deleteReview);

module.exports = router;
