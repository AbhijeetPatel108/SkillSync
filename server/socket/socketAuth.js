

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  // ── Step 1: Extract token from handshake ──────────────────────────────────
  // socket.handshake.auth is populated by the client's auth: { token } option.
  // We also check socket.handshake.headers.authorization as a fallback for
  // clients that send it as a Bearer header (e.g. Postman socket testing).
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required. No token provided.'));
  }

  // ── Step 2: Verify token ──────────────────────────────────────────────────
  // jwt.verify throws synchronously on failure.
  // We wrap in try/catch because Socket.IO middleware does NOT have the
  // Express 5 automatic async error forwarding — we must handle it manually.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Map JWT error types to clear client messages (mirrors errorHandler.js)
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired. Please log in again.'
      : 'Invalid token. Please log in again.';
    return next(new Error(message));
  }

  // ── Step 3: Confirm user still exists and is active ───────────────────────
  // Token could be valid but the account deleted or deactivated since issue.
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new Error('The account for this token no longer exists.'));
  }

  if (!user.isActive) {
    return next(new Error('Your account has been deactivated.'));
  }

  // ── Step 4: Attach user to socket ─────────────────────────────────────────
  // socket.user is now available in every event handler in socketHandler.js.
  // This is the socket equivalent of req.user in Express controllers.
  socket.user = user;

  next();
};

module.exports = socketAuth;
