const IORedis = require("ioredis");
const env = require("./env");
const logger = require("../utils/logger");

let redisClient;
let queueConnection;
let redisAvailable = false;
let queueAvailable = false;

function attachLogging(client, name) {
  client.on("error", (error) => {
    logger.warn(`${name} connection warning.`, {
      error: error.message,
    });
  });

  client.on("connect", () => {
    logger.info(`${name} connected.`);
  });
}

function createRedisConnection(options = {}) {
  return new IORedis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    ...options,
  });
}

function getRedisClient() {
  if (!redisClient || redisClient.status === "end") {
    redisClient = createRedisConnection();
    attachLogging(redisClient, "Redis client");
  }

  return redisClient;
}

function getQueueConnection() {
  if (!queueConnection || queueConnection.status === "end") {
    queueConnection = createRedisConnection({
      maxRetriesPerRequest: null,
    });
    attachLogging(queueConnection, "BullMQ Redis");
  }

  return queueConnection;
}

async function connectClient(client, name, options = {}) {
  const required = options.required ?? true;

  if (client.status === "ready") {
    return true;
  }

  try {
    await client.connect();
    return true;
  } catch (error) {
    client.disconnect();

    if (required) {
      throw error;
    }

    logger.warn(`${name} is unavailable; continuing with Redis-dependent features disabled.`, {
      error: error.message,
    });

    return false;
  }
}

async function openRedisConnections(options = {}) {
  const required = options.required ?? true;
  const [clientConnected, queueConnected] = await Promise.all([
    connectClient(getRedisClient(), "Redis client", { required }),
    connectClient(getQueueConnection(), "BullMQ Redis", { required }),
  ]);

  redisAvailable = clientConnected;
  queueAvailable = queueConnected;

  return {
    client: clientConnected,
    queue: queueConnected,
  };
}

async function closeClient(client) {
  if (!client || client.status === "end") {
    return;
  }

  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}

async function closeRedisConnections() {
  await Promise.allSettled([
    closeClient(redisClient),
    closeClient(queueConnection),
  ]);
}

function getRedisStatus() {
  return {
    client: redisClient ? redisClient.status : "not-initialized",
    queue: queueConnection ? queueConnection.status : "not-initialized",
    available: {
      client: redisAvailable,
      queue: queueAvailable,
    },
  };
}

module.exports = {
  getRedisClient,
  getQueueConnection,
  openRedisConnections,
  closeRedisConnections,
  getRedisStatus,
  isRedisAvailable() {
    return redisAvailable && redisClient?.status === "ready";
  },
  isQueueAvailable() {
    return queueAvailable && queueConnection?.status === "ready";
  },
};
