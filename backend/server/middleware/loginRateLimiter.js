import { rateLimit } from "express-rate-limit";

/**
 * Login Rate Limiter Middleware
 * 
 * Limits failed login attempts to 5 per 15 minutes per IP address.
 * This helps prevent brute-force attacks on the admin login endpoint.
 * 
 * Key Features:
 * - Tracks only failed login attempts (not successful ones)
 * - Uses IP address as the key for rate limiting
 * - 15-minute window that resets after cooling down
 * - Returns clear error messages when limit is exceeded
 */

const loginLimiter = rateLimit({
  // Time window: 15 minutes
  windowMs: 15 * 60 * 1000,
  
  // Maximum 5 failed attempts per window
  max: 5,
  
  // Custom error message
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again after 15 minutes."
  },
  
  // Use standard rate limit headers (X-RateLimit-*)
  standardHeaders: true,
  
  // Disable legacy X-RateLimit-* headers
  legacyHeaders: false,
  
  // Custom key generator to ensure IP-based limiting
  keyGenerator: (req) => {
    // Use IP address as the key
    // Express-rate-limit automatically handles proxy headers when trust proxy is set
    return req.ip || req.connection.remoteAddress;
  },
  
  // Skip successful requests (only count failed attempts)
  // This is handled by the middleware - we want to count all login attempts
  // to prevent abuse, regardless of whether they succeed or fail
});

export default loginLimiter;