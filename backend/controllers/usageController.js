const usageLogService = require("../services/usageLogService");

async function listUsageLogs(req, res) {
  const result = await usageLogService.listUsageLogs(req.auth, req.query);
  res.status(200).json(result);
}

module.exports = {
  listUsageLogs,
};
