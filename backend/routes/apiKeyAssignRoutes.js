const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const apiKeyController = require("../controllers/apiKeyController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

// POST /api/v1/apikey/assign — owner assigns a key to a consumer by username
router.post(
  "/assign",
  roleMiddleware(["owner", "admin"]),
  asyncHandler(apiKeyController.assignApiKey)
);

module.exports = router;
