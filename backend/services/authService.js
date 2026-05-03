const bcrypt = require("bcrypt");
const User = require("../models/User");
const AppError = require("../utils/appError");
const env = require("../config/env");
const tokenService = require("./tokenService");

function sanitizeUser(userDocument) {
  return {
    id: userDocument._id.toString(),
    email: userDocument.email,
    username: userDocument.username || null,
    name: userDocument.name || null,
    company: userDocument.company || "",
    timezone: userDocument.timezone || "UTC",
    role: userDocument.role,
    createdAt: userDocument.createdAt,
    updatedAt: userDocument.updatedAt,
  };
}

async function registerUser({ email, password, role, username }, metadata = {}) {
  const normalizedEmail = email.trim().toLowerCase();

  if (role === "admin" && metadata.adminRegistrationSecret !== env.ADMIN_REGISTRATION_SECRET) {
    throw new AppError(403, "Admin registration is not enabled for this request.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  // Derive a username: use provided one, or auto-generate from email prefix
  const rawUsername = (username || normalizedEmail.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 32)
    .replace(/^_+|_+$/g, "") || "user";

  // Ensure uniqueness by appending a suffix if needed
  let finalUsername = rawUsername.length >= 3 ? rawUsername : rawUsername.padEnd(3, "0");
  const existing = await User.findOne({ username: finalUsername });
  if (existing) {
    finalUsername = `${finalUsername}${Math.floor(Math.random() * 9000) + 1000}`;
    finalUsername = finalUsername.slice(0, 32);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: normalizedEmail,
    username: finalUsername,
    passwordHash,
    role,
  });

  const accessToken = tokenService.issueAccessToken(user);
  const refreshToken = tokenService.issueRefreshToken(user);
  await tokenService.persistRefreshToken(user, refreshToken, metadata);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function loginUser({ email, password }, metadata = {}) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+passwordHash");

  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password.");
  }

  const accessToken = tokenService.issueAccessToken(user);
  const refreshToken = tokenService.issueRefreshToken(user);
  await tokenService.persistRefreshToken(user, refreshToken, metadata);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function refreshUserSession(refreshToken, metadata = {}) {
  const decoded = tokenService.verifyRefreshToken(refreshToken);
  await tokenService.assertStoredRefreshToken(refreshToken);

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError(401, "User no longer exists.");
  }

  const newAccessToken = tokenService.issueAccessToken(user);
  const newRefreshToken = tokenService.issueRefreshToken(user);

  await tokenService.rotateRefreshToken(refreshToken, newRefreshToken, metadata);

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function logoutUser(refreshToken) {
  try {
    tokenService.verifyRefreshToken(refreshToken);
    await tokenService.revokeRefreshToken(refreshToken);
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return;
    }

    throw error;
  }
}

async function getProfile(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, payload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const existingUser = await User.findOne({
    email: normalizedEmail,
    _id: {
      $ne: userId,
    },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: payload.name.trim(),
        email: normalizedEmail,
        company: payload.company?.trim() || null,
        timezone: payload.timezone.trim(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return sanitizeUser(user);
}

module.exports = {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  getProfile,
  updateProfile,
  sanitizeUser,
};
