import AnalyticsSetting from "../models/AnalyticsSetting.js";

const seedAnalyticsSettings = async () => {
  try {
    const count = await AnalyticsSetting.countDocuments();

    if (count === 0) {
      console.log("🌱 Seeding analytics settings...");

      const defaultSettings = [
        { key: "google_analytics_id", value: "" },
        { key: "google_search_console_code", value: "" },
        { key: "meta_pixel_id", value: "" },
      ];

      await AnalyticsSetting.insertMany(defaultSettings);
      console.log(`✅ Seeded ${defaultSettings.length} analytics settings`);
    } else {
      console.log("ℹ️ Analytics settings already exist, skipping seed");
    }
  } catch (err) {
    console.error("⚠️ Analytics settings seed failed (non-blocking):", err.message);
  }
};

export default seedAnalyticsSettings;