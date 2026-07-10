import WebsiteBranding from "../models/WebsiteBranding.js";
import logger from "./logger.js";

const seedWebsiteBranding = async () => {
  try {
    const count = await WebsiteBranding.countDocuments();

    if (count === 0) {
      logger.info("🌱 Seeding website branding settings...");

      const defaultSettings = [
        { key: "logo", value: "" },
        { key: "favicon", value: "" },
        { key: "site_name", value: "ToolSphere" },
        { key: "browser_title", value: "AI Tools Directory" },
      ];

      await WebsiteBranding.insertMany(defaultSettings);
      logger.info(`✅ Seeded ${defaultSettings.length} website branding settings`);
    } else {
      logger.info("ℹ️ Website branding settings already exist, skipping seed");
    }
  } catch (err) {
    logger.error("⚠️ Website branding seed failed (non-blocking):", err.message);
  }
};

export default seedWebsiteBranding;