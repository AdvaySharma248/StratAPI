const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const {
  loginSchema,
  profileUpdateSchema,
  refreshSchema,
  registerSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), asyncHandler(authController.register));
router.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
router.post("/refresh", validateRequest(refreshSchema), asyncHandler(authController.refresh));
router.post("/logout", validateRequest(refreshSchema), asyncHandler(authController.logout));
router.get("/me", authMiddleware, asyncHandler(authController.me));
router.put("/me", authMiddleware, validateRequest(profileUpdateSchema), asyncHandler(authController.updateMe));

module.exports = router;
