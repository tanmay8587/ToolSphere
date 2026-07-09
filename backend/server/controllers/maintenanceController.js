import MaintenanceSetting from "../models/MaintenanceSetting.js";
import logger from "../utils/logger.js";

/* ==========================================
   GET MAINTENANCE STATUS (PUBLIC)
   ========================================== */
export const getMaintenanceStatus = async (req, res) => {
  try {
    let setting = await MaintenanceSetting.findOne({ key: "maintenance_mode" });

    if (!setting) {
      // Create default setting if not exists
      setting = await MaintenanceSetting.create({
        key: "maintenance_mode",
        isEnabled: false,
        message: "We'll be back soon! The website is currently under maintenance.",
        estimatedTime: "",
      });
      logger.info("Created default maintenance setting");
    }

    res.json({
      success: true,
      isEnabled: setting.isEnabled,
      message: setting.message,
      estimatedTime: setting.estimatedTime,
    });
  } catch (err) {
    logger.error("Failed to fetch maintenance status", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance status",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   TOGGLE MAINTENANCE MODE (ADMIN)
========================================== */
export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { isEnabled, message, estimatedTime } = req.body;

    let setting = await MaintenanceSetting.findOne({ key: "maintenance_mode" });

    if (!setting) {
      setting = new MaintenanceSetting({
        key: "maintenance_mode",
        isEnabled: isEnabled !== undefined ? isEnabled : false,
        message: message || "We'll be back soon! The website is currently under maintenance.",
        estimatedTime: estimatedTime || "",
      });
    } else {
      if (isEnabled !== undefined) {
        setting.isEnabled = isEnabled;
      }
      if (message !== undefined) {
        setting.message = message;
      }
      if (estimatedTime !== undefined) {
        setting.estimatedTime = estimatedTime;
      }
    }

    await setting.save();

    res.json({
      success: true,
      message: `Maintenance mode ${setting.isEnabled ? "enabled" : "disabled"}`,
      isEnabled: setting.isEnabled,
      maintenance: setting,
    });
  } catch (err) {
    logger.error("Failed to toggle maintenance mode", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance mode",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE MAINTENANCE SETTINGS (ADMIN)
========================================== */
export const updateMaintenanceSettings = async (req, res) => {
  try {
    const { isEnabled, message, estimatedTime } = req.body;

    let setting = await MaintenanceSetting.findOne({ key: "maintenance_mode" });

    if (!setting) {
      setting = new MaintenanceSetting({
        key: "maintenance_mode",
        isEnabled: isEnabled || false,
        message: message || "We'll be back soon! The website is currently under maintenance.",
        estimatedTime: estimatedTime || "",
      });
    } else {
      if (isEnabled !== undefined) setting.isEnabled = isEnabled;
      if (message !== undefined) setting.message = message;
      if (estimatedTime !== undefined) setting.estimatedTime = estimatedTime;
    }

    await setting.save();

    res.json({
      success: true,
      message: "Maintenance settings updated",
      maintenance: setting,
    });
  } catch (err) {
    logger.error("Failed to update maintenance settings", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
