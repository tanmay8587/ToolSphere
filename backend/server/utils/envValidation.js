/**
 * Environment Variable Validation Module
 * 
 * Validates all required environment variables on server startup.
 * Fails fast with clear error messages if any required variable is missing or invalid.
 */

/**
 * Validates that a value is not empty
 * @param {string} value - The value to validate
 * @param {string} varName - The variable name for error messages
 * @returns {boolean} - True if valid
 */
const validateNotEmpty = (value, varName) => {
  if (!value || value.trim() === "") {
    console.error(`❌ ${varName} is missing or empty in .env file`);
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
    console.error(`❌ ${varName} must be at least ${minLength} characters long`);
    console.error(`   Current length: ${value.length} characters`);
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
    console.error("❌ MONGO_URI format is invalid");
    console.error("   Expected format: mongodb://localhost:27017/database or mongodb+srv://...");
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
    console.error("❌ ADMIN_EMAIL format is invalid");
    console.error(`   Current value: ${email}`);
    console.error("   Expected format: user@example.com");
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
  console.log("\n==================================");
  console.log("Validating Environment Variables");
  console.log("==================================\n");

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
    console.error("\n❌ Environment validation failed. Please check your .env file.");
    console.error("   Refer to .env.example for required variables.\n");
    return false;
  }

  // Validate JWT_SECRET length (security requirement)
  if (!validateMinLength(process.env.JWT_SECRET, "JWT_SECRET", 32)) {
    console.error("   Generate a strong secret using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
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
    console.error("   Use a strong password with at least 8 characters");
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
      console.error("❌ CORS_ORIGIN must be set in production");
      console.error("   Example: CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com");
      isValid = false;
    }
  }

  if (isValid) {
    console.log("✅ All required environment variables are valid");
    console.log("✅ JWT_SECRET meets minimum length requirement (32 characters)");
    console.log("✅ MONGO_URI format is valid");
    console.log("✅ ADMIN_EMAIL format is valid");
    console.log("✅ ADMIN_PASSWORD meets minimum length requirement (8 characters)");
    console.log("✅ Cloudinary credentials are configured");
    if (isProduction) {
      console.log("✅ CORS_ORIGIN is configured for production");
    }
    console.log("\n==================================\n");
  }

  return isValid;
};

export default validateEnvironment;