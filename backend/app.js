const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const env = require("./config/env");
const rootRoutes = require("./routes");
const managedApiRoutes = require("./routes/apiRoutes");
const gatewayRoutes = require("./routes/gatewayRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const { getRedisStatus } = require("./config/redis");
const logger = require("./utils/logger");

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  morgan("combined", {
    stream: logger.accessStream,
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "stratapi-backend",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoose.connection.readyState,
      redis: getRedisStatus(),
    },
  });
});

app.use(
  "/gateway",
  express.raw({
    type: () => true,
    limit: env.REQUEST_BODY_LIMIT,
  }),
  gatewayRoutes
);

app.use(
  express.json({
    limit: env.REQUEST_BODY_LIMIT,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: env.REQUEST_BODY_LIMIT,
  })
);

app.use("/api/v1", rootRoutes);
app.use("/api/apis", managedApiRoutes);
app.use("/", subscriptionRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
