const logger = require("../utils/logger");

module.exports = function errorMiddleware(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || "Internal server error.",
  };

  if (error.name === "CastError") {
    statusCode = 400;
    payload.message = "Invalid resource identifier.";
  }

  if (error.code === 11000) {
    statusCode = 409;
    payload.message = "A resource with the same unique value already exists.";
  }

  if (error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    logger.error("Unhandled backend error.", {
      method: req.method,
      path: req.originalUrl,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.warn("Handled request error.", {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      error: error.message,
    });
  }

  res.status(statusCode).json(payload);
};
