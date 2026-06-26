/**
 * server/routes/authRoutes.js
 *
 * REPLACES the scaffold from Module 1.
 *
 * Route table:
 * ┌────────┬──────────────────────┬───────────┬────────────────────────────┐
 * │ Method │ Path                 │ Access    │ What it does               │
 * ├────────┼──────────────────────┼───────────┼────────────────────────────┤
 * │ POST   │ /api/auth/register   │ Public    │ Create account + get token │
 * │ POST   │ /api/auth/login      │ Public    │ Verify credentials + token │
 * │ GET    │ /api/auth/me         │ Private   │ Return logged-in user data │
 * │ POST   │ /api/auth/logout     │ Private   │ Signal client to clear JWT │
 * └────────┴──────────────────────┴───────────┴────────────────────────────┘
 *
 * "Private" means the request must include a valid JWT in the
 * Authorization header:  Authorization: Bearer <token>
 *
 * The `protect` middleware handles verification — if it passes,
 * req.user is set and the controller runs. If it fails, a 401
 * is returned before the controller is ever called.
 */

const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Public ─────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Private (JWT required) ────────────────────────────────────────────────
router.get ('/me',     protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
