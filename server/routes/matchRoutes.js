

const express = require('express');
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getSentRequests,
  getReceivedRequests,
  getAcceptedMatches,
  getMatchById,
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.use(protect);


router.get('/sent',     getSentRequests);
router.get('/received', getReceivedRequests);
router.get('/accepted', getAcceptedMatches);


router.post('/', sendRequest);


router.get   ('/:id',        getMatchById);
router.patch ('/:id/accept', acceptRequest);
router.patch ('/:id/reject', rejectRequest);
router.patch ('/:id/cancel', cancelRequest);

module.exports = router;
