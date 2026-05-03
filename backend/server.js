const http = require("node:http");
const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const { connectToDatabase, disconnectFromDatabase } = require("./config/db");
const { openRedisConnections, closeRedisConnections, isQueueAvailable } = require("./config/redis");
const { closeQueues, registerRecurringJobs } = require("./config/queue");

const requestedPort = process.env.PORT ? Number(process.env.PORT) : env.PORT;
const initialPort = Number.isFinite(requestedPort) ? requestedPort : env.PORT;
const host = process.env.HOST || env.HOST;
const maxPortAttempts = env.NODE_ENV === "production" ? 1 : 10;

let currentPort = initialPort;
let httpServer;

async function shutdown(signal) {
  logger.info("Shutting down StratAPI backend.", { signal });

  if (httpServer?.listening) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => {
        if (error?.code === "ERR_SERVER_NOT_RUNNING") {
          resolve();
          return;
        }

        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await Promise.allSettled([
    closeQueues(),
    closeRedisConnections(),
    disconnectFromDatabase(),
  ]);

  logger.close();
}

function createServer() {
  const server = http.createServer(app);

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE" && currentPort < initialPort + maxPortAttempts - 1) {
      const busyPort = currentPort;
      currentPort += 1;
      logger.warn("Preferred backend port is busy, retrying on the next port.", {
        busyPort,
        retryPort: currentPort,
      });
      server.listen(currentPort, host);
      return;
    }

    logger.error("Backend server failed to start.", {
      error: error.message,
      code: error.code,
      port: currentPort,
    });

    await shutdown("startup-error");
    process.exit(1);
  });

  return server;
}

async function bootstrap() {
  await connectToDatabase();
  await openRedisConnections({ required: env.NODE_ENV === "production" });

  if (isQueueAvailable()) {
    await registerRecurringJobs();
  } else {
    logger.warn("Skipping recurring billing job registration because Redis is unavailable.");
  }

  httpServer = createServer();

  httpServer.listen(currentPort, host, () => {
    logger.info("StratAPI backend is online.", {
      host,
      port: currentPort,
      environment: env.NODE_ENV,
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await shutdown(signal);
    process.exit(0);
  });
}

bootstrap().catch(async (error) => {
  logger.error("Backend bootstrap failed.", {
    error: error.message,
    stack: error.stack,
  });
  await shutdown("bootstrap-error");
  process.exit(1);
});
