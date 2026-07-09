import SeoSetting from "../models/SeoSetting.js";

const seedSeoSettings = async () => {
  try {
    const count = await SeoSetting.countDocuments();

    if (count === 0) {
      console.log("🌱 Seeding SEO settings...");

      const defaultSettings = [
        { key: "default_meta_title", value: "AI Tools Directory" },
        { key: "meta_description", value: "Discover the best AI tools for your workflow. Find, compare, and explore top AI platforms in one place." },
        { key: "keywords", value: "AI tools, artificial intelligence, machine learning, productivity, automation" },
        { key: "og_image", value: "" },
        { key: "twitter_image", value: "" },
        { key: "canonical_url", value: "" },
      ];

      await SeoSetting.insertMany(defaultSettings);
      console.log(`✅ Seeded ${defaultSettings.length} SEO settings`);
    } else {
      console.log("ℹ️ SEO settings already exist, skipping seed");
    }
  } catch (err) {
    console.error("⚠️ SEO settings seed failed (non-blocking):", err.message);
  }
};

export default seedSeoSettings;