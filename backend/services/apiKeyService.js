const ApiKey = require("../models/ApiKey");
const Api = require("../models/Api");
const User = require("../models/User");
const UsageLog = require("../models/UsageLog");
const AppError = require("../utils/appError");
const { generateApiKey, hashValue } = require("../utils/crypto");
const apiService = require("./apiService");
const { assertObjectId } = require("../utils/mongo");

function sanitizeApiKey(record, usageCount = 0) {
  return {
    id: record._id.toString(),
    apiId: record.apiId.toString(),
    keyPrefix: record.keyPrefix,
    last4: record.last4,
    usage: usageCount,
    status: record.status,
    // assignedTo is an ObjectId ref — expose its string form if populated
    assignedTo: record.assignedTo ? record.assignedTo.toString() : null,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function countUsageByKeyIds(keyIds) {
  if (!keyIds.length) {
    return new Map();
  }

  const usageCounts = await UsageLog.aggregate([
    {
      $match: {
        apiKeyId: {
          $in: keyIds,
        },
      },
    },
    {
      $group: {
        _id: "$apiKeyId",
        totalRequests: {
          $sum: 1,
        },
      },
    },
  ]);

  return new Map(usageCounts.map((usage) => [usage._id.toString(), usage.totalRequests]));
}

async function listApiKeys(apiId, requester) {
  await apiService.assertApiAccess(apiId, requester);

  const keys = await ApiKey.find({ apiId }).sort({ createdAt: -1 });

  const usageByKeyId = await countUsageByKeyIds(keys.map((key) => key._id));

  return keys.map((key) => sanitizeApiKey(key, usageByKeyId.get(key._id.toString()) || 0));
}

async function createApiKey(apiId, requester, options = {}) {
  const api = await apiService.assertApiAccess(apiId, requester);
  const generatedKey = generateApiKey();

  // options.assignedToUserId must be a valid User ObjectId (resolved from username before this call)
  const apiKey = await ApiKey.create({
    apiId: api._id,
    userId: api.userId,
    keyHash: generatedKey.keyHash,
    keyPrefix: generatedKey.keyPrefix,
    last4: generatedKey.last4,
    status: "active",
    assignedTo: options.assignedToUserId || null,
    plainTextKey: generatedKey.plainText,
  });

  return {
    apiKey: sanitizeApiKey(apiKey),
    plainTextKey: generatedKey.plainText,
  };
}

async function revokeApiKey(apiId, keyId, requester) {
  await apiService.assertApiAccess(apiId, requester);
  assertObjectId(keyId, "keyId");

  const keyRecord = await ApiKey.findOne({ _id: keyId, apiId });

  if (!keyRecord) {
    throw new AppError(404, "API key not found.");
  }

  keyRecord.status = "revoked";
  keyRecord.revokedAt = new Date();
  await keyRecord.save();

  return sanitizeApiKey(keyRecord);
}

async function rotateApiKey(apiId, keyId, requester) {
  await apiService.assertApiAccess(apiId, requester);
  assertObjectId(keyId, "keyId");

  const keyRecord = await ApiKey.findOne({ _id: keyId, apiId });

  if (!keyRecord) {
    throw new AppError(404, "API key not found.");
  }

  keyRecord.status = "revoked";
  keyRecord.revokedAt = new Date();
  await keyRecord.save();

  const generatedKey = generateApiKey();

  const replacementKey = await ApiKey.create({
    apiId: keyRecord.apiId,
    userId: keyRecord.userId,
    keyHash: generatedKey.keyHash,
    keyPrefix: generatedKey.keyPrefix,
    last4: generatedKey.last4,
    status: "active",
    rotatedFrom: keyRecord._id,
    assignedTo: keyRecord.assignedTo || null,  // preserve assignment on rotate
    plainTextKey: generatedKey.plainText,
  });

  return {
    apiKey: sanitizeApiKey(replacementKey),
    plainTextKey: generatedKey.plainText,
  };
}

async function resolveGatewayKey(apiId, providedKey) {
  const keyHash = hashValue(providedKey);

  const apiKey = await ApiKey.findOne({ keyHash, status: "active" });

  if (!apiKey) {
    throw new AppError(403, "API key is invalid.");
  }

  const api = await Api.findById(apiKey.apiId);

  if (!api || !api.isActive) {
    throw new AppError(404, "Target API is unavailable.");
  }

  if (apiId) {
    assertObjectId(apiId, "apiId");
  }

  if (apiId && api._id.toString() !== apiId) {
    throw new AppError(403, "API key is not valid for this API.");
  }

  return { api, apiKey };
}

async function touchApiKey(apiKeyId) {
  await ApiKey.findByIdAndUpdate(apiKeyId, { lastUsedAt: new Date() });
}

// Assign an existing API key to a consumer by username or email.
// Returns the updated key record.
async function assignKeyToUser(keyId, username, requester, email) {
  assertObjectId(keyId, "keyId");

  // Verify the key belongs to an API the requester owns
  const keyRecord = await ApiKey.findById(keyId);
  if (!keyRecord) {
    throw new AppError(404, "API key not found.");
  }

  // Assert requester owns the parent API
  await apiService.assertApiAccess(keyRecord.apiId.toString(), requester);

  // Resolve the consumer: try by username first, fall back to email
  let targetUser = await User.findOne({ username: username.trim().toLowerCase() });

  if (!targetUser && email) {
    targetUser = await User.findOne({ email: email.trim().toLowerCase() });
  }

  if (!targetUser) {
    throw new AppError(404, `No user found with username "${username}".`);
  }

  // NOTE: role validation is intentionally omitted here.
  // The backend MongoDB stores every user with role="owner" (it is a proxy store).
  // The real role is in the SQLite DB and is already validated by the Next.js
  // /api/apikey/assign route before this call is ever proxied.

  keyRecord.assignedTo = targetUser._id;
  await keyRecord.save();

  // targetUser.username may be undefined for users registered before the username-sync fix.
  // Fall back to the username that was passed in (already validated in the Next.js layer).
  const resolvedUsername = targetUser.username || username.trim().toLowerCase();

  return {
    ...sanitizeApiKey(keyRecord),
    assignedUsername: resolvedUsername,
    assignedEmail: targetUser.email,
  };
}

// Returns all active keys assigned to the authenticated consumer (by their userId).
async function listKeysByConsumer(consumerId) {
  assertObjectId(consumerId, "consumerId");

  const keys = await ApiKey.find({
    assignedTo: consumerId,
    status: "active",
  })
    .select("+plainTextKey")   // explicitly include the normally-excluded field
    .sort({ createdAt: -1 })
    .lean();

  const usageByKeyId = await countUsageByKeyIds(keys.map((key) => key._id));

  return keys.map((key) => ({
    ...sanitizeApiKey(key, usageByKeyId.get(key._id.toString()) || 0),
    apiId: key.apiId.toString(),
    plainTextKey: key.plainTextKey || null,
  }));
}

module.exports = {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  resolveGatewayKey,
  touchApiKey,
  assignKeyToUser,
  listKeysByConsumer,
};
