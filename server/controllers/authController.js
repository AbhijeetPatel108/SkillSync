/**
 * server/controllers/authController.js
 *
 * Business logic for every authentication endpoint.
 *
 * MVC role: CONTROLLER — sits between routes (URLs) and models (database).
 * It receives a validated request, talks to the database via the model,
 * and sends back a structured JSON response.
 *
 * Every function is an Express route handler:
 *   (req, res) => { ... }
 *
 * No try/catch needed here because Express 5 automatically forwards
 * async errors to the global errorHandler middleware.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

// ─── Helper: sign a JWT ───────────────────────────────────────────────────────
// Extracted into its own function because register AND login both need it.
// DRY principle: Don't Repeat Yourself.
//
// jwt.sign() encodes a payload into a signed token string.
// The payload is NOT secret — anyone can decode it.
// The SIGNATURE is secret — only our server can produce or verify it.
//
// We store only the user's _id in the payload.
// Everything else (name, role, email) is fetched fresh from the DB
// in the protect middleware, so stale data in the token is never an issue.
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── Helper: build and send the auth response ────────────────────────────────
// Used by both register and login so the response shape is always identical.
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

// ─── Register ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // ── Manual input validation ──────────────────────────────────────────────
  // We validate here instead of relying only on Mongoose so the error messages
  // are clear HTTP 400s, not raw Mongoose validation dumps.
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

  // ── Duplicate email check ────────────────────────────────────────────────
  // We do this explicitly before User.create() so we return a friendly 409
  // rather than letting the unique-index violation bubble up as a raw error.
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

// ─── Login ────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // ── Fetch user WITH password ─────────────────────────────────────────────
  // The password field has select:false in the schema, so we must opt in
  // explicitly here. Without .select('+password') it would be undefined
  // and comparePassword() would always fail.
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

// ─── Get current user ─────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private  (requires valid JWT via protect middleware)
const getMe = async (req, res) => {
  // req.user.id was attached by the protect middleware after verifying the JWT.
  // We re-fetch from DB to return the latest data
  // (in case name/bio changed since the token was issued).
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

// ─── Logout ───────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
const logout = (_req, res) => {
  // JWT is stateless — the server has no session to destroy.
  // "Logging out" means telling the client to discard its token.
  // The frontend removes the token from memory / localStorage on receipt.
  //
  // For a more secure setup (Module 6+), you would maintain a
  // token blocklist in Redis. For now this is the standard JWT pattern.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    token:   null,
  });
};

module.exports = { register, login, getMe, logout };
