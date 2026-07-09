import WebsiteBranding from "../models/WebsiteBranding.js";

const seedWebsiteBranding = async () => {
  try {
    const count = await WebsiteBranding.countDocuments();

    if (count === 0) {
      console.log("🌱 Seeding website branding settings...");

      const defaultSettings = [
        { key: "logo", value: "" },
        { key: "favicon", value: "" },
        { key: "site_name", value: "ToolSphere" },
        { key: "browser_title", value: "AI Tools Directory" },
      ];

      await WebsiteBranding.insertMany(defaultSettings);
      console.log(`✅ Seeded ${defaultSettings.length} website branding settings`);
    } else {
      console.log("ℹ️ Website branding settings already exist, skipping seed");
    }
  } catch (err) {
    console.error("⚠️ Website branding seed failed (non-blocking):", err.message);
  }
};

export default seedWebsiteBranding;