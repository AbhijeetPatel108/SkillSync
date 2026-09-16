const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { pick } = require('../utils/helpers');
const { SKILL_CATEGORIES, SKILL_LEVELS } = require('../config/constants');
const { fetchUserProfile } = require('../utils/userSql');

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
const isDuplicateSkill = (skillsArray, skillName) =>
  skillsArray.some(
    (s) => s.name.toLowerCase() === skillName.toLowerCase()
  );

const getMyProfile = async (req, res) => {
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
const updateProfile = async (req, res) => {
  const allowedFields = ['name', 'bio', 'location', 'avatar'];
  const updates = pick(req.body, allowedFields);

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
    
    try {
      new URL(updates.avatar);
    } catch {
      throw new AppError('Avatar must be a valid URL', 400);
    }
  }
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
