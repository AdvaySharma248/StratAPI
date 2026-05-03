const UsageLog = require("../models/UsageLog");
const User = require("../models/User");

async function recordGatewayUsage(payload) {
  const usageLog = await UsageLog.create(payload);
  await User.findByIdAndUpdate(payload.userId, {
    $inc: {
      usageCount: 1,
    },
  });

  return usageLog;
}

async function listUsageLogs(requester, filters) {
  const page = filters.page || 1;
  const limit = filters.limit || 25;
  const query = {};

  if (requester.role !== "admin") {
    query.userId = requester.userId;
  }

  if (filters.apiId) {
    query.apiId = filters.apiId;
  }

  if (filters.from || filters.to) {
    query.timestamp = {};

    if (filters.from) {
      query.timestamp.$gte = new Date(filters.from);
    }

    if (filters.to) {
      query.timestamp.$lte = new Date(filters.to);
    }
  }

  const [items, total] = await Promise.all([
    UsageLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UsageLog.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  recordGatewayUsage,
  listUsageLogs,
};
