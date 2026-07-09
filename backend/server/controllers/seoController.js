import SeoSetting from "../models/SeoSetting.js";
import logger from "../utils/logger.js";

// Default SEO settings
const DEFAULT_SEO_SETTINGS = [
  { key: "default_meta_title", value: "AI Tools Directory" },
  { key: "meta_description", value: "Discover the best AI tools for your workflow. Find, compare, and explore top AI platforms in one place." },
  { key: "keywords", value: "AI tools, artificial intelligence, machine learning, productivity, automation" },
  { key: "og_image", value: "" },
  { key: "twitter_image", value: "" },
  { key: "canonical_url", value: "" },
];

// Helper function to auto-initialize SEO settings if they don't exist
const ensureSeoSettingsExist = async () => {
  try {
    const count = await SeoSetting.countDocuments();
    
    if (count === 0) {
      await SeoSetting.insertMany(DEFAULT_SEO_SETTINGS);
      logger.info("Auto-initialized default SEO settings");
    }
  } catch (err) {
    logger.error("Failed to initialize SEO settings", { error: err.message, stack: err.stack });
    throw err;
  }
};

/* ==========================================
   GET ALL SEO SETTINGS (PUBLIC)
   ========================================== */

export const getSeoSettings = async (req, res) => {
  try {
    // Ensure SEO settings exist before fetching
    await ensureSeoSettingsExist();
    
    const settings = await SeoSetting.find({}).lean();
    
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
    logger.error("Failed to fetch SEO settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch SEO settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET ALL SEO SETTINGS (ADMIN)
   ========================================== */

export const getAllSeoSettings = async (req, res) => {
  try {
    // Ensure SEO settings exist before fetching
    await ensureSeoSettingsExist();
    
    const settings = await SeoSetting.find({}).sort({ key: 1 }).lean();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    logger.error("Failed to fetch SEO settings (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch SEO settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE SEO SETTING (ADMIN)
   ========================================== */

export const updateSeoSetting = async (req, res) => {
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
    let setting = await SeoSetting.findOne({ key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new SeoSetting({
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
      message: "SEO setting updated successfully",
      setting,
    });
  } catch (err) {
    logger.error("Failed to update SEO setting", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update SEO setting",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT SEO SETTINGS (ADMIN)
   ========================================== */

export const initializeSeoSettings = async (req, res) => {
  try {
    const results = await Promise.all(
      DEFAULT_SEO_SETTINGS.map(async (setting) => {
        const existing = await SeoSetting.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new SeoSetting({
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
      message: `SEO settings initialized. ${createdCount} new settings added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize SEO settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize SEO settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
