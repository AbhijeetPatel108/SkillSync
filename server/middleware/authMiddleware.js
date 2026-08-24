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

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

const protect = async (req, _res, next) => {
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

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
    [decoded.id]
  );

  const user = rows[0];

  if (!user) {
    return next(new AppError('The account for this token no longer exists.', 401));
  }

  req.user = {
    ...user,
    id: Number(user.id),
    isActive: Boolean(user.is_active),
    role: user.role,
  };

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
