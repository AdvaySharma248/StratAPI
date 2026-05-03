const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const billingController = require("../controllers/billingController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const {
  subscribeSchema,
  verifyPaymentSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.get("/plans", asyncHandler(billingController.listPlans));
router.post("/subscribe", authMiddleware, validateRequest(subscribeSchema), asyncHandler(billingController.subscribe));
router.post(
  "/verify-payment",
  authMiddleware,
  validateRequest(verifyPaymentSchema),
  asyncHandler(billingController.verifyPayment)
);

module.exports = router;
