const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Api",
      required: true,
      index: true,
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true,
      index: true,
    },
    apiKeyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    latency: {
      type: Number,
      required: true,
    },
    requestSize: {
      type: Number,
      default: 0,
    },
    responseSize: {
      type: Number,
      default: 0,
    },
    upstreamUrl: {
      type: String,
      default: null,
    },
    clientIp: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
  }
);

usageLogSchema.index({ userId: 1, timestamp: -1 });
usageLogSchema.index({ apiId: 1, timestamp: -1 });
usageLogSchema.index({ apiKeyId: 1, timestamp: -1 });

module.exports = mongoose.model("UsageLog", usageLogSchema);
