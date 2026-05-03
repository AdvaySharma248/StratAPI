const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { hashValue } = require("../utils/crypto");

function buildTokenPayload(user) {
  return {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

function issueAccessToken(user) {
  return jwt.sign(buildTokenPayload(user), env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

function issueRefreshToken(user) {
  return jwt.sign(buildTokenPayload(user), env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

function decodeToken(token) {
  return jwt.decode(token);
}

async function persistRefreshToken(user, refreshToken, metadata = {}) {
  const decoded = decodeToken(refreshToken);

  return RefreshToken.create({
    userId: user._id,
    tokenHash: hashValue(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
  });
}

async function assertStoredRefreshToken(refreshToken) {
  const storedToken = await RefreshToken.findOne({
    tokenHash: hashValue(refreshToken),
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw new AppError(401, "Refresh token is invalid or has expired.");
  }

  return storedToken;
}

async function revokeRefreshToken(refreshToken, replacementToken = null) {
  const update = {
    revokedAt: new Date(),
  };

  if (replacementToken) {
    update.replacedByTokenHash = hashValue(replacementToken);
  }

  await RefreshToken.findOneAndUpdate(
    {
      tokenHash: hashValue(refreshToken),
      revokedAt: null,
    },
    update,
    {
      new: true,
    }
  );
}

async function rotateRefreshToken(refreshToken, newRefreshToken, metadata = {}) {
  const storedToken = await assertStoredRefreshToken(refreshToken);

  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = hashValue(newRefreshToken);
  await storedToken.save();

  await RefreshToken.create({
    userId: storedToken.userId,
    tokenHash: hashValue(newRefreshToken),
    expiresAt: new Date(decodeToken(newRefreshToken).exp * 1000),
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
  });
}

module.exports = {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  persistRefreshToken,
  assertStoredRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
};
