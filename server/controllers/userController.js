/**
 * server/controllers/userController.js
 *
 * Handles everything related to user profiles and skill management.
 *
 * MVC role: CONTROLLER — receives a validated, authenticated request,
 * talks to the User model, returns structured JSON.
 *
 * All functions are async. Express 5 forwards thrown errors to
 * errorHandler automatically — no try/catch needed anywhere.
 *
 * req.user is always available here because every route in
 * userRoutes.js passes through the `protect` middleware first.
 */

const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { pick } = require('../utils/helpers');
const { SKILL_CATEGORIES, SKILL_LEVELS } = require('../config/constants');
const { fetchUserProfile } = require('../utils/userSql');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates a single skill object before it touches the database.
 * Used by both addOfferedSkill and addWantedSkill.
 *
 * Returns a clean, normalised skill object ready for MongoDB,
 * or throws an AppError with a precise 400 message.
 *
 * @param {object} body - req.body
 * @returns {{ name, category, level, description }}
 */
const parseAndValidateSkill = (body) => {
  const { name, category, level, description } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Skill name is required', 400);
  }
  if (name.trim().length > 50) {
    throw new AppError('Skill name cannot exceed 50 characters', 400);
  }
  if (!category) {
    throw new AppError('Skill category is required', 400);
  }
  if (!SKILL_CATEGORIES.includes(category)) {
    throw new AppError(
      `Invalid category. Must be one of: ${SKILL_CATEGORIES.join(', ')}`,
      400
    );
  }
  if (level && !SKILL_LEVELS.includes(level)) {
    throw new AppError(
      `Invalid level. Must be one of: ${SKILL_LEVELS.join(', ')}`,
      400
    );
  }
  if (description && description.length > 200) {
    throw new AppError('Description cannot exceed 200 characters', 400);
  }

  return {
    name:        name.trim(),
    category,
    level:       level || 'Beginner',
    description: description ? description.trim() : '',
  };
};

/**
 * Checks whether a skill with the same name (case-insensitive)
 * already exists in the given array.
 *
 * @param {Array}  skillsArray - user.skillsOffered or user.skillsWanted
 * @param {string} skillName   - the name to check
 * @returns {boolean}
 */
const isDuplicateSkill = (skillsArray, skillName) =>
  skillsArray.some(
    (s) => s.name.toLowerCase() === skillName.toLowerCase()
  );

// ─── GET /api/users/profile ───────────────────────────────────────────────────
// Returns the full profile of the currently logged-in user.
// @access  Private
const getMyProfile = async (req, res) => {
  // req.user is the lean user document attached by protect middleware.
  // We re-fetch here so the response always reflects the latest DB state,
  // and so the toJSON transform (id, no __v) applies cleanly.
  const user = await fetchUserProfile(req.user.id, true);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      ...user,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    },
  });
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
// Returns the PUBLIC profile of any user by their MongoDB id.
// Sensitive fields are never selected (password has select:false in schema).
// @access  Private (logged in users only — for future "is matched?" checks)
const getUserById = async (req, res) => {
  const user = await fetchUserProfile(req.params.id, false);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      averageRating: user.averageRating,
      totalReviews: user.totalReviews,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      createdAt: user.createdAt,
    },
  });
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
// Updates the logged-in user's basic profile info.
// Skills have their own dedicated endpoints — they are NOT updated here.
// @access  Private
const updateProfile = async (req, res) => {
  // pick() allows only these four fields — any extra keys in req.body are dropped.
  // This is the primary defence against mass-assignment:
  //   e.g. if someone sends { role: 'admin' }, it is silently ignored.
  const allowedFields = ['name', 'bio', 'location', 'avatar'];
  const updates = pick(req.body, allowedFields);

  // ── Field-level validation ────────────────────────────────────────────────
  if (Object.keys(updates).length === 0) {
    throw new AppError(
      `Nothing to update. Allowed fields: ${allowedFields.join(', ')}`,
      400
    );
  }

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length < 2)  throw new AppError('Name must be at least 2 characters', 400);
    if (name.length > 50) throw new AppError('Name cannot exceed 50 characters', 400);
    updates.name = name;
  }

  if (updates.bio !== undefined) {
    if (updates.bio.length > 300) throw new AppError('Bio cannot exceed 300 characters', 400);
    updates.bio = updates.bio.trim();
  }

  if (updates.location !== undefined) {
    if (updates.location.length > 100) throw new AppError('Location cannot exceed 100 characters', 400);
    updates.location = updates.location.trim();
  }

  if (updates.avatar !== undefined) {
    // Basic URL format check
    try {
      new URL(updates.avatar);
    } catch {
      throw new AppError('Avatar must be a valid URL', 400);
    }
  }

  // ── Apply updates ─────────────────────────────────────────────────────────
  // findByIdAndUpdate with { new: true } returns the UPDATED document.
  // runValidators: true re-runs Mongoose schema validators on the changed fields.
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.bio !== undefined) {
    fields.push('bio = ?');
    values.push(updates.bio);
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(updates.avatar);
  }

  if (!fields.length) {
    throw new AppError('Nothing to update. Allowed fields: name, bio, location, avatar', 400);
  }

  values.push(req.user.id);
  await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const user = await fetchUserProfile(req.user.id, true);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      ...user,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    },
  });
};

