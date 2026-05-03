const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const billingController = require("../controllers/billingController");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  billingQuerySchema,
  subscribeSchema,
  verifyPaymentSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(authMiddleware);
router.get("/summary", validateRequest(billingQuerySchema), asyncHandler(billingController.getBillingSummary));
router.post("/subscribe", validateRequest(subscribeSchema), asyncHandler(billingController.subscribe));
router.post("/verify-payment", validateRequest(verifyPaymentSchema), asyncHandler(billingController.verifyPayment));
router.post("/run", roleMiddleware(["admin"]), asyncHandler(billingController.triggerBillingRun));

module.exports = router;
