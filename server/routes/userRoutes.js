/**
 * server/routes/userRoutes.js
 *
 * All user-profile and skill-management endpoints.
 *
 * Every route here requires a valid JWT — `protect` runs first on all of them.
 * router.use(protect) at the top applies it once instead of repeating
 * it on every single line.
 *
 * Route table:
 * ┌────────┬────────────────────────────────────┬──────────────────────────────┐
 * │ Method │ Path                               │ What it does                 │
 * ├────────┼────────────────────────────────────┼──────────────────────────────┤
 * │ GET    │ /api/users/profile                 │ My full profile              │
 * │ PUT    │ /api/users/profile                 │ Update name/bio/location     │
 * │ POST   │ /api/users/skills/offered          │ Add to skillsOffered         │
 * │ DELETE │ /api/users/skills/offered/:name    │ Remove from skillsOffered    │
 * │ POST   │ /api/users/skills/wanted           │ Add to skillsWanted          │
 * │ DELETE │ /api/users/skills/wanted/:name     │ Remove from skillsWanted     │
 * │ GET    │ /api/users/:id                     │ View any user's public page  │
 * └────────┴────────────────────────────────────┴──────────────────────────────┘
 *
 * ORDERING NOTE:
 * /profile and /skills/... are defined BEFORE /:id.
 * If /:id came first, Express would match /profile as an id parameter
 * and call getUserById with id="profile" — which would throw a CastError.
 * Specific routes must always come before parameterised ones.
 */

const express = require('express');
const {
  getMyProfile,
  getUserById,
  updateProfile,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect to ALL routes in this file at once
router.use(protect);

// ── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', getMyProfile);
router.put('/profile', updateProfile);

// ── Skills: Offered ───────────────────────────────────────────────────────
// :skillName in the URL is the skill to remove, e.g. /skills/offered/Python
router.post  ('/skills/offered',             addOfferedSkill);
router.delete('/skills/offered/:skillName',  removeOfferedSkill);

// ── Skills: Wanted ────────────────────────────────────────────────────────
router.post  ('/skills/wanted',              addWantedSkill);
router.delete('/skills/wanted/:skillName',   removeWantedSkill);

// ── Public profile — MUST be last ─────────────────────────────────────────
router.get('/:id', getUserById);

module.exports = router;
