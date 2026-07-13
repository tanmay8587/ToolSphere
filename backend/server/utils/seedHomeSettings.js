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
          badge: "Discover the future of AI products",
          heading: "Find the best AI tools for every workflow.",
          description:
            "Explore curated AI platforms for writing, coding, design, marketing, and more — all in one place.",
          searchPlaceholder: "Search AI tools, categories, tags...",
          buttonText: "Explore",
        },
        trendingCard: {
          label: "Trending now",
          title: "AI Design Stack",
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
        featuredCategories: {
          enabled: true,
          categoryOrder: [],
        },
        statsCounter: {
          enabled: true,
          items: [
            {
              label: "AI tools",
              value: "100+",
            },
            {
              label: "Real ratings",
              value: "Verified",
            },
            {
              label: "New releases weekly",
              value: "Updated",
            },
          ],
        },
        testimonials: {
          enabled: true,
          items: [
            {
              name: "Sarah Johnson",
              role: "Product Manager",
              content: "ToolSphere helped us discover the perfect AI tools for our workflow. The curated selection saves us hours of research.",
              rating: 5,
            },
            {
              name: "Michael Chen",
              role: "Software Engineer",
              content: "An invaluable resource for finding AI tools. The ratings and reviews are spot-on and help make informed decisions.",
              rating: 5,
            },
            {
              name: "Emily Rodriguez",
              role: "Marketing Director",
              content: "The best AI tools directory I've found. Clean interface, comprehensive listings, and great recommendations.",
              rating: 4.8,
            },
          ],
        },
        faqPreview: {
          enabled: true,
          items: [
            {
              question: "What is ToolSphere?",
              answer: "ToolSphere is a curated platform featuring the best AI tools for various workflows including writing, coding, design, and marketing.",
            },
            {
              question: "How do I find the right tool?",
              answer: "Use our search feature or browse categories to discover AI tools that match your specific needs and workflow requirements.",
            },
            {
              question: "Are the tools free to use?",
              answer: "Many tools offer free tiers or trials. Each tool listing includes pricing information to help you choose what fits your budget.",
            },
            {
              question: "How often are new tools added?",
              answer: "We update our directory weekly with new AI tools and platforms to ensure you have access to the latest innovations.",
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