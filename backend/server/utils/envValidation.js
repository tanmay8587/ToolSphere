/**
 * Environment Variable Validation Module
 * 
 * Validates all required environment variables on server startup.
 * Fails fast with clear error messages if any required variable is missing or invalid.
 */

import logger from "./logger.js";

/**
 * Validates that a value is not empty
 * @param {string} value - The value to validate
 * @param {string} varName - The variable name for error messages
 * @returns {boolean} - True if valid
 */
const validateNotEmpty = (value, varName) => {
  if (!value || value.trim() === "") {
    logger.error(`❌ ${varName} is missing or empty in .env file`);
    return false;
  }
  return true;
};

/**
 * Validates minimum string length
 * @param {string} value - The value to validate
 * @param {string} varName - The variable name for error messages
 * @param {number} minLength - Minimum required length
 * @returns {boolean} - True if valid
 */
const validateMinLength = (value, varName, minLength) => {
  if (value.length < minLength) {
    logger.error(`❌ ${varName} must be at least ${minLength} characters long`);
    logger.error(`   Current length: ${value.length} characters`);
    return false;
  }
  return true;
};

/**
 * Validates MongoDB URI format
 * @param {string} uri - The MongoDB URI to validate
 * @returns {boolean} - True if valid
 */
const validateMongoUri = (uri) => {
  const mongoUriPattern = /^mongodb(\+srv)?:\/\/.+/;
  if (!mongoUriPattern.test(uri)) {
    logger.error("❌ MONGO_URI format is invalid");
    logger.error("   Expected format: mongodb://localhost:27017/database or mongodb+srv://...");
    return false;
  }
  return true;
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid
 */
const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    logger.error("❌ ADMIN_EMAIL format is invalid");
    logger.error("   Please check the configured email format");
    logger.error("   Expected format: user@example.com");
    return false;
  }
  return true;
};

/**
 * Validates Cloudinary credentials
 * @param {string} cloudName - Cloudinary cloud name
 * @param {string} apiKey - Cloudinary API key
 * @param {string} apiSecret - Cloudinary API secret
 * @returns {boolean} - True if all valid
 */
const validateCloudinary = (cloudName, apiKey, apiSecret) => {
  let isValid = true;

  if (!validateNotEmpty(cloudName, "CLOUDINARY_CLOUD_NAME")) {
    isValid = false;
  }

  if (!validateNotEmpty(apiKey, "CLOUDINARY_API_KEY")) {
    isValid = false;
  }

  if (!validateNotEmpty(apiSecret, "CLOUDINARY_API_SECRET")) {
    isValid = false;
  }

  return isValid;
};

/**
 * Validates all required environment variables
 * @returns {boolean} - True if all validations pass
 */
const validateEnvironment = () => {
  logger.info("\n==================================");
  logger.info("Validating Environment Variables");
  logger.info("==================================\n");

  let isValid = true;

  // Required variables
  const requiredVars = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  // Validate each required variable exists
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!validateNotEmpty(value, varName)) {
      isValid = false;
    }
  }

  if (!isValid) {
    logger.error("\n❌ Environment validation failed. Please check your .env file.");
    logger.error("   Refer to .env.example for required variables.\n");
    return false;
  }

  // Validate JWT_SECRET length (security requirement)
  if (!validateMinLength(process.env.JWT_SECRET, "JWT_SECRET", 32)) {
    logger.error("   Generate a strong secret using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    isValid = false;
  }

  // Validate MONGO_URI format
  if (!validateMongoUri(process.env.MONGO_URI)) {
    isValid = false;
  }

  // Validate ADMIN_EMAIL format
  if (!validateEmail(process.env.ADMIN_EMAIL)) {
    isValid = false;
  }

  // Validate ADMIN_PASSWORD length
  if (!validateMinLength(process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD", 8)) {
    logger.error("   Use a strong password with at least 8 characters");
    isValid = false;
  }

  // Validate Cloudinary credentials
  if (!validateCloudinary(
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET
  )) {
    isValid = false;
  }

  // Validate CORS_ORIGIN in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin.trim() === "") {
      logger.error("❌ CORS_ORIGIN must be set in production");
      logger.error("   Example: CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com");
      isValid = false;
    }
  }

  if (isValid) {
    logger.info("✅ All required environment variables are valid");
    logger.info("✅ JWT_SECRET meets minimum length requirement (32 characters)");
    logger.info("✅ MONGO_URI format is valid");
    logger.info("✅ ADMIN_EMAIL format is valid");
    logger.info("✅ ADMIN_PASSWORD meets minimum length requirement (8 characters)");
    logger.info("✅ Cloudinary credentials are configured");
    if (isProduction) {
      logger.info("✅ CORS_ORIGIN is configured for production");
    }
    logger.info("\n==================================\n");
  }

  return isValid;
};

export default validateEnvironment;