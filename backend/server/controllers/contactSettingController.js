import ContactSetting from "../models/ContactSetting.js";
import logger from "../utils/logger.js";

// Default contact settings
const DEFAULT_CONTACT_SETTINGS = [
  // Contact page settings
  { key: "hero_badge", value: "Get In Touch" },
  { key: "hero_heading", value: "Let's Talk About AI" },
  { key: "hero_description", value: "Have a question about a tool, want to submit a product, or just want to say hello? We're here for you." },
  { key: "faq_button_text", value: "Check FAQ First" },
  { key: "contact_email", value: "hello@toolsphere.ai" },
  { key: "office_location", value: "San Francisco, CA" },
  { key: "response_time", value: "Mon-Fri, 9AM-6PM PST" },
  { key: "working_days", value: "Monday - Friday" },
  { key: "working_hours", value: "9:00 AM - 6:00 PM" },
  // Footer settings
  { key: "footer_copyright", value: "ToolSphere" },
  { key: "footer_description", value: "Discover & explore the best AI tools in one place. Curated directory of top AI platforms for every workflow." },
  { key: "footer_email", value: "hello@toolsphere.ai" },
  { key: "footer_disclaimer", value: "All tools are provided by their respective owners. We are not affiliated with any tool unless explicitly stated." },
];

// Helper function to auto-initialize contact settings if they don't exist
const ensureContactSettingsExist = async () => {
  try {
    const count = await ContactSetting.countDocuments();
    
    if (count === 0) {
      await ContactSetting.insertMany(DEFAULT_CONTACT_SETTINGS);
      logger.info("Auto-initialized default contact settings");
    }
  } catch (err) {
    logger.error("Failed to initialize contact settings", { error: err.message });
    throw err;
  }
};

/* ==========================================
   GET ALL CONTACT SETTINGS (PUBLIC)
   ========================================== */

export const getContactSettings = async (req, res) => {
  try {
    // Ensure contact settings exist before fetching
    await ensureContactSettingsExist();
    
    const settings = await ContactSetting.find({}).lean();
    
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
    logger.error("Failed to fetch contact settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET FOOTER SETTINGS (PUBLIC)
   ========================================== */

export const getFooterSettings = async (req, res) => {
  try {
    // Ensure contact settings exist before fetching
    await ensureContactSettingsExist();
    
    const footerKeys = [
      "footer_copyright",
      "footer_description",
      "footer_email",
      "footer_disclaimer",
    ];
    
    const settings = await ContactSetting.find({ key: { $in: footerKeys } }).lean();
    
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
    logger.error("Failed to fetch footer settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch footer settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET ALL CONTACT SETTINGS (ADMIN)
   ========================================== */

export const getAllContactSettings = async (req, res) => {
  try {
    // Ensure contact settings exist before fetching
    await ensureContactSettingsExist();

    const settings = await ContactSetting.find({}).sort({ key: 1 }).lean();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    logger.error("Failed to fetch contact settings (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE CONTACT SETTING (ADMIN)
   ========================================== */

export const updateContactSetting = async (req, res) => {
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
    let setting = await ContactSetting.findOne({ key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = new ContactSetting({
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
      message: "Contact setting updated successfully",
      setting,
    });
  } catch (err) {
    logger.error("Failed to update contact setting", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update contact setting",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT CONTACT SETTINGS (ADMIN)
   ========================================== */

export const initializeContactSettings = async (req, res) => {
  try {
    const results = await Promise.all(
      DEFAULT_CONTACT_SETTINGS.map(async (setting) => {
        const existing = await ContactSetting.findOne({ key: setting.key });
        if (!existing) {
          const newSetting = new ContactSetting({
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
      message: `Contact settings initialized. ${createdCount} new settings added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize contact settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize contact settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
