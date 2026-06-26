/**
 * server/utils/AppError.js
 *
 * A custom Error class that carries an HTTP status code.
 *
 * Why extend the built-in Error?
 * The built-in Error only has `message` and `stack`.
 * Express's error handler needs a `statusCode` to know what
 * HTTP status to send (400, 401, 404, etc.).
 *
 * Usage anywhere in the codebase:
 *
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid credentials', 401);
 *   throw new AppError('You do not have permission', 403);
 *
 * The global errorHandler in middleware/errorHandler.js catches
 * these and sends a clean JSON response automatically.
 */

class AppError extends Error {
  /**
   * @param {string} message   - What went wrong (shown to the client)
   * @param {number} statusCode - HTTP status code to send (4xx, 5xx)
   */
  constructor(message, statusCode) {
    super(message);           // Sets this.message and this.stack

    this.statusCode = statusCode;

    // isOperational = true means "this is an expected, handled error"
    // (e.g. user not found, bad password).
    // Unexpected bugs (null reference, syntax errors) will have
    // isOperational = false — useful for alerting in production.
    this.isOperational = true;

    // Exclude this constructor from the stack trace for cleaner logs.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
