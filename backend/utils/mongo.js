const mongoose = require("mongoose");
const AppError = require("./appError");

function isObjectId(value) {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

function assertObjectId(value, fieldName = "id") {
  if (!isObjectId(value)) {
    throw new AppError(400, `${fieldName} must be a valid MongoDB ObjectId.`);
  }
}

module.exports = {
  isObjectId,
  assertObjectId,
};
