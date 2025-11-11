import logger from "../config/logger.js";

/**
 * Global Error Handler Middleware
 * Provides consistent JSON error responses across the application
 */

const errorHandler = (err, req, res, next) => {
  // Log error with structured logging
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
  }, `Error: ${err.message}`);

  // Default error status and message
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError") {
    // Invalid ObjectId
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  } else if (err.name === "JsonWebTokenError") {
    // JWT errors
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (err.name === "MulterError") {
    // File upload errors
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files";
    } else {
      message = err.message;
    }
  }

  // Construct error response
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  // Include validation errors if present (from express-validator)
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.error.details = err.errors;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export { errorHandler, notFound };
