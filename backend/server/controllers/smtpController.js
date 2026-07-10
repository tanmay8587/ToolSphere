import SmtpSetting from "../models/SmtpSetting.js";
import logger from "../utils/logger.js";
import nodemailer from "nodemailer";
import dns from "node:dns";

// Helper to sanitize SMTP host value
const sanitizeSmtpHost = (value) => {
  if (!value) return "";
  let sanitized = value.trim();
  sanitized = sanitized.replace(/^https?:\/\//i, "");
  sanitized = sanitized.replace(/\/+$/, "");
  return sanitized;
};

// Default SMTP settings
const DEFAULT_SMTP_SETTINGS = [
  { key: "smtp_host", value: "" },
  { key: "smtp_port", value: "587" },
  { key: "smtp_username", value: "" },
  { key: "smtp_password", value: "" },
  { key: "smtp_sender_name", value: "ToolSphere" },
  { key: "smtp_sender_email", value: "" },
];

// Helper function to auto-initialize SMTP settings if they don't exist
const ensureSmtpSettingsExist = async () => {
  try {
    const count = await SmtpSetting.countDocuments();
    
    if (count === 0) {
      await SmtpSetting.insertMany(DEFAULT_SMTP_SETTINGS);
      logger.info("Auto-initialized default SMTP settings");
    }
  } catch (err) {
    logger.error("Failed to initialize SMTP settings", { error: err.message });
    throw err;
  }
};

/* ==========================================
   GET ALL SMTP SETTINGS (ADMIN)
   ========================================== */

export const getAllSmtpSettings = async (req, res) => {
  try {
    // Ensure SMTP settings exist before fetching
    await ensureSmtpSettingsExist();

    const settings = await SmtpSetting.find({}).sort({ key: 1 }).lean();

    // Exclude password from response for security
    const settingsWithoutPassword = settings.map(setting => {
      if (setting.key === "smtp_password") {
        return {
          ...setting,
          value: "",
          hasPassword: !!setting.value
        };
      }
      return setting;
    });

    res.json({
      success: true,
      settings: settingsWithoutPassword,
    });
  } catch (err) {
    logger.error("Failed to fetch SMTP settings (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch SMTP settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE SMTP SETTING (ADMIN)
   ========================================== */

export const updateSmtpSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
    }

    // Validate email format for username and sender email fields
    if ((key === "smtp_username" || key === "smtp_sender_email") && value && value.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return res.status(400).json({
          success: false,
          message: `Invalid email format for ${key}. Please enter a valid email address.`,
        });
      }
    }

    // Sanitize the value for SMTP host; preserve existing password when left blank
    const sanitizedValue = key === "smtp_host" && value !== undefined
      ? sanitizeSmtpHost(value)
      : key === "smtp_password" && (value === null || value === undefined || value.trim() === "")
        ? undefined
        : value !== undefined && typeof value === "string"
          ? value.trim()
          : value;

    // Find or create the setting
    let setting = await SmtpSetting.findOne({ key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new SmtpSetting({
        key,
        value: sanitizedValue || "",
      });
    } else {
      // Update existing setting
      if (sanitizedValue !== undefined) {
        setting.value = sanitizedValue;
      }
    }

    await setting.save();

    // Return the setting without password for security
    const responseSetting = { ...setting.toObject() };
    if (responseSetting.key === "smtp_password") {
      responseSetting.value = "";
      responseSetting.hasPassword = !!setting.value;
    }

    res.json({
      success: true,
      message: "SMTP setting updated successfully",
      setting: responseSetting,
    });
  } catch (err) {
    logger.error("Failed to update SMTP setting", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update SMTP setting",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT SMTP SETTINGS (ADMIN)
   ========================================== */

export const initializeSmtpSettings = async (req, res) => {
  try {
    const results = await Promise.all(
      DEFAULT_SMTP_SETTINGS.map(async (setting) => {
        const existing = await SmtpSetting.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new SmtpSetting({
            key: setting.key,
            value: setting.value,
          });
          await newSetting.save();
          return { key: setting.key, created: true };
        }
        return { key: setting.key, created: false };
      })
    );

    const createdCount = results.filter((r) => r.created).length;

    res.json({
      success: true,
      message: `SMTP settings initialized. ${createdCount} new settings added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize SMTP settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize SMTP settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET SMTP CONFIG (INTERNAL - FOR EMAIL SENDING)
   ========================================== */

export const getSmtpConfig = async () => {
  try {
    const settings = await SmtpSetting.find({}).lean();
    
    const config = {};
    settings.forEach(setting => {
      config[setting.key] = setting.value;
    });

    return {
      host: config.smtp_host || "",
      port: parseInt(config.smtp_port) || 587,
      auth: {
        user: config.smtp_username || "",
        pass: config.smtp_password || "",
      },
      senderName: config.smtp_sender_name || "ToolSphere",
      senderEmail: config.smtp_sender_email || "",
    };
  } catch (err) {
    logger.error("Failed to get SMTP config", { error: err.message });
    return null;
  }
};

/* ==========================================
   TEST EMAIL (ADMIN)
   ========================================== */

export const testEmail = async (req, res) => {
  try {
    const { testEmail: testEmailAddress } = req.body;

    if (!testEmailAddress) {
      return res.status(400).json({
        success: false,
        message: "Test email address is required",
      });
    }

    // Get SMTP configuration
    const config = await getSmtpConfig();

    if (!config || !config.host || !config.auth.user || !config.auth.pass) {
      return res.status(400).json({
        success: false,
        message: "SMTP settings are not configured. Please set up SMTP settings first.",
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      requireTLS: config.port === 587, // require TLS for port 587
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      lookup: (hostname, options, callback) => {
        // Force IPv4 to avoid IPv6 unreachable errors in environments without IPv6 connectivity
        dns.lookup(hostname, { family: 4, all: false }, callback);
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail || config.auth.user}>`,
      to: testEmailAddress,
      subject: "SMTP Test Email - ToolSphere",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP settings are working correctly.</p>
          <p style="color: #10b981; font-weight: bold;">✓ SMTP configuration is working!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            Sent from ToolSphere Admin Panel
          </p>
        </div>
      `,
    });

    logger.info("Test email sent successfully", { 
      to: testEmailAddress, 
      messageId: info.messageId 
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmailAddress}`,
    });
  } catch (err) {
    logger.error("Failed to send test email", { 
      error: err.message, 
      stack: err.stack,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname,
      port: err.port
    });

    // Provide user-friendly error messages based on the error type
    let userMessage = "Failed to send test email. ";

    if (err.code === "EAUTH" || err.message?.includes("Invalid login") || err.message?.includes("BadCredentials")) {
      userMessage += "SMTP authentication failed. Please check your username and password. If using Gmail, ensure you're using an App Password (not your regular password) and that 2FA is enabled.";
    } else if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
      userMessage += "Cannot connect to SMTP server. Please check your SMTP host and port settings.";
    } else if (err.code === "ESOCKET") {
      userMessage += "SSL/TLS connection error. Please check your SMTP port and security settings.";
    } else {
      userMessage += "Please check your SMTP settings and try again.";
    }

    res.status(500).json({
      success: false,
      message: userMessage,
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
      errorCode: err.code || null,
      errorMessage: err.message || null,
    });
  }
};

/* ==========================================
   SEND EMAIL (INTERNAL - FOR OTHER SERVICES)
   ========================================== */

export const sendEmail = async (to, subject, html) => {
  try {
    const config = await getSmtpConfig();

    if (!config || !config.host || !config.auth.user || !config.auth.pass) {
      throw new Error("SMTP settings are not configured");
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      requireTLS: config.port === 587, // require TLS for port 587
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      lookup: (hostname, options, callback) => {
        // Force IPv4 to avoid IPv6 unreachable errors in environments without IPv6 connectivity
        dns.lookup(hostname, { family: 4, all: false }, callback);
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail || config.auth.user}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error("Failed to send email", { error: err.message });
    throw err;
  }
};