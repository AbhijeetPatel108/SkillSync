/**
 * server/routes/skillRoutes.js
 *
 * Skill discovery routes.
 *
 * Route table:
 * ┌────────┬─────────────┬──────────┬───────────────────────────────────────┐
 * │ Method │ Path        │ Access   │ What it does                          │
 * ├────────┼─────────────┼──────────┼───────────────────────────────────────┤
 * │ GET    │ /api/skills │ Private  │ Browse, search, filter, sort, paginate│
 * └────────┴─────────────┴──────────┴───────────────────────────────────────┘
 *
 * Query parameters (all optional, all combinable):
 *   ?search=python           partial skill name match
 *   ?userName=ali            partial user name match
 *   ?category=Technology     exact category match
 *   ?level=Expert            exact level match
 *   ?location=bangalore      partial location match
 *   ?sort=newest             newest | oldest | az | za
 *   ?page=1                  page number
 *   ?limit=10                results per page (max 50)
 *
 * Why is this a separate route file and not merged into userRoutes.js?
 *  - Single Responsibility: user routes manage a user's own data;
 *    skill routes serve the public discovery feed.
 *  - In Module 5 (Matches), skill listings will also need to show
 *    "already matched" status — keeping it separate makes that extension clean.
 *  - Clear URL namespace: /api/users/* = profile actions,
 *                         /api/skills  = discovery
 */

const express = require('express');
const { getSkillListings } = require('../controllers/skillController');
const { protect }          = require('../middleware/authMiddleware');

const router = express.Router();

// protect ensures:
//  1. Only authenticated users can browse listings
//  2. req.user.id is available so we can exclude the requester from results
router.get('/', protect, getSkillListings);

module.exports = router;
