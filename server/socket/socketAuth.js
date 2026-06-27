/**
 * server/socket/socketAuth.js
 *
 * JWT authentication middleware for Socket.IO connections.
 *
 * ─── Why not reuse the existing protect middleware from authMiddleware.js? ────
 *
 * The existing `protect` is an Express middleware with signature (req, res, next).
 * Socket.IO middleware has a completely different signature: (socket, next).
 * There is no `req.headers` — the token arrives in socket.handshake.auth.token.
 *
 * However, the LOGIC is identical:
 *   1. Extract JWT from the handshake
 *   2. jwt.verify(token, secret)
 *   3. User.findById(decoded.id)
 *   4. Attach user to socket.user (analogous to req.user in Express)
 *
 * We intentionally duplicate the logic rather than trying to adapt the Express
 * middleware — keeping each layer clean and framework-appropriate.
 *
 * ─── How the client sends the token ─────────────────────────────────────────
 *
 * The Socket.IO client sends the token in the auth handshake option:
 *
 *   const socket = io('http://localhost:5000', {
 *     auth: { token: 'eyJhbGci...' }
 *   });
 *
 * This is the Socket.IO-recommended approach (not cookies, not query strings).
 * It avoids logging tokens in server access logs (which query strings do).
 *
 * ─── On failure ──────────────────────────────────────────────────────────────
 *
 * Calling next(new Error('message')) rejects the connection.
 * The client receives a `connect_error` event with error.message set.
 * The socket is never added to the connected pool.
 */

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
