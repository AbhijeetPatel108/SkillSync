/**
 * server/routes/matchRoutes.js
 *
 * All match request endpoints. Every route requires a valid JWT.
 *
 * Route table:
 * ┌────────┬──────────────────────────────┬──────────┬──────────────────────────────────┐
 * │ Method │ Path                         │ Access   │ What it does                     │
 * ├────────┼──────────────────────────────┼──────────┼──────────────────────────────────┤
 * │ POST   │ /api/matches                 │ Private  │ Send a match request             │
 * │ GET    │ /api/matches/sent            │ Private  │ View requests I sent             │
 * │ GET    │ /api/matches/received        │ Private  │ View requests I received         │
 * │ GET    │ /api/matches/accepted        │ Private  │ View my accepted matches         │
 * │ GET    │ /api/matches/:id             │ Private  │ View one match by ID             │
 * │ PATCH  │ /api/matches/:id/accept      │ Private  │ Accept a received request        │
 * │ PATCH  │ /api/matches/:id/reject      │ Private  │ Reject a received request        │
 * │ PATCH  │ /api/matches/:id/cancel      │ Private  │ Cancel a sent request            │
 * └────────┴──────────────────────────────┴──────────┴──────────────────────────────────┘
 *
 * ─── Why PATCH for accept/reject/cancel, not PUT? ───────────────────────────
 * PUT = replace the entire resource.
 * PATCH = modify one or more fields of an existing resource.
 * We are changing only the `status` field — that is a partial update → PATCH.
 *
 * ─── Route ordering rule ────────────────────────────────────────────────────
 * /sent, /received, /accepted are defined BEFORE /:id.
 * If /:id came first, Express would treat "sent" as an ID parameter,
 * try to cast it to a MongoDB ObjectId, and throw a CastError.
 * Specific static paths always come before parameterised paths.
 */

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

// All routes in this file require a valid JWT
router.use(protect);

// ── Static paths first (MUST come before /:id) ────────────────────────────
router.get('/sent',     getSentRequests);
router.get('/received', getReceivedRequests);
router.get('/accepted', getAcceptedMatches);

// ── Root resource ──────────────────────────────────────────────────────────
router.post('/', sendRequest);

// ── Parameterised paths last ───────────────────────────────────────────────
router.get   ('/:id',        getMatchById);
router.patch ('/:id/accept', acceptRequest);
router.patch ('/:id/reject', rejectRequest);
router.patch ('/:id/cancel', cancelRequest);

module.exports = router;
