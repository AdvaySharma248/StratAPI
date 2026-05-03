const AppError = require("../utils/appError");

module.exports = function notFoundMiddleware(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
