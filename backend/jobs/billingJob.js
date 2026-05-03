const billingService = require("../services/billingService");
const logger = require("../utils/logger");

module.exports = async function billingJobProcessor(job) {
  const result = await billingService.generateBillingForCurrentPeriod();

  logger.info("Billing job completed.", {
    jobId: job.id,
    processedUsers: result.processedUsers,
    periodStart: result.periodStart.toISOString(),
    periodEnd: result.periodEnd.toISOString(),
  });

  return result;
};
