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

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
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
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:     user._id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
      role:   user.role,
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
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  // ── Create the user ──────────────────────────────────────────────────────
  // We explicitly pick the fields we accept — NEVER do User.create(req.body).
  // If someone sends { role: 'admin' } in the body, this ignores it.
  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password,  // plain text here — the pre-save hook hashes it automatically
  });

  // Record the first login time
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

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
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // ── Security: same error for wrong email AND wrong password ─────────────
  // If we said "email not found" vs "wrong password" separately, an attacker
  // could enumerate which emails are registered in our system.
  // Generic message reveals nothing useful.
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Contact support.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, 200, res);
};

// ─── Get current user ─────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private  (requires valid JWT via protect middleware)
const getMe = async (req, res) => {
  // req.user.id was attached by the protect middleware after verifying the JWT.
  // We re-fetch from DB to return the latest data
  // (in case name/bio changed since the token was issued).
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user,
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
