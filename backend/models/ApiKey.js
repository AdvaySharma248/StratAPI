const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Api",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    last4: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    rotatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Stored so assigned consumers can copy their full key from the dashboard.
    // null for keys created before this field was added.
    plainTextKey: {
      type: String,
      default: null,
      select: false,   // excluded from queries by default; fetch explicitly when needed
    },
  },
  {
    timestamps: true,
  }
);

apiKeySchema.index({ apiId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
