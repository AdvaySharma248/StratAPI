const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,       // allows null while still enforcing uniqueness
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9_]{3,32}$/, "Username must be 3-32 characters: letters, numbers, underscores only."],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    timezone: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "UTC",
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["owner", "consumer", "admin"],
      default: "owner",
      index: true,
    },
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ["free", "active", "pending", "cancelled", "past_due"],
      default: "free",
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
