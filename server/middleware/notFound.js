/**
 * server/middleware/notFound.js
 *
 * Catches any request that didn't match any defined route.
 *
 * Without this, Express falls through silently or returns an HTML page.
 * With this, unknown routes return a clean JSON 404.
 *
 * Placement in app.js: after ALL routes, before errorHandler.
 *
 * Example triggers:
 *   GET  /api/unicorns        → no such route
 *   POST /api/auth/signup     → typo, correct path is /register
 */

const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  // Create an AppError and pass it to the global errorHandler.
  // We don't respond here — errorHandler does that consistently.
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { notFound };
