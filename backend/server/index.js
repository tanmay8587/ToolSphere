import { fileURLToPath } from "url";
import path from "path";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";

import { createDefaultAdmin } from "./utils/createAdmin.js";
import toolsRouter from "./routes/tools.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import { buildSeedTools, buildSeedCategories, buildSeedBlogCategories } from "./utils/seedTools.js";
import uploadRoutes from "./routes/upload.js";
import newsletterRoutes from "./routes/newsletter.js";
import notificationRoutes from "./routes/notifications.js";
import contactRoutes from "./routes/contact.js";
import contactSettingRoutes from "./routes/contactSetting.js";
import socialRoutes from "./routes/social.js";
import seedSocialLinks from "./utils/seedSocialLinks.js";
import websiteBrandingRoutes from "./routes/websiteBranding.js";
import seoRoutes from "./routes/seo.js";
import analyticsRoutes from "./routes/analytics.js";
import maintenanceRoutes from "./routes/maintenance.js";
import smtpRoutes from "./routes/smtp.js";
import statisticsRoutes from "./routes/statistics.js";
import blogRoutes from "./routes/blog.js";
import { adminBlogRouter } from "./routes/blog.js";
import blogCommentRoutes from "./routes/blogComment.js";
import { adminRouter } from "./routes/blogComment.js";
import blogInteractionRoutes from "./routes/blogInteraction.js";
import userRoutes from "./routes/users.js";
import collectionRoutes from "./routes/collections.js";
import homeSettingsRoutes from "./routes/homeSettings.js";
import logger from "./utils/logger.js";
import validateEnvironment from "./utils/envValidation.js";
import { checkMaintenanceMode } from "./middleware/maintenance.js";
import { trackVisitor } from "./middleware/visitorTracking.js";
import seedAnalyticsSettings from "./utils/seedAnalyticsSettings.js";
import seedWebsiteBranding from "./utils/seedWebsiteBranding.js";
import seedSeoSettings from "./utils/seedSeoSettings.js";
import seedSmtpSettings from "./utils/seedSmtpSettings.js";
import seedHomeSettings from "./utils/seedHomeSettings.js";
import { sendErrorResponse, AppError } from "./utils/errorResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/* ===========================
   ENVIRONMENT VALIDATION
   =========================== */

// Validate all required environment variables
const isEnvironmentValid = validateEnvironment();

if (!isEnvironmentValid) {
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

/* ===========================
   PROXY TRUST & HTTPS ENFORCEMENT
   =========================== */

// Trust proxy in production (required for correct IP detection and HTTPS enforcement)
// This tells Express to trust the first proxy in the chain (e.g., load balancer, reverse proxy)
if (isProduction) {
  app.set("trust proxy", 1);
  logger.info("🔒 Production mode: Proxy trust enabled");
}

// HTTPS enforcement middleware for production only
if (isProduction) {
  app.use((req, res, next) => {
    // CHANGED: never redirect/short-circuit CORS preflight OPTIONS requests.
    // A 302 redirect on an OPTIONS preflight carries no CORS headers and fails the preflight.
    if (req.method === "OPTIONS") return next();

    // Check if the request is already HTTPS (via x-forwarded-proto header from proxy)
    const isHttps = req.header("x-forwarded-proto") === "https";
    
    // If not HTTPS, redirect to HTTPS
    if (!isHttps) {
      logger.warn(`⚠️  Redirecting HTTP to HTTPS: ${req.url}`);
      return res.redirect(`https://${req.hostname}${req.url}`);
    }
    
    next();
  });
  
  logger.info("🔒 Production mode: HTTPS enforcement enabled");
}

/* ===========================
   MIDDLEWARE
=========================== */

// Security middleware - Helmet.js
if (isProduction) {
  // Production: Strict security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.cloudinary.com"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-origin" },
    })
  );
} else {
  // Development: Relaxed CSP for easier development
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173"],
          scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173"],
          imgSrc: ["'self'", "data:", "https:", "blob:", "http://localhost:5173"],
          connectSrc: ["'self'", "http://localhost:5173", "https://api.cloudinary.com"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.method === "OPTIONS", // CHANGED: never rate-limit CORS preflight requests (a 429 would carry no Access-Control-Allow-Origin header and break the preflight)
  message: {
    success: false,
    message: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === "production") {
  app.use(limiter);
  logger.info("🔒 Rate limiting enabled (Production)");
} else {
  logger.info("🛠️ Rate limiting disabled (Development)");
}

/* ===========================
   CORS CONFIGURATION
   =========================== */

// Parse CORS_ORIGIN environment variable (supports comma-separated list)
const corsOriginEnv = process.env.CORS_ORIGIN || "";
const allowedOrigins = corsOriginEnv
  .split(",")
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

// CORS configuration with environment-based logic
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // If specific origins are configured, use them
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In production, reject unauthorized origins
      if (isProduction) {
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
      
      // In development, allow if not explicitly configured
      return callback(null, true);
    }

    // No CORS_ORIGIN configured
    if (isProduction) {
      // Production: Require explicit CORS_ORIGIN configuration
      logger.error("❌ CORS_ORIGIN must be set in production");
      return callback(new Error("CORS not configured for production"), false);
    } else {
      // Development: Allow all localhost origins
      const isLocalhost = origin.startsWith("http://localhost") || 
                          origin.startsWith("http://127.0.0.1") ||
                          origin.startsWith("http://192.168.");
      
      if (isLocalhost) {
        return callback(null, true);
      }
      
      // Allow other origins in development for flexibility
      return callback(null, true);
    }
  }
};

