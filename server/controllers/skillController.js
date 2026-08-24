/**
 * server/controllers/skillController.js
 *
 * Handles skill discovery — browsing, searching, filtering, sorting,
 * and paginating users who offer skills.
 *
 * MVC role: CONTROLLER
 * This file contains one exported function: getSkillListings.
 * All query-building logic lives here, keeping the route file clean.
 *
 * Key design decisions explained inline:
 *  - We query the USER collection (not a separate skills collection)
 *    because skills are embedded in the user document (Module 2 design).
 *  - We use MongoDB's $elemMatch to filter inside arrays efficiently.
 *  - We use .select() to explicitly whitelist returned fields so
 *    sensitive data (password, lastLogin, isActive, role) can never leak.
 *  - We run countDocuments() and find() as parallel promises so we
 *    don't pay two sequential round-trips to MongoDB.
 *
 * Reused from existing codebase (nothing reimplemented):
 *  - AppError          from utils/AppError.js
 *  - getPagination     from utils/helpers.js
 *  - buildMeta         from utils/helpers.js
 *  - SKILL_CATEGORIES  from config/constants.js
 *  - SKILL_LEVELS      from config/constants.js
 */

const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { SKILL_CATEGORIES, SKILL_LEVELS } = require('../config/constants');
const { fetchUsersPublicMap } = require('../utils/userSql');

// ─── Field whitelist ──────────────────────────────────────────────────────────
// These are the ONLY fields ever returned by the listings endpoint.
// Defined once at module level so it can't accidentally drift between
// the count query and the data query.
//
// We never select: password (select:false in schema), lastLogin, isActive, role.
// Keeping this list explicit means adding a new sensitive field to the User
// schema won't automatically expose it here.
const PUBLIC_FIELDS = 'name avatar bio location skillsOffered skillsWanted createdAt';

// ─── Sort options whitelist ───────────────────────────────────────────────────
// Maps the URL-friendly ?sort= value to a Mongoose sort object.
// Whitelisting prevents arbitrary sort injection from query strings.
//
// newest   → sort by createdAt descending (most recently joined first)
// oldest   → sort by createdAt ascending
// az       → sort by name A→Z
// za       → sort by name Z→A
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt:  1 },
  az:     { name:       1 },
  za:     { name:      -1 },
};

// ─── buildQuery ───────────────────────────────────────────────────────────────
/**
 * Constructs the MongoDB filter object from validated query parameters.
 *
 * Extracted into its own function so it can be unit-tested independently
 * of Express (no req/res needed to test query logic).
 *
 * @param {object} params - Cleaned, validated query params
 * @param {string} currentUserId - The logged-in user's _id (to exclude)
 * @returns {object} MongoDB filter object ready for User.find(filter)
 */
const buildQuery = ({ search, userName, category, level, location }, currentUserId) => {
  const filter = {};

  // ── 1. Always exclude the requesting user ─────────────────────────────────
  // Rule 9 from the requirements: the logged-in user must never appear
  // in their own skill listings. They can't match with themselves.
  // We convert to string because req.user.id is already a string,
  // but currentUserId might be an ObjectId from Mongoose.
  filter._id = { $ne: currentUserId };

  // ── 2. Always exclude inactive accounts ──────────────────────────────────
  // Soft-deleted users should never appear publicly.
  filter.isActive = true;

  // ── 3. Skill name search ($elemMatch + $regex) ────────────────────────────
  // ?search=python  →  find users whose skillsOffered contains a skill
  // where the name includes "python" (case-insensitive).
  //
  // Why $elemMatch here and not a top-level $regex?
  // We are searching inside an ARRAY of sub-documents.
  // $elemMatch ensures ALL conditions apply to the SAME array element.
  // Without it, MongoDB could match a user where one skill matches the
  // name filter and a DIFFERENT skill matches the category filter —
  // which would be incorrect.
  if (search && search.trim()) {
    filter.skillsOffered = {
      $elemMatch: {
        name: { $regex: search.trim(), $options: 'i' },
        // category and level filters are merged into the same $elemMatch
        // below if they are also present — see step 5 and 6.
      },
    };
  }

  // ── 4. User name search ───────────────────────────────────────────────────
  // ?userName=ali  →  find users whose name contains "ali" (case-insensitive).
  // This searches the top-level name field, not skills.
  if (userName && userName.trim()) {
    filter.name = { $regex: userName.trim(), $options: 'i' };
  }

  // ── 5. Category filter ────────────────────────────────────────────────────
  // ?category=Technology  →  only users who offer a skill in that category.
  //
  // If a search filter is already set, we ADD category to the same
  // $elemMatch so both conditions apply to the same skill object.
  // If no search filter, we start a fresh $elemMatch.
  if (category) {
    if (filter.skillsOffered && filter.skillsOffered.$elemMatch) {
      // Merge into the existing $elemMatch
      filter.skillsOffered.$elemMatch.category = category;
    } else {
      filter.skillsOffered = { $elemMatch: { category } };
    }
  }

  // ── 6. Level filter ───────────────────────────────────────────────────────
  // ?level=Expert  →  only users who offer at least one skill at Expert level.
  // Same $elemMatch merge pattern as category.
  if (level) {
    if (filter.skillsOffered && filter.skillsOffered.$elemMatch) {
      filter.skillsOffered.$elemMatch.level = level;
    } else {
      filter.skillsOffered = { $elemMatch: { level } };
    }
  }

  // ── 7. Location filter ────────────────────────────────────────────────────
  // ?location=bangalore  →  partial, case-insensitive match on location field.
  // We use $regex so "bangalore" matches "Bangalore, India".
  if (location && location.trim()) {
    filter.location = { $regex: location.trim(), $options: 'i' };
  }

  return filter;
};

