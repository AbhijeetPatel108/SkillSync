/**
 * server/routes/chatRoutes.js
 *
 * REST HTTP routes for the SkillSync chat system.
 *
 * Route table:
 * ┌────────┬──────────────────────────────────────┬──────────┬──────────────────────────────────────┐
 * │ Method │ Path                                 │ Access   │ What it does                         │
 * ├────────┼──────────────────────────────────────┼──────────┼──────────────────────────────────────┤
 * │ GET    │ /api/chat/rooms                      │ Private  │ All my conversations (sidebar data)  │
 * │ GET    │ /api/chat/rooms/:matchId/messages    │ Private  │ Paginated message history for a room │
 * │ PATCH  │ /api/chat/rooms/:matchId/read        │ Private  │ Mark all messages in room as read    │
 * └────────┴──────────────────────────────────────┴──────────┴──────────────────────────────────────┘
 *
 * ─── Route ordering note ─────────────────────────────────────────────────────
 *
 * Both /rooms and /rooms/:matchId/messages start with /rooms.
 * Express correctly distinguishes them because:
 *   - GET /rooms           has no path segment after /rooms
 *   - GET /rooms/:matchId/messages has TWO more path segments
 * No ordering conflict here — both patterns are unambiguous.
 *
 * ─── Why PATCH for mark-as-read? ─────────────────────────────────────────────
 * We are partially updating message documents (adding a userId to readBy).
 * That is a partial modification → PATCH, not PUT (full replacement).
 * Consistent with the PATCH pattern used in matchRoutes.js.
 */

const express = require('express');
const { getMyRooms, getMessageHistory, markRoomAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require a valid JWT
router.use(protect);

router.get  ('/rooms',                     getMyRooms);
router.get  ('/rooms/:matchId/messages',   getMessageHistory);
router.patch('/rooms/:matchId/read',       markRoomAsRead);

module.exports = router;
