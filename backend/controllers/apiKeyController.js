const apiKeyService = require("../services/apiKeyService");

async function listApiKeys(req, res) {
  const items = await apiKeyService.listApiKeys(req.params.apiId, req.auth);
  res.status(200).json({ items });
}

async function createApiKey(req, res) {
  const result = await apiKeyService.createApiKey(req.params.apiId, req.auth, {
    assignedToUserId: req.body?.assignedToUserId || null,
  });
  res.status(201).json(result);
}

async function revokeApiKey(req, res) {
  const apiKey = await apiKeyService.revokeApiKey(req.params.apiId, req.params.keyId, req.auth);
  res.status(200).json({ apiKey });
}

async function rotateApiKey(req, res) {
  const result = await apiKeyService.rotateApiKey(req.params.apiId, req.params.keyId, req.auth);
  res.status(200).json(result);
}

// POST /api/v1/apikey/assign
// Body: { apiKeyId, username, email? }
async function assignApiKey(req, res) {
  const { apiKeyId, username, email } = req.body || {};

  if (!apiKeyId || typeof apiKeyId !== "string") {
    res.status(400).json({ error: "apiKeyId is required." });
    return;
  }

  if (!username || typeof username !== "string" || username.trim().length < 1) {
    res.status(400).json({ error: "username is required." });
    return;
  }

  const result = await apiKeyService.assignKeyToUser(apiKeyId, username, req.auth, email || null);
  res.status(200).json({ apiKey: result, message: `Key assigned to @${result.assignedUsername}.` });
}

// GET /api/v1/my-keys — consumer sees all keys assigned to them
async function listAssignedKeys(req, res) {
  const consumerId = req.auth.userId;
  const items = await apiKeyService.listKeysByConsumer(consumerId);
  res.status(200).json({ items });
}

module.exports = {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  assignApiKey,
  listAssignedKeys,
};
