const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    price: {
      type: Number,
      default: null,
    },
    requestLimit: {
      type: Number,
      default: null,
    },
    features: {
      type: [String],
      default: [],
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "custom"],
      default: "monthly",
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ sortOrder: 1, price: 1 });

module.exports = mongoose.model("Plan", planSchema);
