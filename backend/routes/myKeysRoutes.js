const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const apiKeyController = require("../controllers/apiKeyController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["consumer", "owner", "admin"]));

// GET /api/v1/my-keys — consumer retrieves all keys assigned to their userId
router.get("/", asyncHandler(apiKeyController.listAssignedKeys));

module.exports = router;