// ─── POST /api/users/skills/offered ──────────────────────────────────────────
// Adds one skill to the logged-in user's skillsOffered array.
// @access  Private
const addOfferedSkill = async (req, res) => {
  const skill = parseAndValidateSkill(req.body);

  const [existingRows] = await pool.execute(
    'SELECT id FROM user_skill_offered WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [req.user.id, skill.name]
  );
  if (existingRows.length > 0) {
    throw new AppError(`You already offer a skill named "${skill.name}"`, 409);
  }

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM user_skill_offered WHERE user_id = ?',
    [req.user.id]
  );
  if (rows[0].cnt >= 10) {
    throw new AppError('You can offer a maximum of 10 skills', 400);
  }

  await pool.execute(
    'INSERT INTO user_skill_offered (user_id, name, category, level, description) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, skill.name, skill.category, skill.level, skill.description]
  );

  const [updatedRows] = await pool.execute(
    'SELECT name, category, level, description FROM user_skill_offered WHERE user_id = ? ORDER BY name ASC',
    [req.user.id]
  );

  res.status(201).json({
    success: true,
    message: `"${skill.name}" added to your offered skills`,
    skillsOffered: updatedRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
  });
};

// ─── DELETE /api/users/skills/offered/:skillName ──────────────────────────────
// Removes a skill from skillsOffered by name (case-insensitive).
// @access  Private
const removeOfferedSkill = async (req, res) => {
  const skillName = req.params.skillName.trim();

  const [existingRows] = await pool.execute(
    'SELECT id FROM user_skill_offered WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [req.user.id, skillName]
  );
  if (existingRows.length === 0) {
    throw new AppError(`You do not have an offered skill named "${skillName}"`, 404);
  }

  await pool.execute(
    'DELETE FROM user_skill_offered WHERE user_id = ? AND LOWER(name) = LOWER(?)',
    [req.user.id, skillName]
  );

  const [updatedRows] = await pool.execute(
    'SELECT name, category, level, description FROM user_skill_offered WHERE user_id = ? ORDER BY name ASC',
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    message: `"${skillName}" removed from your offered skills`,
    skillsOffered: updatedRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
  });
};

// ─── POST /api/users/skills/wanted ───────────────────────────────────────────
// Adds one skill to the logged-in user's skillsWanted array.
// @access  Private
const addWantedSkill = async (req, res) => {
  const skill = parseAndValidateSkill(req.body);

  const [existingRows] = await pool.execute(
    'SELECT id FROM user_skill_wanted WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [req.user.id, skill.name]
  );
  if (existingRows.length > 0) {
    throw new AppError(`"${skill.name}" is already in your wanted skills`, 409);
  }

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM user_skill_wanted WHERE user_id = ?',
    [req.user.id]
  );
  if (rows[0].cnt >= 10) {
    throw new AppError('You can list a maximum of 10 wanted skills', 400);
  }

  await pool.execute(
    'INSERT INTO user_skill_wanted (user_id, name, category, level, description) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, skill.name, skill.category, skill.level, skill.description]
  );

  const [updatedRows] = await pool.execute(
    'SELECT name, category, level, description FROM user_skill_wanted WHERE user_id = ? ORDER BY name ASC',
    [req.user.id]
  );

  res.status(201).json({
    success: true,
    message: `"${skill.name}" added to your wanted skills`,
    skillsWanted: updatedRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
  });
};

// ─── DELETE /api/users/skills/wanted/:skillName ───────────────────────────────
// Removes a skill from skillsWanted by name (case-insensitive).
// @access  Private
const removeWantedSkill = async (req, res) => {
  const skillName = req.params.skillName.trim();

  const [existingRows] = await pool.execute(
    'SELECT id FROM user_skill_wanted WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [req.user.id, skillName]
  );
  if (existingRows.length === 0) {
    throw new AppError(`You do not have a wanted skill named "${skillName}"`, 404);
  }

  await pool.execute(
    'DELETE FROM user_skill_wanted WHERE user_id = ? AND LOWER(name) = LOWER(?)',
    [req.user.id, skillName]
  );

  const [updatedRows] = await pool.execute(
    'SELECT name, category, level, description FROM user_skill_wanted WHERE user_id = ? ORDER BY name ASC',
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    message: `"${skillName}" removed from your wanted skills`,
    skillsWanted: updatedRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
  });
};

module.exports = {
  getMyProfile,
  getUserById,
  updateProfile,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
};
