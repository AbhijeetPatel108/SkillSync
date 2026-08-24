

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


router.use(protect);


router.get('/me',          getMyReviews);
router.get('/given',       getGivenReviews);
router.get('/user/:id',    getUserReviews);


router.post('/', createReview);


router.get   ('/:id', getReviewById);
router.delete('/:id', deleteReview);

module.exports = router;
