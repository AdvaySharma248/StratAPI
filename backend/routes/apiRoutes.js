const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const apiController = require("../controllers/apiController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const apiKeyRoutes = require("./apiKeyRoutes");
const {
  apiCreateSchema,
  apiIdSchema,
  apiUpdateSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["owner", "admin"]));

router.get("/", asyncHandler(apiController.listApis));
router.post("/", validateRequest(apiCreateSchema), asyncHandler(apiController.createApi));
router.get("/:apiId", validateRequest(apiIdSchema), asyncHandler(apiController.getApi));
router.patch("/:apiId", validateRequest(apiUpdateSchema), asyncHandler(apiController.updateApi));
router.delete("/:apiId", validateRequest(apiIdSchema), asyncHandler(apiController.deleteApi));

router.use("/:apiId/keys", apiKeyRoutes);

module.exports = router;
