const express = require('express');
const { getMyRooms, getMessageHistory, markRoomAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get  ('/rooms',                     getMyRooms);
router.get  ('/rooms/:matchId/messages',   getMessageHistory);
router.patch('/rooms/:matchId/read',       markRoomAsRead);

module.exports = router;
