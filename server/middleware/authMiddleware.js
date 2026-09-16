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
