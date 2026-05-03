const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const apiKeyController = require("../controllers/apiKeyController");
const validateRequest = require("../middleware/validateRequest");
const {
  apiIdSchema,
  apiKeyIdSchema,
} = require("../utils/validationSchemas");

const router = express.Router({
  mergeParams: true,
});

router.get("/", validateRequest(apiIdSchema), asyncHandler(apiKeyController.listApiKeys));
router.post("/", validateRequest(apiIdSchema), asyncHandler(apiKeyController.createApiKey));
router.post("/:keyId/revoke", validateRequest(apiKeyIdSchema), asyncHandler(apiKeyController.revokeApiKey));
router.post("/:keyId/rotate", validateRequest(apiKeyIdSchema), asyncHandler(apiKeyController.rotateApiKey));

module.exports = router;
