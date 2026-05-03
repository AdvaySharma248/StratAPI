const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const usageController = require("../controllers/usageController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { usageQuerySchema } = require("../utils/validationSchemas");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["owner", "admin", "consumer"]));

router.get("/", validateRequest(usageQuerySchema), asyncHandler(usageController.listUsageLogs));

module.exports = router;
