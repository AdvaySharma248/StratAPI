const authService = require("../services/authService");

function buildRequestMetadata(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    adminRegistrationSecret: req.body.adminRegistrationSecret || null,
  };
}

async function register(req, res) {
  const session = await authService.registerUser(req.body, buildRequestMetadata(req));
  res.status(201).json(session);
}

async function login(req, res) {
  const session = await authService.loginUser(req.body, buildRequestMetadata(req));
  res.status(200).json(session);
}

async function refresh(req, res) {
  const session = await authService.refreshUserSession(req.body.refreshToken, buildRequestMetadata(req));
  res.status(200).json(session);
}

async function logout(req, res) {
  await authService.logoutUser(req.body.refreshToken);
  res.status(204).send();
}

async function me(req, res) {
  const profile = await authService.getProfile(req.auth.userId);
  res.status(200).json({
    user: profile,
  });
}

async function updateMe(req, res) {
  const profile = await authService.updateProfile(req.auth.userId, req.body);
  res.status(200).json({
    user: profile,
  });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
};
