const fs = require("node:fs");
const path = require("node:path");
const env = require("../config/env");

const logsDirectory = path.join(__dirname, "..", "logs");
const appLogPath = path.join(logsDirectory, "app.log");
const accessLogPath = path.join(logsDirectory, "access.log");
const errorLogPath = path.join(logsDirectory, "error.log");

fs.mkdirSync(logsDirectory, {
  recursive: true,
});

const appLogStream = fs.createWriteStream(appLogPath, {
  flags: "a",
});
const accessLogStream = fs.createWriteStream(accessLogPath, {
  flags: "a",
});
const errorLogStream = fs.createWriteStream(errorLogPath, {
  flags: "a",
});

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level) {
  return levels[level] >= levels[env.LOG_LEVEL];
}

function write(level, message, meta = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });

  appLogStream.write(`${payload}\n`);

  if (level === "error") {
    errorLogStream.write(`${payload}\n`);
    console.error(message, meta);
    return;
  }

  if (level === "warn") {
    console.warn(message, meta);
    return;
  }

  console.log(message, meta);
}

module.exports = {
  debug(message, meta) {
    write("debug", message, meta);
  },
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  accessStream: {
    write(message) {
      accessLogStream.write(message);
    },
  },
  close() {
    appLogStream.end();
    accessLogStream.end();
    errorLogStream.end();
  },
};
