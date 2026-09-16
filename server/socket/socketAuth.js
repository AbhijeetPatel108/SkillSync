const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const socketAuth = async (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required. No token provided.'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired. Please log in again.'
      : 'Invalid token. Please log in again.';
    return next(new Error(message));
  }

  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
    [decoded.id]
  );

  const user = rows[0];

  if (!user) {
    return next(new Error('The account for this token no longer exists.'));
  }
  socket.user = {
    ...user,
    id: Number(user.id),
    isActive: !!user.is_active,
  };

  next();
};
module.exports = socketAuth;
