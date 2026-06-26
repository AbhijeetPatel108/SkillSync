/**
 * server/routes/authRoutes.js
 *
 * Authentication routes.
 *
 * This file is scaffolded now so app.js can safely import it.
 * The full route table is wired up in Module 2 (Authentication).
 *
 * Final route table (Module 2):
 * ┌────────┬──────────────────────┬──────────┬─────────────────┐
 * │ Method │ Path                 │ Access   │ Controller      │
 * ├────────┼──────────────────────┼──────────┼─────────────────┤
 * │ POST   │ /api/auth/register   │ Public   │ register        │
 * │ POST   │ /api/auth/login      │ Public   │ login           │
 * │ GET    │ /api/auth/me         │ Private  │ getMe           │
 * │ POST   │ /api/auth/logout     │ Private  │ logout          │
 * └────────┴──────────────────────┴──────────┴─────────────────┘
 */

const express = require('express');

const router = express.Router();

// ── Placeholder — replaced in Module 2 ────────────────────────────────────
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: 'Auth routes are live ✅' });
});

module.exports = router;
