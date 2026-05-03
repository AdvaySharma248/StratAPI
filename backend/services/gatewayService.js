const dns = require("node:dns").promises;
const net = require("node:net");
const AppError = require("../utils/appError");
const env = require("../config/env");

function isPrivateIPv4(address) {
  const parts = address.split(".").map(Number);
  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

function isPrivateIPv6(address) {
  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateAddress(address) {
  const version = net.isIP(address);

  if (version === 4) {
    return isPrivateIPv4(address);
  }

  if (version === 6) {
    return isPrivateIPv6(address);
  }

  return false;
}

async function assertSafeUpstreamUrl(targetUrl) {
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    throw new AppError(400, "Upstream API URL must use http or https.");
  }

  if (env.ALLOW_PRIVATE_UPSTREAMS) {
    return;
  }

  const hostname = targetUrl.hostname;
  const directIpVersion = net.isIP(hostname);
  const addresses = directIpVersion
    ? [{ address: hostname }]
    : await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new AppError(400, "Upstream API URL resolves to a private or unsupported network address.");
  }
}

function getGatewayPathSuffix(req) {
  const pathValue = req.params.path;

  if (Array.isArray(pathValue)) {
    return pathValue.join("/");
  }

  return pathValue || "";
}

function getQueryString(req) {
  const queryIndex = req.originalUrl.indexOf("?");
  return queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex + 1);
}

function getRequestedTargetUrl(req) {
  const requestedUrl = req.query?.url;

  if (Array.isArray(requestedUrl)) {
    return requestedUrl[0]?.trim() || "";
  }

  return typeof requestedUrl === "string" ? requestedUrl.trim() : "";
}

function assertTargetUrlBelongsToApi(api, targetUrl) {
  const baseUrl = new URL(api.baseUrl);

  if (baseUrl.origin !== targetUrl.origin) {
    throw new AppError(403, "Gateway URL must match the API assigned to this API key.");
  }

  const basePath = baseUrl.pathname.replace(/\/+$/, "");

  if (!basePath || basePath === "/") {
    return;
  }

  const targetPath = targetUrl.pathname.replace(/\/+$/, "");

  if (targetPath !== basePath && !targetPath.startsWith(`${basePath}/`)) {
    throw new AppError(403, "Gateway URL path must stay under the configured API base URL.");
  }
}

function buildUpstreamUrl(api, req) {
  const requestedTargetUrl = getRequestedTargetUrl(req);

  if (requestedTargetUrl) {
    let targetUrl;

    try {
      targetUrl = new URL(requestedTargetUrl);
    } catch {
      throw new AppError(400, "Gateway url query parameter must be a valid URL.");
    }

    assertTargetUrlBelongsToApi(api, targetUrl);
    return targetUrl.toString();
  }

  if (!req.params.apiId) {
    throw new AppError(400, "Gateway url query parameter is required.");
  }

  const baseUrl = new URL(api.baseUrl);
  const pathSuffix = getGatewayPathSuffix(req).replace(/^\/+/, "");
  const basePath = baseUrl.pathname.replace(/\/+$/, "");
  const combinedPath = `${basePath}${pathSuffix ? `/${pathSuffix}` : ""}` || "/";

  baseUrl.pathname = combinedPath.startsWith("/") ? combinedPath : `/${combinedPath}`;
  baseUrl.search = getQueryString(req);

  return baseUrl.toString();
}

function extractForwardHeaders(req, apiKey, api) {
  const headers = new Headers();

  for (const [headerName, headerValue] of Object.entries(req.headers)) {
    if (headerValue === undefined) {
      continue;
    }

    const normalizedHeader = headerName.toLowerCase();

    if (["host", "connection", "content-length", "authorization", "x-api-key"].includes(normalizedHeader)) {
      continue;
    }

    headers.set(headerName, Array.isArray(headerValue) ? headerValue.join(",") : headerValue);
  }

  // Inject upstream credentials stored against the API (e.g. the real 3rd-party API key).
  if (api.upstreamHeaders) {
    const entries = api.upstreamHeaders instanceof Map
      ? api.upstreamHeaders.entries()
      : Object.entries(api.upstreamHeaders);

    for (const [headerName, headerValue] of entries) {
      if (headerName && headerValue) {
        headers.set(headerName, headerValue);
      }
    }
  }

  headers.set("x-stratapi-api-key-id", apiKey._id.toString());
  headers.set("x-stratapi-api-id", apiKey.apiId.toString());

  return headers;
}

function getRequestBody(req) {
  if (["GET", "HEAD"].includes(req.method)) {
    return undefined;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.length ? req.body : undefined;
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  return req.body;
}

async function forwardRequest(api, apiKey, req) {
  const upstreamUrl = buildUpstreamUrl(api, req);

  try {
    await assertSafeUpstreamUrl(new URL(upstreamUrl));

    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers: extractForwardHeaders(req, apiKey, api),
      body: getRequestBody(req),
      signal: AbortSignal.timeout(env.GATEWAY_TIMEOUT_MS),
    });

    return {
      upstreamUrl,
      upstreamResponse,
    };
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new AppError(500, "Upstream API timed out.");
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(500, "Failed to reach the upstream API.", {
      error: error.message,
      upstreamUrl,
    });
  }
}

module.exports = {
  forwardRequest,
};
