const { pool } = require('../config/db');

const fetchUserSkillRows = async (userId, tableName) => {
  const [rows] = await pool.execute(
    `SELECT name, category, level, description FROM ${tableName} WHERE user_id = ? ORDER BY name ASC`,
    [userId]
  );

  return rows.map((row) => ({
    name: row.name,
    category: row.category,
    level: row.level,
    description: row.description || '',
  }));
};

const fetchUserProfile = async (userId, includePrivate = false) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      avatar,
      bio,
      location,
      role,
      is_active,
      last_login,
      average_rating,
      total_reviews,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [userId]
  );

  const user = rows[0];
  if (!user) return null;

  const [offeredRows] = await pool.execute(
    `SELECT name, category, level, description FROM user_skill_offered WHERE user_id = ? ORDER BY name ASC`,
    [userId]
  );

  const [wantedRows] = await pool.execute(
    `SELECT name, category, level, description FROM user_skill_wanted WHERE user_id = ? ORDER BY name ASC`,
    [userId]
  );

  const output = {
    id: user.id,
    name: user.name,
    avatar: user.avatar || '',
    bio: user.bio || '',
    location: user.location || '',
    skillsOffered: offeredRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
    skillsWanted: wantedRows.map((row) => ({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    })),
    averageRating: Number(user.average_rating || 0),
    totalReviews: Number(user.total_reviews || 0),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  if (includePrivate) {
    output.email = user.email;
    output.role = user.role;
    output.isActive = !!user.is_active;
    output.lastLogin = user.last_login;
  }

  return output;
};

const fetchUsersPublicMap = async (userIds) => {
  if (!userIds.length) return new Map();

  const placeholders = userIds.map(() => '?').join(',');
  const [userRows] = await pool.execute(
    `SELECT id, name, avatar, bio, location, average_rating, total_reviews, created_at
     FROM users
     WHERE id IN (${placeholders})`,
    userIds
  );

  const userMap = new Map();
  for (const user of userRows) {
    userMap.set(Number(user.id), {
      id: user.id,
      name: user.name,
      avatar: user.avatar || '',
      bio: user.bio || '',
      location: user.location || '',
      averageRating: Number(user.average_rating || 0),
      totalReviews: Number(user.total_reviews || 0),
      createdAt: user.created_at,
    });
  }

  const [offeredRows] = await pool.execute(
    `SELECT user_id, name, category, level, description FROM user_skill_offered WHERE user_id IN (${placeholders}) ORDER BY user_id ASC, name ASC`,
    userIds
  );

  const [wantedRows] = await pool.execute(
    `SELECT user_id, name, category, level, description FROM user_skill_wanted WHERE user_id IN (${placeholders}) ORDER BY user_id ASC, name ASC`,
    userIds
  );

  for (const row of offeredRows) {
    const user = userMap.get(Number(row.user_id));
    if (!user) continue;
    user.skillsOffered = user.skillsOffered || [];
    user.skillsOffered.push({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    });
  }

  for (const row of wantedRows) {
    const user = userMap.get(Number(row.user_id));
    if (!user) continue;
    user.skillsWanted = user.skillsWanted || [];
    user.skillsWanted.push({
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description || '',
    });
  }

  return userMap;
};

module.exports = { fetchUserProfile, fetchUsersPublicMap, fetchUserSkillRows };
