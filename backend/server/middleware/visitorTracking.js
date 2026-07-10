import Visitor from "../models/Visitor.js";
import logger from "../utils/logger.js";

/* ===========================
   VISITOR TRACKING MIDDLEWARE
   =========================== */

/**
 * Extracts IP address from request (works with proxies)
 * @param {Object} req - Express request object
 * @returns {string|null} IP address or null if not found
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : null);
};

/**
 * Checks if the request should be skipped for tracking
 * @param {string} reqPath - Request path
 * @returns {boolean} True if should skip tracking
 */
const shouldSkipTracking = (reqPath) => {
  // Skip API routes
  if (reqPath.startsWith("/api/")) {
    return true;
  }

  // Skip static assets
  const staticAssetPatterns = [
    "/static/",
    "/uploads/",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ];

  // Skip file extensions for static assets
  const staticExtensions = [
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".webp",
    ".avif",
  ];

  // Check static paths
  if (staticAssetPatterns.some(pattern => reqPath.startsWith(pattern))) {
    return true;
  }

  // Check file extensions
  if (staticExtensions.some(ext => reqPath.endsWith(ext))) {
    return true;
  }

  return false;
};

/**
 * Generates a session ID from IP and User-Agent
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {string} Session ID
 */
const generateSessionId = (ipAddress, userAgent) => {
  // Create a lightweight session ID using IP and hashed user agent
  const userAgentHash = Buffer.from(userAgent).toString("base64").substring(0, 20);
  return `${ipAddress}-${userAgentHash}`;
};

export const trackVisitor = async (req, res, next) => {
  try {
    // Skip tracking for unwanted routes
    if (shouldSkipTracking(req.path)) {
      return next();
    }

    // Get IP address
    const ipAddress = getClientIP(req);
    if (!ipAddress) {
      return next();
    }

    // Get session ID from header or generate one
    const userAgent = req.headers["user-agent"] || "";
    let sessionId = req.headers["x-session-id"];
    
    if (!sessionId) {
      sessionId = generateSessionId(ipAddress, userAgent);
    }

    const currentDate = new Date();
    const visitMonth = currentDate.getMonth() + 1;
    const visitYear = currentDate.getFullYear();

    // Use upsert to prevent duplicate records and reduce database operations
    // This single operation handles both new and existing visitors
    await Visitor.findOneAndUpdate(
      {
        ipAddress,
        sessionId,
        visitMonth,
        visitYear,
      },
      {
        ipAddress,
        sessionId,
        userAgent,
        visitMonth,
        visitYear,
        visitedAt: new Date(),
        isUnique: true,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    next();
  } catch (err) {
    // Don't block the request if tracking fails
    logger.error("Visitor tracking error:", err);
    next();
  }
};
