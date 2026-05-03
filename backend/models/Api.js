const mongoose = require("mongoose");

const apiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },
    upstreamHeaders: {
      type: Map,
      of: String,
      default: {},
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

apiSchema.index({ userId: 1, name: 1 }, { unique: true });
apiSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Api", apiSchema);
