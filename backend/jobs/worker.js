const { Worker } = require("bullmq");
const { QUEUE_NAMES } = require("../config/queue");
const { getQueueConnection, closeRedisConnections, openRedisConnections } = require("../config/redis");
const { connectToDatabase, disconnectFromDatabase } = require("../config/db");
const billingJobProcessor = require("./billingJob");
const logger = require("../utils/logger");

let worker;

async function shutdown(signal) {
  logger.info("Shutting down StratAPI worker.", { signal });

  if (worker) {
    await worker.close();
  }

  await Promise.allSettled([
    closeRedisConnections(),
    disconnectFromDatabase(),
  ]);

  logger.close();
}

async function bootstrap() {
  await connectToDatabase();
  await openRedisConnections();

  worker = new Worker(QUEUE_NAMES.BILLING, billingJobProcessor, {
    connection: getQueueConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    logger.info("Worker completed a billing job.", {
      jobId: job.id,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Worker failed a billing job.", {
      jobId: job?.id || null,
      error: error.message,
    });
  });

  logger.info("StratAPI worker is online.");
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await shutdown(signal);
    process.exit(0);
  });
}

bootstrap().catch(async (error) => {
  logger.error("Worker bootstrap failed.", {
    error: error.message,
    stack: error.stack,
  });
  await shutdown("bootstrap-error");
  process.exit(1);
});
