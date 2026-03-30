const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : err.keyValue ? Object.values(err.keyValue)[0] : 'value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // console.error('ERROR 💥', err); // Log internally
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

const errorHandler = (err, req, res, next) => {
  // If no status code was set natively, default to 500
  let statusCode = err.statusCode || 500;
  
  // FIX NATIVE EXPRESS BUG: 
  // If the error arrived with an implicit Express res.statusCode of 200, 
  // force it to 500 because it clearly crashed unexpectedly.
  if (res.statusCode === 200 && statusCode === 500) {
      statusCode = 500;
  } else if (res.statusCode && res.statusCode !== 200 && !err.statusCode) {
      statusCode = res.statusCode; 
  }

  err.statusCode = statusCode;
  err.status = err.status || 'error';

  // Database Translators (Run universally so Dev and Prod both map to correct HTTP codes)
  let error = Object.assign(err);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // The application dynamically runs as production on Render, or development locally
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

module.exports = { errorHandler };
