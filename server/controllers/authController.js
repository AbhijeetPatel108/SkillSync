const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
const sendAuthResponse = (user, statusCode, res) => {
  const userId = user.id ?? user._id;
  const token = signToken(userId);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
  });
};
const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  if (name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const [existingRows] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (existingRows.length > 0) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, avatar, bio, location, role, is_active, last_login, average_rating, total_reviews)
     VALUES (?, ?, ?, '', '', '', 'user', 1, NOW(), 0, 0)`,
    [name.trim(), normalizedEmail, passwordHash]
  );

  const [userRows] = await pool.execute(
    'SELECT id, name, email, avatar, role FROM users WHERE id = ? LIMIT 1',
    [result.insertId]
  );

  const user = userRows[0];
  sendAuthResponse(user, 201, res);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }
  const normalizedEmail = email.toLowerCase().trim();
  const [userRows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  const user = userRows[0];

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw new AppError('This account has been deactivated. Contact support.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [user.id]
  );

  const refreshedUser = { ...user, id: Number(user.id), avatar: user.avatar || '', role: user.role };
  sendAuthResponse(refreshedUser, 200, res);
};

const getMe = async (req, res) => {
  const [userRows] = await pool.execute(
    'SELECT id, name, email, avatar, role FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );

  if (!userRows[0]) {
    throw new AppError('User not found', 404);
  }

  const user = userRows[0];
  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
  });
};
const logout = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    token:   null,
  });
};

module.exports = { register, login, getMe, logout };
