const express = require("express");
const authRoutes = require("./authRoutes");
const apiRoutes = require("./apiRoutes");
const usageRoutes = require("./usageRoutes");
const billingRoutes = require("./billingRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const myKeysRoutes = require("./myKeysRoutes");
const apiKeyAssignRoutes = require("./apiKeyAssignRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/", subscriptionRoutes);
router.use("/apis", apiRoutes);
router.use("/usage-logs", usageRoutes);
router.use("/billing", billingRoutes);
router.use("/my-keys", myKeysRoutes);
router.use("/apikey", apiKeyAssignRoutes);

module.exports = router;
