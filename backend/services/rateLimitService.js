const AppError = require("../utils/appError");
const env = require("../config/env");
const { getRedisClient, isRedisAvailable } = require("../config/redis");

async function assertRateLimit(apiKeyId) {
  if (!isRedisAvailable()) {
    return {
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      remaining: env.RATE_LIMIT_MAX_REQUESTS,
      retryAfterSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    };
  }

  const redis = getRedisClient();
  const redisKey = `rate-limit:${apiKeyId}`;
  const multi = redis.multi();

  multi.incr(redisKey);
  multi.ttl(redisKey);

  let results;

  try {
    results = await multi.exec();
  } catch (error) {
    throw new AppError(503, "Gateway rate limiting is temporarily unavailable.", {
      dependency: "redis",
      error: error.message,
    });
  }

  if (!Array.isArray(results)) {
    throw new AppError(503, "Gateway rate limiting is temporarily unavailable.", {
      dependency: "redis",
    });
  }

  const [[incrementError, requestCount], [ttlError, currentTtl]] = results;

  if (incrementError || ttlError) {
    throw new AppError(503, "Gateway rate limiting is temporarily unavailable.", {
      dependency: "redis",
      error: incrementError?.message || ttlError?.message,
    });
  }

  let ttl = currentTtl;

  if (requestCount === 1 || ttl === -1) {
    await redis.expire(redisKey, env.RATE_LIMIT_WINDOW_SECONDS);
    ttl = env.RATE_LIMIT_WINDOW_SECONDS;
  }

  if (requestCount > env.RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError(429, "Rate limit exceeded.", {
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
      retryAfterSeconds: ttl,
    });
  }

  return {
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(env.RATE_LIMIT_MAX_REQUESTS - requestCount, 0),
    retryAfterSeconds: ttl,
  };
}

module.exports = {
  assertRateLimit,
};
