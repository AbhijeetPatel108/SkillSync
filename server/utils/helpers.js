/**
 * server/utils/helpers.js
 *
 * Pure utility functions used across controllers and middleware.
 *
 * "Pure" means: same input → same output, no side effects.
 * These functions don't touch the database or req/res —
 * they just transform data.
 *
 * Keeping them here means:
 *   - No duplicated logic across controllers
 *   - Easy to unit-test in isolation
 *   - One place to fix a bug
 */

const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

// ── Pagination ─────────────────────────────────────────────────────────────
/**
 * Extracts and sanitises pagination params from req.query.
 *
 * Usage in a controller:
 *   const { page, limit, skip } = getPagination(req.query);
 *   const users = await User.find().skip(skip).limit(limit);
 *
 * @param   {object} query  - req.query from Express
 * @returns {{ page, limit, skip }}
 */
const getPagination = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds the `meta` object included in every paginated response.
 * Tells the frontend: total items, current page, total pages, etc.
 *
 * @param {number} total  - Total documents matching the query
 * @param {number} page   - Current page number
 * @param {number} limit  - Items per page
 * @returns {object}
 */
const buildMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// ── Safe Field Picker ──────────────────────────────────────────────────────
/**
 * Returns a new object containing ONLY the specified keys.
 * Prevents "mass assignment" attacks where a user sends extra fields.
 *
 * Example:
 *   req.body = { name: 'Ali', role: 'admin' }
 *   pick(req.body, ['name'])  →  { name: 'Ali' }
 *   // 'role' is silently dropped — attacker can't escalate privileges
 *
 * @param {object}   obj  - Source object (usually req.body)
 * @param {string[]} keys - Allowed field names
 * @returns {object}
 */
const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

module.exports = { getPagination, buildMeta, pick };
