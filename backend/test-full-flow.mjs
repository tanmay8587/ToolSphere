import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

async function testVerificationFlow() {
  console.log("=== TESTING VERIFICATION FLOW ===\n");
  
  // Step 1: Register a new user
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";
  
  console.log("Step 1: Registering user...");
  console.log("Email:", testEmail);
  
  try {
    const registerResponse = await API.post("/auth/register", {
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    
    console.log("Registration response:", registerResponse.data);
    
    // Step 2: Login as admin
    console.log("\nStep 2: Logging in as admin...");
    const adminLogin = await API.post("/admin/login", {
      email: "admin@aitoolsdirectory.com",
      password: "Admin@12345",
    });
    
    if (!adminLogin.data.success) {
      console.log("Admin login failed:", adminLogin.data);
      return;
    }
    
    const adminToken = adminLogin.data.token;
    
    // Get the user
    const usersResponse = await API.get("/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const testUser = usersResponse.data.users.find(u => u.email === testEmail);
    if (!testUser) {
      console.log("Test user not found in admin users list");
      return;
    }
    
    console.log("Found test user:", testUser._id);
    console.log("User isVerified:", testUser.isVerified);
    
    // Set a known token for testing
    const knownToken = "known-test-token-12345678901234567890123456789012";
    const hashedKnownToken = crypto.createHash("sha256").update(knownToken).digest("hex");
    
    // Update the user with the known token
    console.log("\nStep 3: Setting known token in database...");
    const updateResponse = await API.put(`/admin/users/${testUser._id}`, {
      emailVerificationToken: hashedKnownToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log("Update response:", updateResponse.data);
    
    // Step 4: Verify with the known token
    console.log("\nStep 4: Verifying with known token...");
    const verifyResponse = await API.get(`/auth/verify-email/${knownToken}`);
    console.log("Verification response:", verifyResponse.data);
    
    // Step 5: Check user after verification
    const usersAfterVerify = await API.get("/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const testUserAfterVerify = usersAfterVerify.data.users.find(u => u.email === testEmail);
    console.log("\nUser after verification:");
    console.log("  - isVerified:", testUserAfterVerify.isVerified);
    
    // Step 6: Try to login
    console.log("\nStep 6: Logging in after verification...");
    const loginResponse = await API.post("/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    
    console.log("Login response:", loginResponse.data);
    console.log("Login response - isVerified:", loginResponse.data.user?.isVerified);
    
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Start the server and run the test
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";

import { createDefaultAdmin } from "./server/utils/createAdmin.js";
import toolsRouter from "./server/routes/tools.js";
import adminRoutes from "./server/routes/admin.js";
import authRoutes from "./server/routes/auth.js";
import uploadRoutes from "./server/routes/upload.js";
import newsletterRoutes from "./server/routes/newsletter.js";
import notificationRoutes from "./server/routes/notifications.js";
import contactRoutes from "./server/routes/contact.js";
import contactSettingRoutes from "./server/routes/contactSetting.js";
import socialRoutes from "./server/routes/social.js";
import websiteBrandingRoutes from "./server/routes/websiteBranding.js";
import seoRoutes from "./server/routes/seo.js";
import analyticsRoutes from "./server/routes/analytics.js";
import maintenanceRoutes from "./server/routes/maintenance.js";
import smtpRoutes from "./server/routes/smtp.js";
import { checkMaintenanceMode } from "./server/middleware/maintenance.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, true);
  }
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
app.use(checkMaintenanceMode);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Tools Directory API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Routes
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

// Connect to MongoDB and start server
const mongoUri = process.env.MONGO_URI;

mongoose.connection.on("connected", () => {
  console.log("\n==================================");
  console.log("MongoDB Connected Successfully");
  console.log("==================================\n");
});

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

const startServer = async () => {
  try {
    console.log("\n==================================");
    console.log("Connecting MongoDB...");
    console.log("==================================");
    
    await connectDatabase();
    await createDefaultAdmin();
    
    const server = app.listen(PORT, async () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      // Run the test after server starts
      await testVerificationFlow();
      
      // Close server after test
      server.close(() => {
        console.log("\nTest complete, shutting down...");
        mongoose.disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  }
};

startServer();