

const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');
const { SKILL_CATEGORIES, SKILL_LEVELS } = require('../config/constants');
const { fetchUsersPublicMap } = require('../utils/userSql');









const PUBLIC_FIELDS = 'name avatar bio location skillsOffered skillsWanted createdAt';









const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt:  1 },
  az:     { name:       1 },
  za:     { name:      -1 },
};



const buildQuery = ({ search, userName, category, level, location }, currentUserId) => {
  const filter = {};

  
  
  
  
  
  filter._id = { $ne: currentUserId };

  
  
  filter.isActive = true;

  
  
  
  
  
  
  
  
  
  
  if (search && search.trim()) {
    filter.skillsOffered = {
      $elemMatch: {
        name: { $regex: search.trim(), $options: 'i' },
        
        
      },
    };
  }

  
  
  
  if (userName && userName.trim()) {
    filter.name = { $regex: userName.trim(), $options: 'i' };
  }

  
  
  
  
  
  
  if (category) {
    if (filter.skillsOffered && filter.skillsOffered.$elemMatch) {
      
      filter.skillsOffered.$elemMatch.category = category;
    } else {
      filter.skillsOffered = { $elemMatch: { category } };
    }
  }

  
  
  
  if (level) {
    if (filter.skillsOffered && filter.skillsOffered.$elemMatch) {
      filter.skillsOffered.$elemMatch.level = level;
    } else {
      filter.skillsOffered = { $elemMatch: { level } };
    }
  }

  
  
  
  if (location && location.trim()) {
    filter.location = { $regex: location.trim(), $options: 'i' };
  }

  return filter;
};














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
