const { performance } = require("node:perf_hooks");
const AppError = require("../utils/appError");
const apiKeyService = require("../services/apiKeyService");
const rateLimitService = require("../services/rateLimitService");
const usageLogService = require("../services/usageLogService");
const gatewayService = require("../services/gatewayService");
const billingService = require("../services/billingService");
const logger = require("../utils/logger");

function extractProvidedApiKey(req) {
  const headerValue = req.headers["x-api-key"];

  if (headerValue) {
    const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    return providedKey.trim() || null;
  }

  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim() || null;
  }

  return null;
}

function shouldSkipResponseHeader(headerName) {
  return ["connection", "content-length", "content-encoding", "transfer-encoding"].includes(headerName.toLowerCase());
}

async function persistGatewayUsage(payload, errorMessage) {
  try {
    await usageLogService.recordGatewayUsage(payload);
  } catch (error) {
    logger.error(errorMessage, {
      error: error.message,
      apiId: payload.apiId.toString(),
    });
  }
}

module.exports = async function gatewayMiddleware(req, res, next) {
  const startedAt = new Date();
  const startTime = performance.now();
  const providedApiKey = extractProvidedApiKey(req);

  if (!providedApiKey) {
    next(new AppError(401, "An API key is required for gateway access."));
    return;
  }

  let resolvedApi;
  let resolvedKey;

  try {
    const resolution = await apiKeyService.resolveGatewayKey(req.params.apiId || null, providedApiKey);
    resolvedApi = resolution.api;
    resolvedKey = resolution.apiKey;

    await billingService.assertUsageLimit(resolvedApi.userId);
    const rateLimit = await rateLimitService.assertRateLimit(resolvedKey._id.toString());
    const { upstreamResponse, upstreamUrl } = await gatewayService.forwardRequest(resolvedApi, resolvedKey, req);
    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
    const latency = Math.round(performance.now() - startTime);

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, headerName) => {
      if (!shouldSkipResponseHeader(headerName)) {
        res.setHeader(headerName, value);
      }
    });

    res.setHeader("X-RateLimit-Limit", rateLimit.limit);
    res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);
    res.setHeader("X-RateLimit-Reset", rateLimit.retryAfterSeconds);

    await persistGatewayUsage({
      userId: resolvedApi.userId,
      apiId: resolvedApi._id,
      apiKeyId: resolvedKey._id,
      apiKeyPrefix: resolvedKey.keyPrefix,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: startedAt,
      statusCode: upstreamResponse.status,
      latency,
      requestSize: Number(req.headers["content-length"] || 0),
      responseSize: responseBody.length,
      upstreamUrl,
      clientIp: req.ip,
    }, "Failed to persist gateway usage log.");

    void apiKeyService.touchApiKey(resolvedKey._id).catch((error) => {
      logger.error("Failed to update API key last-used timestamp.", {
        error: error.message,
        apiKeyId: resolvedKey._id.toString(),
      });
    });

    res.send(responseBody);
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);

    if (resolvedApi && resolvedKey) {
      await persistGatewayUsage({
        userId: resolvedApi.userId,
        apiId: resolvedApi._id,
        apiKeyId: resolvedKey._id,
        apiKeyPrefix: resolvedKey.keyPrefix,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: startedAt,
        statusCode: error.statusCode || 500,
        latency,
        requestSize: Number(req.headers["content-length"] || 0),
        responseSize: 0,
        upstreamUrl: error.details?.upstreamUrl || req.query?.url || resolvedApi.baseUrl,
        clientIp: req.ip,
      }, "Failed to persist error-path gateway usage log.");
    }

    next(error);
  }
};
