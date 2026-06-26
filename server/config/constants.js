/**
 * server/config/constants.js
 *
 * All "magic numbers" and shared configuration values live here.
 *
 * Rule: if a value appears in more than one file, it belongs here.
 *
 * Benefits:
 *  - Change JWT expiry from '7d' to '30d'? One line, one file.
 *  - Need the skill categories in both a model AND a validator?
 *    Import from here — no duplication, no drift.
 */

module.exports = {

  // ── JWT ─────────────────────────────────────────────────────────
  JWT_EXPIRES_IN: '7d',      // Token lifespan (7 days)

  // ── Password Hashing ────────────────────────────────────────────
  // bcrypt "salt rounds": higher = more secure but slower to hash.
  // 12 is the industry standard for 2024. (10 = fast dev, 14 = overkill)
  BCRYPT_SALT_ROUNDS: 12,

  // ── Pagination ──────────────────────────────────────────────────
  DEFAULT_PAGE:      1,
  DEFAULT_LIMIT:     10,
  MAX_LIMIT:         50,

  // ── Skill Categories ────────────────────────────────────────────
  // Used in the User model (schema enum) AND in route validators.
  // Single source of truth — update once, reflected everywhere.
  SKILL_CATEGORIES: [
    'Technology',
    'Design',
    'Music',
    'Language',
    'Cooking',
    'Fitness',
    'Business',
    'Art',
    'Writing',
    'Other',
  ],

  // ── Skill Levels ────────────────────────────────────────────────
  SKILL_LEVELS: ['Beginner', 'Intermediate', 'Expert'],

  // ── Match Status ────────────────────────────────────────────────
  MATCH_STATUS: {
    PENDING:   'pending',
    ACCEPTED:  'accepted',
    REJECTED:  'rejected',
    CANCELLED: 'cancelled',
  },

  // ── User Roles ──────────────────────────────────────────────────
  USER_ROLES: {
    USER:  'user',
    ADMIN: 'admin',
  },
};
