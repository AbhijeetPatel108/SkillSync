/**
 * server/middleware/authMiddleware.js
 *
 * JWT authentication guard.
 *
 * `protect` runs before any private route.
 * It reads the Bearer token, verifies it, fetches the user,
 * and attaches them to req.user so every downstream controller
 * can access the authenticated user without another DB call.
 *
 * `authorize` is a role-based access guard.
 * It runs AFTER protect (user must be authenticated first).
 *
 * Usage in routes:
 *
 *   // Any logged-in user
 *   router.get('/me', protect, getMe);
 *
 *   // Admins only
 *   router.delete('/user/:id', protect, authorize('admin'), deleteUser);
 *
 * NOTE: The User model is imported here but the full implementation
 *       is completed in Module 2 (Authentication).
 *       This file is scaffolded now so routes can reference it.
 */

const jwt     = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Imported when the User model exists (Module 2 onwards)
let User;
try {
  User = require('../models/User');
} catch {
  // Model not created yet — protect will be wired up in Module 2
}

// ── protect ────────────────────────────────────────────────────────────────
const protect = async (req, _res, next) => {
  // 1. Extract token from Authorization: Bearer <token>
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. Please log in.', 401));
  }

  // 2. Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    // errorHandler.js translates both into clean 401 messages
    return next(err);
  }

  // 3. Confirm the user still exists in the database
  //    (covers the case where an account was deleted after token was issued)
  if (!User) {
    return next(new AppError('Auth system not initialised', 500));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The account for this token no longer exists.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 401));
  }

  // 4. Attach user to request — controllers read from req.user
  req.user = user;
  next();
};

// ── authorize ─────────────────────────────────────────────────────────────
// A "middleware factory" — a function that RETURNS a middleware function.
// This pattern lets us pass arguments (the allowed roles) to middleware.
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not permitted to perform this action`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
