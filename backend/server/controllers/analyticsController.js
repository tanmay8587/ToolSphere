import AnalyticsSetting from "../models/AnalyticsSetting.js";
import logger from "../utils/logger.js";

// Default analytics settings
const DEFAULT_ANALYTICS_SETTINGS = [
  { key: "google_analytics_id", value: "" },
  { key: "google_search_console_code", value: "" },
  { key: "meta_pixel_id", value: "" },
];

// Helper function to auto-initialize analytics settings if they don't exist
const ensureAnalyticsSettingsExist = async () => {
  try {
    const count = await AnalyticsSetting.countDocuments();
    
    if (count === 0) {
      await AnalyticsSetting.insertMany(DEFAULT_ANALYTICS_SETTINGS);
      logger.info("Auto-initialized default analytics settings");
    }
  } catch (err) {
    logger.error("Failed to initialize analytics settings", { error: err.message, stack: err.stack });
    throw err;
  }
};

/* ==========================================
   GET ALL ANALYTICS SETTINGS (PUBLIC)
   ========================================== */

export const getAnalyticsSettings = async (req, res) => {
  try {
    // Ensure analytics settings exist before fetching
    await ensureAnalyticsSettingsExist();
    
    const settings = await AnalyticsSetting.find({}).lean();
    
    // Convert array to object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      settings: settingsObj,
    });
  } catch (err) {
    logger.error("Failed to fetch analytics settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET ALL ANALYTICS SETTINGS (ADMIN)
   ========================================== */

export const getAllAnalyticsSettings = async (req, res) => {
  try {
    // Ensure analytics settings exist before fetching
    await ensureAnalyticsSettingsExist();

    const settings = await AnalyticsSetting.find({}).sort({ key: 1 }).lean();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    logger.error("Failed to fetch analytics settings (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE ANALYTICS SETTING (ADMIN)
   ========================================== */

export const updateAnalyticsSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
    }

    // Find or create the setting
    let setting = await AnalyticsSetting.findOne({ key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new AnalyticsSetting({
        key,
        value: value || "",
      });
    } else {
      // Update existing setting
      if (value !== undefined) {
        setting.value = value.trim();
      }
    }

    await setting.save();

    res.json({
      success: true,
      message: "Analytics setting updated successfully",
      setting,
    });
  } catch (err) {
    logger.error("Failed to update analytics setting", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update analytics setting",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT ANALYTICS SETTINGS (ADMIN)
   ========================================== */

export const initializeAnalyticsSettings = async (req, res) => {
  try {
    const results = await Promise.all(
      DEFAULT_ANALYTICS_SETTINGS.map(async (setting) => {
        const existing = await AnalyticsSetting.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new AnalyticsSetting({
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
      message: `Analytics settings initialized. ${createdCount} new settings added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize analytics settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize analytics settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
