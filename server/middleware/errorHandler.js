/**
 * server/middleware/errorHandler.js
 *
 * The global error handler — the safety net for the entire application.
 *
 * Any error thrown anywhere (controllers, models, other middleware)
 * that is passed to next(error) ends up here.
 *
 * Without this, Express returns an ugly HTML error page.
 * With this, every error returns a consistent JSON response.
 *
 * IMPORTANT: The four-parameter signature (err, req, res, next)
 * is how Express identifies this as an error handler vs normal middleware.
 * Do NOT remove `next` even if it's unused — Express checks the arity.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {

  // Start with whatever the error already has, defaulting to 500
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Development: log the full error to the console ──────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error(`\n🔴 [${req.method}] ${req.originalUrl}`);
    console.error(`   Status  : ${statusCode}`);
    console.error(`   Message : ${message}`);
    console.error(`   Stack   : ${err.stack}\n`);
  }

  // ── Translate Mongoose / MongoDB errors into friendly messages ───

  // Bad MongoDB ObjectId  →  GET /api/users/not-a-real-id
  if (err.name === 'CastError') {
    statusCode = 404;
    message    = 'Resource not found';
  }

  // Duplicate unique field  →  email already registered
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode  = 409;
    message     = `An account with this ${field} already exists`;
  }

  // Mongoose schema validation failed  →  required field missing, etc.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // JWT invalid signature
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token — please log in again';
  }

  // JWT past its expiry date
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Your session has expired — please log in again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only include the stack trace in development so it's never
    // accidentally leaked to users in production.
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
