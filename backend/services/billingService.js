const Billing = require("../models/Billing");
const Plan = require("../models/Plan");
const SubscriptionOrder = require("../models/SubscriptionOrder");
const UsageLog = require("../models/UsageLog");
const User = require("../models/User");
const crypto = require("node:crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const { getBillingQueue } = require("../config/queue");
const { isQueueAvailable } = require("../config/redis");
const AppError = require("../utils/appError");
const { assertObjectId, isObjectId } = require("../utils/mongo");

const defaultPlans = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    requestLimit: 1000,
    features: ["1,000 requests/month", "Basic API usage tracking", "Community support"],
    billingCycle: "monthly",
    isCustom: false,
    sortOrder: 1,
  },
  {
    name: "Pro",
    slug: "pro",
    price: 199,
    requestLimit: 100000,
    features: ["100,000 requests/month", "Rate limiting", "Advanced analytics"],
    billingCycle: "monthly",
    isCustom: false,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: null,
    requestLimit: null,
    features: ["Unlimited requests", "Custom pricing", "Priority support"],
    billingCycle: "custom",
    isCustom: true,
    sortOrder: 3,
  },
];

let razorpayClient = null;

function serializePlan(plan) {
  const plainPlan = typeof plan.toObject === "function" ? plan.toObject() : plan;

  return {
    ...plainPlan,
    id: plainPlan._id.toString(),
  };
}

function getRazorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Razorpay is not configured.", {
      missing: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    });
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayClient;
}

async function ensureDefaultPlans() {
  await Plan.bulkWrite(
    defaultPlans.map((plan) => ({
      updateOne: {
        filter: {
          slug: plan.slug,
        },
        update: {
          $set: plan,
        },
        upsert: true,
      },
    }))
  );

  return Plan.find({}).sort({ sortOrder: 1, price: 1 }).lean();
}

async function listPlans() {
  const plans = await ensureDefaultPlans();
  return plans.map(serializePlan);
}

async function getPlanByIdOrSlug({ planId, planSlug }) {
  await ensureDefaultPlans();

  const query = planId && isObjectId(planId) ? { _id: planId } : { slug: planSlug || planId };
  const plan = await Plan.findOne(query);

  if (!plan) {
    throw new AppError(404, "Plan not found.");
  }

  return plan;
}

async function getFreePlan() {
  await ensureDefaultPlans();
  return Plan.findOne({ slug: "free" });
}

function getBillingPeriod(referenceDate = new Date()) {
  const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));

  return {
    periodStart,
    periodEnd,
  };
}

function calculateCharge(totalRequests) {
  const billableRequests = Math.max(totalRequests - env.FREE_TIER_REQUESTS, 0);
  const amount = Number(((billableRequests / 100) * env.PRICE_PER_100_REQUESTS_INR).toFixed(2));

  return {
    billableRequests,
    amount,
  };
}

async function generateBillingForCurrentPeriod() {
  const { periodStart, periodEnd } = getBillingPeriod();

  const usageByUser = await UsageLog.aggregate([
    {
      $match: {
        timestamp: {
          $gte: periodStart,
          $lt: periodEnd,
        },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalRequests: {
          $sum: 1,
        },
      },
    },
  ]);

  if (!usageByUser.length) {
    return {
      processedUsers: 0,
      periodStart,
      periodEnd,
    };
  }

  await Billing.bulkWrite(
    usageByUser.map((usageRecord) => {
      const charge = calculateCharge(usageRecord.totalRequests);

      return {
        updateOne: {
          filter: {
            userId: usageRecord._id,
            periodStart,
            periodEnd,
          },
          update: {
            $set: {
              totalRequests: usageRecord.totalRequests,
              billableRequests: charge.billableRequests,
              amount: charge.amount,
              currency: "INR",
              status: "pending",
              pricingSnapshot: {
                freeTierRequests: env.FREE_TIER_REQUESTS,
                pricePer100RequestsInr: env.PRICE_PER_100_REQUESTS_INR,
              },
            },
          },
          upsert: true,
        },
      };
    })
  );

  return {
    processedUsers: usageByUser.length,
    periodStart,
    periodEnd,
  };
}

async function getBillingSummary(requester, requestedUserId = null) {
  const targetUserId = requester.role === "admin" && requestedUserId ? requestedUserId : requester.userId;
  const { periodStart, periodEnd } = getBillingPeriod();

  const [currentInvoice, recentInvoices, user, allPlans, monthlyUsageCount] = await Promise.all([
    Billing.findOne({
      userId: targetUserId,
      periodStart,
      periodEnd,
    }).lean(),
    Billing.find({
      userId: targetUserId,
    })
      .sort({ periodStart: -1 })
      .limit(12)
      .lean(),
    User.findById(targetUserId).populate("currentPlan").lean(),
    listPlans(),
    UsageLog.countDocuments({
      userId: targetUserId,
      timestamp: {
        $gte: periodStart,
        $lt: periodEnd,
      },
    }),
  ]);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const currentPlan = user.currentPlan ? serializePlan(user.currentPlan) : allPlans.find((plan) => plan.slug === "free");
  const requestLimit = currentPlan?.requestLimit ?? null;

  await User.findByIdAndUpdate(targetUserId, {
    usageCount: monthlyUsageCount,
    currentPlan: user.currentPlan?._id || currentPlan?._id || currentPlan?.id || null,
    subscriptionStatus: user.subscriptionStatus || "free",
  });

  return {
    currentInvoice,
    recentInvoices,
    plans: allPlans,
    subscription: {
      status: user.subscriptionStatus || "free",
      currentPlan,
      usage: {
        requests: monthlyUsageCount,
        limit: requestLimit,
        unlimited: requestLimit === null,
      },
    },
    pricing: {
      freeTierRequests: env.FREE_TIER_REQUESTS,
      pricePer100RequestsInr: env.PRICE_PER_100_REQUESTS_INR,
    },
  };
}

