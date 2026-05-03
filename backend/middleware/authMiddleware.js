const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../services/tokenService");

module.exports = function authMiddleware(req, _res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication token is missing."));
    return;
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim();

  try {
    const decoded = verifyAccessToken(accessToken);

    const authenticatedUser = {
      id: decoded.sub,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    req.auth = authenticatedUser;
    req.user = authenticatedUser;

    next();
  } catch (error) {
    next(new AppError(401, "Authentication token is invalid or expired."));
  }
};
