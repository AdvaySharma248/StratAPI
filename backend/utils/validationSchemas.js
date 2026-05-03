const { z } = require("zod");

const roles = ["owner", "consumer", "admin"];
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId.");
const httpUrl = z.string().trim().url().refine((value) => {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}, "URL must use http or https.");

const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
    role: z.enum(roles).default("owner"),
    username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,32}$/).optional(),
    adminRegistrationSecret: z.string().min(16).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

const profileUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(120),
    company: z.string().trim().max(120).optional().default(""),
    timezone: z.string().trim().min(1).max(80),
  }),
});

const apiCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    baseUrl: httpUrl,
    description: z.string().trim().max(500).optional(),
    upstreamHeaders: z.record(z.string().trim().min(1), z.string().trim()).optional(),
  }),
});

const apiUpdateSchema = z.object({
  params: z.object({
    apiId: objectId,
  }),
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    baseUrl: httpUrl.optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
    upstreamHeaders: z.record(z.string().trim().min(1), z.string().trim()).optional(),
  }).refine((body) => Object.keys(body).length > 0, "At least one field must be provided."),
});

const apiIdSchema = z.object({
  params: z.object({
    apiId: objectId,
  }),
});

const apiKeyIdSchema = z.object({
  params: z.object({
    apiId: objectId,
    keyId: objectId,
  }),
});

const usageQuerySchema = z.object({
  query: z.object({
    apiId: objectId.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(25),
  }).refine((query) => {
    if (!query.from || !query.to) {
      return true;
    }

    return new Date(query.from) <= new Date(query.to);
  }, "`from` must be earlier than or equal to `to`."),
});

const billingQuerySchema = z.object({
  query: z.object({
    userId: objectId.optional(),
  }),
});

const subscribeSchema = z.object({
  body: z.object({
    planId: z.string().trim().min(1).optional(),
    planSlug: z.string().trim().min(1).optional(),
  }).refine((body) => body.planId || body.planSlug, "planId or planSlug is required."),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().trim().min(1),
    razorpay_payment_id: z.string().trim().min(1),
    razorpay_signature: z.string().trim().min(1),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  profileUpdateSchema,
  apiCreateSchema,
  apiUpdateSchema,
  apiIdSchema,
  apiKeyIdSchema,
  usageQuerySchema,
  billingQuerySchema,
  subscribeSchema,
  verifyPaymentSchema,
};
