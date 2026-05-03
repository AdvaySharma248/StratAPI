const path = require("node:path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  if (["true", "1", "yes", "on"].includes(value.toLowerCase())) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(value.toLowerCase())) {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  REDIS_URL: z.string().min(1, "REDIS_URL is required."),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters."),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters."),
  ADMIN_REGISTRATION_SECRET: z.string().min(16).optional(),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  GATEWAY_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  ALLOW_PRIVATE_UPSTREAMS: booleanFromEnv.default(false),
  FREE_TIER_REQUESTS: z.coerce.number().int().nonnegative().default(1000),
  PRICE_PER_100_REQUESTS_INR: z.coerce.number().nonnegative().default(0.5),
  BILLING_JOB_INTERVAL_MS: z.coerce.number().int().positive().default(3600000),
  API_KEY_PREFIX: z.string().default("sa_live"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_CURRENCY: z.string().default("INR"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  console.error("\n====================== FATAL ENVIRONMENT ERROR ======================");
  console.error("Render is crashing because you are missing these Environment Variables:");
  console.error(formattedErrors.join("\n"));
  console.error("=====================================================================\n");
  process.exit(1);
}

module.exports = parsed.data;
