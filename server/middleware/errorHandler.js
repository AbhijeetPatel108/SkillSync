


const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`\n🔴 [${req.method}] ${req.originalUrl}`);
    console.error(`   Status  : ${statusCode}`);
    console.error(`   Message : ${message}`);
    console.error(`   Stack   : ${err.stack}\n`);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    if (String(err.message).includes('uq_users_email') || String(err.message).includes('email')) {
      message = 'An account with this email already exists';
    } else if (String(err.message).includes('uq_reviews_reviewer_match')) {
      message = 'You have already submitted a review for this match';
    } else {
      message = 'Duplicate record';
    }
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'WARN_DATA_TRUNCATED') {
    statusCode = 400;
    message = 'Invalid input data';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token — please log in again';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired — please log in again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