async function subscribeToPlan(payload, requester) {
  if (requester.role === "consumer") {
    throw new AppError(403, "Only API owners can manage subscriptions.");
  }

  assertObjectId(requester.userId, "userId");

  const plan = await getPlanByIdOrSlug(payload);

  if (plan.slug === "enterprise") {
    throw new AppError(400, "Enterprise plan requires custom pricing. Contact support for activation.");
  }

  if (plan.slug === "free" || plan.price === 0) {
    await User.findByIdAndUpdate(requester.userId, {
      currentPlan: plan._id,
      subscriptionStatus: "free",
    });

    return {
      paymentRequired: false,
      plan: serializePlan(plan),
    };
  }

  const razorpay = getRazorpayClient();
  const receipt = `mf_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 40);
  const amount = Math.round(plan.price * 100);
  const order = await razorpay.orders.create({
    amount,
    currency: env.RAZORPAY_CURRENCY,
    receipt,
    notes: {
      userId: requester.userId,
      planId: plan._id.toString(),
      planName: plan.name,
    },
  });

  await SubscriptionOrder.create({
    userId: requester.userId,
    planId: plan._id,
    razorpayOrderId: order.id,
    amount,
    currency: env.RAZORPAY_CURRENCY,
    receipt,
    status: "created",
  });

  await User.findByIdAndUpdate(requester.userId, {
    subscriptionStatus: "pending",
  });

  return {
    paymentRequired: true,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    },
    plan: serializePlan(plan),
  };
}

function isValidRazorpaySignature(orderId, paymentId, signature) {
  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(signature);

  return generatedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

async function verifyPayment(payload, requester) {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Razorpay is not configured.", {
      missing: ["RAZORPAY_KEY_SECRET"],
    });
  }

  const order = await SubscriptionOrder.findOne({
    razorpayOrderId: payload.razorpay_order_id,
  });

  if (!order) {
    throw new AppError(404, "Subscription order not found.");
  }

  if (order.userId.toString() !== requester.userId && requester.role !== "admin") {
    throw new AppError(403, "You do not have access to this subscription order.");
  }

  if (!isValidRazorpaySignature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature)) {
    order.status = "failed";
    await order.save();
    throw new AppError(400, "Payment verification failed.");
  }

  const plan = await Plan.findById(order.planId);

  if (!plan) {
    throw new AppError(404, "Subscribed plan no longer exists.");
  }

  order.status = "paid";
  order.razorpayPaymentId = payload.razorpay_payment_id;
  order.verifiedAt = new Date();
  await order.save();

  await User.findByIdAndUpdate(order.userId, {
    currentPlan: plan._id,
    subscriptionStatus: "active",
  });

  return {
    status: "active",
    plan: serializePlan(plan),
  };
}

async function getEffectivePlanForUser(userId) {
  assertObjectId(userId.toString(), "userId");

  const [user, freePlan] = await Promise.all([
    User.findById(userId).populate("currentPlan"),
    getFreePlan(),
  ]);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const plan = user.currentPlan || freePlan;

  if (!user.currentPlan && freePlan) {
    await User.findByIdAndUpdate(user._id, {
      currentPlan: freePlan._id,
      subscriptionStatus: "free",
    });
  }

  return {
    user,
    plan,
  };
}

async function assertUsageLimit(userId) {
  const { plan } = await getEffectivePlanForUser(userId);

  if (!plan || plan.requestLimit === null || plan.requestLimit === undefined) {
    return {
      allowed: true,
      plan: plan ? serializePlan(plan) : null,
    };
  }

  const { periodStart, periodEnd } = getBillingPeriod();
  const usageCount = await UsageLog.countDocuments({
    userId,
    timestamp: {
      $gte: periodStart,
      $lt: periodEnd,
    },
  });

  await User.findByIdAndUpdate(userId, {
    usageCount,
  });

  if (usageCount >= plan.requestLimit) {
    throw new AppError(402, "Upgrade your plan", {
      usageCount,
      requestLimit: plan.requestLimit,
      plan: serializePlan(plan),
    });
  }

  return {
    allowed: true,
    usageCount,
    requestLimit: plan.requestLimit,
    plan: serializePlan(plan),
  };
}

async function enqueueBillingRun(payload = {}) {
  if (!isQueueAvailable()) {
    throw new AppError(503, "Billing jobs are temporarily unavailable because Redis is offline.", {
      dependency: "redis",
    });
  }

  return getBillingQueue().add("billing:calculate", payload);
}

module.exports = {
  getBillingPeriod,
  calculateCharge,
  generateBillingForCurrentPeriod,
  getBillingSummary,
  enqueueBillingRun,
  listPlans,
  subscribeToPlan,
  verifyPayment,
  assertUsageLimit,
};
