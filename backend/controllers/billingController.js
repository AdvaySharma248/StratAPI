const billingService = require("../services/billingService");

async function listPlans(_req, res) {
  const items = await billingService.listPlans();
  res.status(200).json({
    items,
  });
}

async function getBillingSummary(req, res) {
  const result = await billingService.getBillingSummary(req.auth, req.query.userId || null);
  res.status(200).json(result);
}

async function subscribe(req, res) {
  const result = await billingService.subscribeToPlan(req.body, req.auth);
  res.status(result.paymentRequired ? 201 : 200).json(result);
}

async function verifyPayment(req, res) {
  const result = await billingService.verifyPayment(req.body, req.auth);
  res.status(200).json(result);
}

async function triggerBillingRun(req, res) {
  const job = await billingService.enqueueBillingRun({
    source: "manual-trigger",
  });

  res.status(202).json({
    jobId: job.id,
    status: "queued",
  });
}

module.exports = {
  listPlans,
  getBillingSummary,
  subscribe,
  verifyPayment,
  triggerBillingRun,
};
