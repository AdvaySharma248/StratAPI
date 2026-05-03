const { Queue } = require("bullmq");
const env = require("./env");
const { getQueueConnection } = require("./redis");

const QUEUE_NAMES = {
  BILLING: "stratapi-billing",
};

const JOB_NAMES = {
  CALCULATE_BILLING: "billing:calculate",
};

let billingQueue;

function getBillingQueue() {
  if (!billingQueue) {
    billingQueue = new Queue(QUEUE_NAMES.BILLING, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    });
  }

  return billingQueue;
}

async function registerRecurringJobs() {
  await getBillingQueue().add(
    JOB_NAMES.CALCULATE_BILLING,
    {
      source: "scheduler",
    },
    {
      jobId: JOB_NAMES.CALCULATE_BILLING,
      repeat: {
        every: env.BILLING_JOB_INTERVAL_MS,
      },
    }
  );
}

async function closeQueues() {
  if (billingQueue) {
    await billingQueue.close();
  }
}

module.exports = {
  QUEUE_NAMES,
  JOB_NAMES,
  getBillingQueue,
  registerRecurringJobs,
  closeQueues,
};