app.use(cors(corsOptions));

// CHANGED: explicitly handle CORS preflight for ALL routes. This guarantees
// OPTIONS requests are answered with the proper Access-Control-Allow-* headers
// even if a later route-level handler or the 404 catch-all is reached first.
app.options("*", cors(corsOptions));

app.use(compression());

// Request body size limit (100kb for JSON, 50mb for file uploads)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));

/* ===========================
   MAINTENANCE MODE CHECK
=========================== */
app.use(checkMaintenanceMode);

/* ===========================
   VISITOR TRACKING
=========================== */
app.use(trackVisitor);

/* ===========================
   REQUEST LOGGER
=========================== */

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

/* ===========================
   HEALTH CHECK
=========================== */

app.get("/api/health", async (req, res) => {
  const healthCheck = {
    status: "ok",
    message: "AI Tools Directory API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      healthCheck.database = "connected";
    }
    res.json(healthCheck);
  } catch (err) {
    healthCheck.database = "error";
    healthCheck.error = "Database ping failed";
    res.status(500).json(healthCheck);
  }
});

/* ===========================
   SEO ROUTES
=========================== */

// robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: ${process.env.CORS_ORIGIN || "http://localhost:5173"}/sitemap.xml
`);
});

// sitemap.xml
app.get("/sitemap.xml", async (req, res) => {
  try {
    const Tool = (await import("./models/Tool.js")).default;
    const tools = await Tool.find({ approved: true, isDeleted: false, status: "active" })
      .select("slug updatedAt")
      .lean();

    const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
    const urls = tools.map(tool => `
  <url>
    <loc>${baseUrl}/tools/${tool.slug}</loc>
    <lastmod>${tool.updatedAt ? tool.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>${urls}
</urlset>`;

    res.type("application/xml");
    res.send(sitemap);
  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});

/* ===========================
   ROUTES
=========================== */

app.use("/api/tools", toolsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/contact-settings", contactSettingRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/website-branding", websiteBrandingRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/smtp", smtpRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/blogs", blogCommentRoutes);
app.use("/api/blogs", blogInteractionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/admin", adminBlogRouter);
app.use("/api/admin", adminRouter);
app.use("/api", homeSettingsRoutes);

/* ===========================
   404 HANDLER
   =========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* ===========================
   ERROR HANDLER (Enhanced with error classification)
=========================== */

app.use((err, req, res, next) => {
  // Log the error
  logger.error("Unhandled Error:", err);

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return sendErrorResponse(res, 400, "Validation failed", details);
  }

  // Handle Mongoose Cast Error (Invalid ID)
  if (err.name === "CastError") {
    return sendErrorResponse(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // Handle Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendErrorResponse(res, 409, `${field} already exists`);
  }

  // Handle AppError (custom error class)
  if (err instanceof AppError) {
    return sendErrorResponse(res, err.statusCode, err.message);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  sendErrorResponse(res, statusCode, message, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

/* ===========================
   MONGODB CONNECT
=========================== */

const mongoUri = process.env.MONGO_URI;

mongoose.connection.on("connected", () => {
  logger.info("\n==================================");
  logger.info("MongoDB Connected Successfully");
  logger.info("==================================\n");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB Error:", err.message);
});

/* ===========================
   DB CONNECT FUNCTION
=========================== */

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    return;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
};

/* ===========================
   SERVER START (FIXED)
=========================== */

let serverStarted = false;
let server = null;
let isShuttingDown = false;

const startServer = () => {
  if (serverStarted) return;
  serverStarted = true;

  server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`🧰 Tools API: http://localhost:${PORT}/api/tools`);
  });

  // ===========================
  // TIMEOUT CONFIGURATION
  // ===========================
   
  // Request timeout: Maximum time to receive the entire request from client (10 seconds)
  // This prevents slow-client attacks where clients send data very slowly
  server.requestTimeout = 10000;
   
  logger.info("⏱️  Timeout configuration: Request timeout set to 10 seconds");
};

