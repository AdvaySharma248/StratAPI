const AppError = require("../utils/appError");

function roleMiddleware(allowedRoles) {
  return function enforceRole(req, _res, next) {
    if (!req.auth) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError(403, "You do not have permission to perform this action."));
      return;
    }

    next();
  };
}

module.exports = roleMiddleware;
