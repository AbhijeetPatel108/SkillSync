const { pool } = require('../config/db');
const { getPagination, buildMeta } = require('../utils/helpers');

const getUsers = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM users');
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_active, created_at, last_login
     FROM users ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [limit, skip]
  );

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    users: rows.map((user) => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      lastLogin: user.last_login,
    })),
  });
};

module.exports = { getUsers };