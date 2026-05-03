const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    billableRequests: {
      type: Number,
      required: true,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
      index: true,
    },
    pricingSnapshot: {
      freeTierRequests: {
        type: Number,
        required: true,
      },
      pricePer100RequestsInr: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

billingSchema.index({ userId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
billingSchema.index({ periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model("Billing", billingSchema);