// ─── GET /api/skills ──────────────────────────────────────────────────────────
// Browse all users offering skills, with search/filter/sort/pagination.
// @access  Private (JWT required — protect middleware runs before this)
//
// Query parameters accepted:
//   search    {string}  - Partial skill name search
//   userName  {string}  - Partial user name search
//   category  {string}  - Must match one of SKILL_CATEGORIES exactly
//   level     {string}  - Must match one of SKILL_LEVELS exactly
//   location  {string}  - Partial location search
//   sort      {string}  - newest | oldest | az | za  (default: newest)
//   page      {number}  - Page number (default: 1)
//   limit     {number}  - Items per page (default: 10, max: 50)
const getSkillListings = async (req, res) => {
  const {
    search,
    userName,
    category,
    level,
    location,
    sort = 'newest',
  } = req.query;

  if (category && !SKILL_CATEGORIES.includes(category)) {
    throw new AppError(
      `Invalid category. Valid values: ${SKILL_CATEGORIES.join(', ')}`,
      400
    );
  }

  if (level && !SKILL_LEVELS.includes(level)) {
    throw new AppError(
      `Invalid level. Valid values: ${SKILL_LEVELS.join(', ')}`,
      400
    );
  }

  if (sort && !SORT_OPTIONS[sort]) {
    throw new AppError(
      `Invalid sort value. Valid values: ${Object.keys(SORT_OPTIONS).join(', ')}`,
      400
    );
  }

  const { page, limit, skip } = getPagination(req.query);

  const whereClauses = ['u.id <> ?', 'u.is_active = 1'];
  const params = [req.user.id];

  if (search && search.trim()) {
    whereClauses.push('EXISTS (SELECT 1 FROM user_skill_offered s WHERE s.user_id = u.id AND s.name LIKE ?)');
    params.push(`%${search.trim()}%`);
  }

  if (userName && userName.trim()) {
    whereClauses.push('u.name LIKE ?');
    params.push(`%${userName.trim()}%`);
  }

  if (category) {
    whereClauses.push('EXISTS (SELECT 1 FROM user_skill_offered s WHERE s.user_id = u.id AND s.category = ?)');
    params.push(category);
  }

  if (level) {
    whereClauses.push('EXISTS (SELECT 1 FROM user_skill_offered s WHERE s.user_id = u.id AND s.level = ?)');
    params.push(level);
  }

  if (location && location.trim()) {
    whereClauses.push('u.location LIKE ?');
    params.push(`%${location.trim()}%`);
  }

  const baseSql = `SELECT u.id, u.name, u.avatar, u.bio, u.location, u.created_at, u.average_rating, u.total_reviews FROM users u WHERE ${whereClauses.join(' AND ')}`;

  const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const orderSql = orderBy === SORT_OPTIONS.newest ? 'ORDER BY u.created_at DESC' : orderBy === SORT_OPTIONS.oldest ? 'ORDER BY u.created_at ASC' : orderBy === SORT_OPTIONS.az ? 'ORDER BY u.name ASC' : 'ORDER BY u.name DESC';

  const countSql = `SELECT COUNT(*) AS total FROM (${baseSql}) AS filtered`;
  const [countRows] = await pool.execute(countSql, params);
  const total = Number(countRows[0].total || 0);

  const listSql = `${baseSql} ${orderSql} LIMIT ? OFFSET ?`;
  const listParams = [...params, limit, skip];
  const [userRows] = await pool.execute(listSql, listParams);

  const userIds = userRows.map((row) => Number(row.id));
  const userMap = await fetchUsersPublicMap(userIds);

  const users = userRows.map((row) => {
    const publicUser = userMap.get(Number(row.id)) || {
      id: Number(row.id),
      name: row.name,
      avatar: row.avatar || '',
      bio: row.bio || '',
      location: row.location || '',
      averageRating: Number(row.average_rating || 0),
      totalReviews: Number(row.total_reviews || 0),
      createdAt: row.created_at,
      skillsOffered: [],
      skillsWanted: [],
    };
    return {
      id: publicUser.id,
      name: publicUser.name,
      avatar: publicUser.avatar,
      bio: publicUser.bio,
      location: publicUser.location,
      averageRating: publicUser.averageRating,
      totalReviews: publicUser.totalReviews,
      skillsOffered: publicUser.skillsOffered || [],
      skillsWanted: publicUser.skillsWanted || [],
      createdAt: publicUser.createdAt,
    };
  });

  const meta = buildMeta(total, page, limit);

  res.status(200).json({
    success: true,
    meta,
    users,
  });
};

module.exports = { getSkillListings };
