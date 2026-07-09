import WebsiteBranding from "../models/WebsiteBranding.js";
import logger from "../utils/logger.js";

// Default website branding settings
const DEFAULT_BRANDING_SETTINGS = [
  { key: "logo", value: "" },
  { key: "favicon", value: "" },
  { key: "site_name", value: "ToolSphere" },
  { key: "browser_title", value: "AI Tools Directory" },
];

// Helper function to auto-initialize branding settings if they don't exist
const ensureBrandingSettingsExist = async () => {
  try {
    const count = await WebsiteBranding.countDocuments();
    
    if (count === 0) {
      await WebsiteBranding.insertMany(DEFAULT_BRANDING_SETTINGS);
      logger.info("Auto-initialized default website branding settings");
    }
  } catch (err) {
    logger.error("Failed to initialize branding settings", { error: err.message, stack: err.stack });
    throw err;
  }
};

/* ==========================================
   GET ALL BRANDING SETTINGS (PUBLIC)
   ========================================== */

export const getBrandingSettings = async (req, res) => {
  try {
    // Ensure branding settings exist before fetching
    await ensureBrandingSettingsExist();
    
    const settings = await WebsiteBranding.find({}).lean();
    
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
    logger.error("Failed to fetch branding settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch branding settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET ALL BRANDING SETTINGS (ADMIN)
   ========================================== */

export const getAllBrandingSettings = async (req, res) => {
  try {
    // Ensure branding settings exist before fetching
    await ensureBrandingSettingsExist();

    const settings = await WebsiteBranding.find({}).sort({ key: 1 }).lean();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    logger.error("Failed to fetch branding settings (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch branding settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE BRANDING SETTING (ADMIN)
   ========================================== */

export const updateBrandingSetting = async (req, res) => {
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
    let setting = await WebsiteBranding.findOne({ key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new WebsiteBranding({
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
      message: "Branding setting updated successfully",
      setting,
    });
  } catch (err) {
    logger.error("Failed to update branding setting", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update branding setting",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT BRANDING SETTINGS (ADMIN)
   ========================================== */

export const initializeBrandingSettings = async (req, res) => {
  try {
    const results = await Promise.all(
      DEFAULT_BRANDING_SETTINGS.map(async (setting) => {
        const existing = await WebsiteBranding.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new WebsiteBranding({
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
      message: `Branding settings initialized. ${createdCount} new settings added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize branding settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize branding settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
