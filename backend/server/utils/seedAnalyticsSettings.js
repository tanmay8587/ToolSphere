import AnalyticsSetting from "../models/AnalyticsSetting.js";
import logger from "./logger.js";

const seedAnalyticsSettings = async () => {
  try {
    const count = await AnalyticsSetting.countDocuments();

    if (count === 0) {
      logger.info("🌱 Seeding analytics settings...");

      const defaultSettings = [
        { key: "google_analytics_id", value: "" },
        { key: "google_search_console_code", value: "" },
        { key: "meta_pixel_id", value: "" },
      ];

      await AnalyticsSetting.insertMany(defaultSettings);
      logger.info(`✅ Seeded ${defaultSettings.length} analytics settings`);
    } else {
      logger.info("ℹ️ Analytics settings already exist, skipping seed");
    }
  } catch (err) {
    logger.error("⚠️ Analytics settings seed failed (non-blocking):", err.message);
  }
};

export default seedAnalyticsSettings;