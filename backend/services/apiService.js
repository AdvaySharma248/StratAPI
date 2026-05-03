const Api = require("../models/Api");
const ApiKey = require("../models/ApiKey");
const UsageLog = require("../models/UsageLog");
const AppError = require("../utils/appError");
const { assertObjectId } = require("../utils/mongo");

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function getStatusFromLastUsage(lastUsage) {
  if (!lastUsage) {
    return "Not Tested";
  }

  return lastUsage.statusCode >= 200 && lastUsage.statusCode < 400 ? "Healthy" : "Unhealthy";
}

function serializeApi(api, usageSummary = {}) {
  const plainApi = typeof api.toObject === "function" ? api.toObject() : api;
  const requestCount = usageSummary.totalRequests || 0;

  // Expose only header names, never the values, to keep upstream credentials secret.
  const upstreamHeaderKeys = plainApi.upstreamHeaders
    ? [...(plainApi.upstreamHeaders instanceof Map
        ? plainApi.upstreamHeaders.keys()
        : Object.keys(plainApi.upstreamHeaders))]
    : [];

  return {
    ...plainApi,
    id: plainApi._id.toString(),
    upstreamHeaders: upstreamHeaderKeys,
    requests: requestCount,
    usageLogCount: requestCount,
    status: getStatusFromLastUsage(usageSummary.lastUsage),
    lastStatusCode: usageSummary.lastUsage?.statusCode || null,
    lastRequestAt: usageSummary.lastUsage?.timestamp || null,
  };
}

async function getUsageSummaryByApiIds(apiIds) {
  if (!apiIds.length) {
    return new Map();
  }

  const usageSummaries = await UsageLog.aggregate([
    {
      $match: {
        apiId: {
          $in: apiIds,
        },
      },
    },
    {
      $sort: {
        timestamp: -1,
      },
    },
    {
      $group: {
        _id: "$apiId",
        totalRequests: {
          $sum: 1,
        },
        lastUsage: {
          $first: {
            statusCode: "$statusCode",
            timestamp: "$timestamp",
          },
        },
      },
    },
  ]);

  return new Map(usageSummaries.map((usage) => [usage._id.toString(), usage]));
}

async function attachUsageCounts(apis) {
  const apiIds = apis.map((api) => api._id);
  const usageSummaryByApiId = await getUsageSummaryByApiIds(apiIds);

  return apis.map((api) => serializeApi(api, usageSummaryByApiId.get(api._id.toString())));
}

async function assertApiAccess(apiId, requester) {
  assertObjectId(apiId, "apiId");

  const api = await Api.findById(apiId);

  if (!api) {
    throw new AppError(404, "API not found.");
  }

  if (requester.role !== "admin" && api.userId.toString() !== requester.userId) {
    throw new AppError(403, "You do not have access to this API.");
  }

  return api;
}

async function createApi(payload, requester) {
  if (!requester?.userId) {
    throw new AppError(401, "Authentication is required to create an API.");
  }

  assertObjectId(requester.userId, "userId");

  const api = await Api.create({
    userId: requester.userId,
    name: payload.name.trim(),
    baseUrl: normalizeBaseUrl(payload.baseUrl.trim()),
    description: payload.description?.trim() || null,
    upstreamHeaders: payload.upstreamHeaders || {},
  });

  return serializeApi(api);
}

async function listApis(requester) {
  const filter = requester.role === "admin" ? {} : { userId: requester.userId };
  const apis = await Api.find(filter).sort({ createdAt: -1 }).lean();

  return attachUsageCounts(apis);
}

async function getApi(apiId, requester) {
  const api = await assertApiAccess(apiId, requester);
  const usageSummaryByApiId = await getUsageSummaryByApiIds([api._id]);

  return serializeApi(api, usageSummaryByApiId.get(api._id.toString()));
}

async function updateApi(apiId, payload, requester) {
  const api = await assertApiAccess(apiId, requester);

  if (payload.name !== undefined) {
    api.name = payload.name.trim();
  }

  if (payload.baseUrl !== undefined) {
    api.baseUrl = normalizeBaseUrl(payload.baseUrl.trim());
  }

  if (payload.description !== undefined) {
    api.description = payload.description?.trim() || null;
  }

  if (payload.isActive !== undefined) {
    api.isActive = payload.isActive;
  }

  if (payload.upstreamHeaders !== undefined) {
    api.upstreamHeaders = payload.upstreamHeaders;
  }

  await api.save();

  const usageSummaryByApiId = await getUsageSummaryByApiIds([api._id]);

  return serializeApi(api, usageSummaryByApiId.get(api._id.toString()));
}

async function deleteApi(apiId, requester) {
  const api = await assertApiAccess(apiId, requester);

  await ApiKey.updateMany(
    {
      apiId: api._id,
      status: "active",
    },
    {
      status: "revoked",
      revokedAt: new Date(),
    }
  );

  await api.deleteOne();
}

module.exports = {
  createApi,
  listApis,
  getApi,
  updateApi,
  deleteApi,
  assertApiAccess,
};
