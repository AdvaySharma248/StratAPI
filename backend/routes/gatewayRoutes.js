const express = require("express");
const gatewayMiddleware = require("../middleware/gatewayMiddleware");

const router = express.Router();

router.all("/", gatewayMiddleware);
router.all("/:apiId", gatewayMiddleware);
router.all("/:apiId/*path", gatewayMiddleware);

module.exports = router;
