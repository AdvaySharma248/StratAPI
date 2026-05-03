const crypto = require("node:crypto");
const env = require("../config/env");

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateApiKey() {
  const primaryEntropy = crypto.randomBytes(20).toString("hex");
  const secondaryEntropy = crypto.randomBytes(12).toString("hex");
  const identifier = primaryEntropy.slice(0, 8);
  const plainText = `${env.API_KEY_PREFIX}_${primaryEntropy}${secondaryEntropy}`;

  return {
    plainText,
    keyHash: hashValue(plainText),
    keyPrefix: `${env.API_KEY_PREFIX}_${identifier}`,
    last4: plainText.slice(-4),
  };
}

module.exports = {
  hashValue,
  generateApiKey,
};