/* ===========================
   GRACEFUL SHUTDOWN
   =========================== */

/**
 * Gracefully shuts down the server and closes all connections
 * @param {string} signal - The signal that triggered the shutdown (SIGINT or SIGTERM)
 */
const gracefulShutdown = async (signal) => {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn("⚠️  Shutdown already in progress...");
    return;
  }
  isShuttingDown = true;

  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Set a timeout for forced shutdown (30 seconds)
  // This ensures the process exits even if graceful shutdown takes too long
  const shutdownTimeout = setTimeout(() => {
    logger.error("⚠️  Forced shutdown: Time limit exceeded");
    process.exit(1);
  }, 30000);

  try {
    // Step 1: Close HTTP server
    // This stops accepting new connections and waits for existing requests to complete
    if (server) {
      logger.info("🔒 Closing HTTP server (stopping new connections)...");
      await new Promise((resolve) => {
        server.close(() => {
          logger.info("✅ HTTP server closed");
          resolve();
        });
      });
    }

    // Step 2: Close MongoDB connection
    // This ensures all pending database operations complete and connections are properly closed
    logger.info("🔒 Closing MongoDB connection...");
    await mongoose.disconnect();
    logger.info("✅ MongoDB connection closed");

    // Clear the timeout since shutdown completed successfully
    clearTimeout(shutdownTimeout);
     
    logger.info("👋 Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Register signal handlers for graceful shutdown
// SIGINT: Sent when user presses Ctrl+C in terminal
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// SIGTERM: Sent by process managers (PM2, Docker, Kubernetes, etc.) to request termination
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

/* ===========================
   SAFE SEED LOGIC (FIXED)
=========================== */

const seedDatabase = async () => {
  try {
    // Seed categories first
    const Category = (await import("./models/Category.js")).default;
    const categoryCount = await Category.countDocuments();

    if (categoryCount === 0) {
      logger.info("🌱 Seeding categories...");
      
      const categoryData = buildSeedCategories();
      
      if (!Array.isArray(categoryData) || categoryData.length === 0) {
        logger.warn("⚠️ Category seed data empty, skipping...");
      } else {
        await Category.insertMany(categoryData);
        logger.info(`✅ Seeded ${categoryData.length} categories`);
      }
    } else {
      logger.info("ℹ️ Categories already exist, skipping category seed");
    }

    // Then seed tools
    const toolCount = await mongoose.connection
      .collection("tools")
      .countDocuments();

    if (toolCount === 0) {
      logger.info("🌱 Seeding tools...");

      const seedData = buildSeedTools();

      if (!Array.isArray(seedData) || seedData.length === 0) {
        logger.warn("⚠️ Seed data empty, skipping...");
        return;
      }

      await mongoose.connection.collection("tools").insertMany(seedData);

      logger.info(`✅ Seeded ${seedData.length} tools`);
    } else {
      logger.info("ℹ️ Tools already exist, skipping tool seed");
    }

    // Seed blog categories (independent of tool categories)
    const BlogCategory = (await import("./models/BlogCategory.js")).default;
    const blogCategoryCount = await BlogCategory.countDocuments();

    if (blogCategoryCount === 0) {
      logger.info("🌱 Seeding blog categories...");

      const blogCategoryData = buildSeedBlogCategories();

      if (!Array.isArray(blogCategoryData) || blogCategoryData.length === 0) {
        logger.warn("⚠️ Blog category seed data empty, skipping...");
      } else {
        await BlogCategory.insertMany(blogCategoryData);
        logger.info(`✅ Seeded ${blogCategoryData.length} blog categories`);
      }
    } else {
      logger.info("ℹ️ Blog categories already exist, skipping blog category seed");
    }
  } catch (err) {
    logger.error("⚠️ Seed failed (non-blocking):", err.message);

  }
};

/* ===========================
   START APP
=========================== */

logger.info("🛡️  Graceful shutdown handlers registered (SIGINT, SIGTERM)");

const connectAndStart = async () => {
  try {
    logger.info("\n==================================");
    logger.info("Connecting MongoDB...");
    logger.info("==================================");

    await connectDatabase();

    await createDefaultAdmin();

    await seedDatabase();

    await seedSocialLinks();

    const seedContactSettings = (await import("./utils/seedContactSettings.js")).default;
    await seedContactSettings();

    // Seed analytics, website branding, SEO, SMTP, and Home settings
    await seedAnalyticsSettings();
    await seedWebsiteBranding();
    await seedSeoSettings();
    await seedSmtpSettings();
    await seedHomeSettings();

    startServer();
  } catch (error) {
    logger.error("❌ Fatal Error:", error);
    process.exit(1);
  }
};

connectAndStart();