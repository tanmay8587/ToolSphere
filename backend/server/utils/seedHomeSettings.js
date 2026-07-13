import HomeSettings from "../models/HomeSettings.js";
import logger from "./logger.js";

const seedHomeSettings = async () => {
  try {
    const count = await HomeSettings.countDocuments({ key: "home" });

    if (count === 0) {
      logger.info("🌱 Seeding Home settings...");

      const defaultSettings = new HomeSettings({
        key: "home",
        heroTrending: {
          title: "Trending now",
          subtitle: "AI Design Stack",
          icon: "FiZap",
          tools: [
            {
              name: "ChatGPT",
              category: "Writing",
              rating: 4.9,
              description:
                "A versatile conversational AI assistant for brainstorming and writing.",
            },
            {
              name: "Midjourney",
              category: "Image",
              rating: 4.8,
              description:
                "Create stunning visuals with text prompts and style control.",
            },
            {
              name: "Notion AI",
              category: "Productivity",
              rating: 4.7,
              description:
                "Enhance your workspace with AI-powered summaries and writing.",
            },
          ],
        },
      });

      await defaultSettings.save();
      logger.info("✅ Seeded Home settings");
    } else {
      logger.info("ℹ️ Home settings already exist, skipping seed");
    }
  } catch (err) {
    logger.error("⚠️ Home settings seed failed (non-blocking):", err.message);
  }
};

export default seedHomeSettings;