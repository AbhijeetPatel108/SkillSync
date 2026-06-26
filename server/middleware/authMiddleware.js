/**
 * server/middleware/authMiddleware.js
 *
 * REPLACES the scaffold from Module 1.
 *
 * Two middleware functions:
 *
 *  protect    — verifies a JWT and attaches the user to req.user
 *               Used on every private route
 *
 *  authorize  — checks that req.user has one of the required roles
 *               Always used AFTER protect
 *
 * How a private route is protected:
 *
 *   router.get('/me', protect, getMe)
 *
 *   1. Request arrives with  Authorization: Bearer <token>
 *   2. protect extracts and verifies the token
 *   3. protect fetches the user from DB and sets req.user
 *   4. next() passes control to getMe
 *   5. getMe reads req.user.id — no second DB call needed for the id
 *
 * Express 5 note:
 *   In Express 5, async errors thrown inside middleware are forwarded to
 *   the error handler automatically — no try/catch required.
 */

const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const AppError = require('../utils/AppError');

// ─── protect ─────────────────────────────────────────────────────────────────
const protect = async (req, _res, next) => {

  // ── Step 1: Extract the token ─────────────────────────────────────────────
  // The client sends:  Authorization: Bearer eyJhbGciOi...
  // We split on the space and take the second part.
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  // ── Step 2: Verify the token ──────────────────────────────────────────────
  // jwt.verify() checks two things:
  //   a) Was this token signed with our JWT_SECRET? (tamper detection)
  //   b) Has it passed its expiresIn date?
  //
  // If either check fails it throws JsonWebTokenError or TokenExpiredError.
  // Express 5 forwards thrown errors to errorHandler automatically.
  // errorHandler.js already has specific handling for both of these.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // decoded = { id: '64a3...', iat: 1234567890, exp: 1235172690 }

  // ── Step 3: Confirm the user still exists ─────────────────────────────────
  // The token could be valid but the account may have been deleted
  // after the token was issued. We must verify the user is still in the DB.
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('The account for this token no longer exists.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 401));
  }

  // ── Step 4: Attach user to the request ───────────────────────────────────
  // Every controller after this middleware can read req.user
  // without making another database call.
  req.user = user;

  next();
};

// ─── authorize ────────────────────────────────────────────────────────────────
// A middleware factory: authorize('admin') returns a middleware function.
// This lets us pass arguments (the allowed roles) to middleware inline.
//
// Usage:
//   router.delete('/users/:id', protect, authorize('admin'), deleteUser)
//
// Always place AFTER protect — req.user must exist before we check its role.
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Role '${req.user.role}' is not permitted to perform this action.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, authorize };
