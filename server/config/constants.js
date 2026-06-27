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
 *
 * MODULE 7 ADDITIONS:
 *  - MESSAGE_MAX_LENGTH  — cap on chat message content
 *  - CHAT_EVENTS         — every Socket.IO event name in one place
 *                          so typos in event strings are caught at import,
 *                          not silently at runtime.
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

  // ── Chat (Module 7) ─────────────────────────────────────────────

  // Maximum character length for a single chat message.
  // Enforced in both the Mongoose schema (maxlength) and
  // the socketHandler (before even hitting the DB).
  MESSAGE_MAX_LENGTH: 1000,

  // All Socket.IO event names in one place.
  // Import this object wherever events are emitted or listened to.
  // Prevents silent bugs from typos like 'new_mesage' vs 'new_message'.
  //
  // Usage:
  //   const { CHAT_EVENTS } = require('../config/constants');
  //   socket.emit(CHAT_EVENTS.NEW_MESSAGE, payload);
  //   socket.on(CHAT_EVENTS.SEND_MESSAGE, handler);
  CHAT_EVENTS: {
    // Client → Server
    JOIN_ROOM:           'join_room',
    SEND_MESSAGE:        'send_message',
    TYPING_START:        'typing_start',
    TYPING_STOP:         'typing_stop',
    MARK_READ:           'mark_read',

    // Server → Client
    ROOM_JOINED:         'room_joined',
    NEW_MESSAGE:         'new_message',
    USER_TYPING:         'user_typing',
    USER_STOPPED_TYPING: 'user_stopped_typing',
    USER_ONLINE:         'user_online',
    USER_OFFLINE:        'user_offline',
    CONNECTED:           'connected',
    ERROR:               'error',
  },
};
