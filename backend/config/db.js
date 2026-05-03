const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

mongoose.set("strictQuery", true);

async function connectToDatabase() {
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });

  logger.info("MongoDB connection established.", {
    host: sanitizeMongoUri(env.MONGODB_URI),
  });
}

async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info("MongoDB connection closed.");
}

function sanitizeMongoUri(uri) {
  return uri.replace(/\/\/([^@]+)@/, "//***@");
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};
