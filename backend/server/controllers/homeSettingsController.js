import HomeSettings from "../models/HomeSettings.js";
import logger from "../utils/logger.js";

/* ==========================================
   DEFAULTS (BACKWARD COMPATIBILITY)
   ========================================== */

// These defaults mirror the previously hard-coded "Trending now" card on the
// HomePage so the public API returns a sensible, non-breaking payload even when
// no settings document exists yet.
const DEFAULT_HERO_TRENDING = {
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
      description: "Create stunning visuals with text prompts and style control.",
    },
    {
      name: "Notion AI",
      category: "Productivity",
      rating: 4.7,
      description: "Enhance your workspace with AI-powered summaries and writing.",
    },
  ],
};

const SETTINGS_KEY = "home";

/* ==========================================
   HELPERS
   ========================================== */

// Ensure the singleton settings document exists, creating it with defaults if
// it does not. Returns the document (may be a freshly created one).
const ensureHomeSettingsExist = async () => {
  try {
    let settings = await HomeSettings.findOne({ key: SETTINGS_KEY });

    if (!settings) {
      settings = new HomeSettings({
        key: SETTINGS_KEY,
        heroTrending: DEFAULT_HERO_TRENDING,
      });
      await settings.save();
      logger.info("Auto-initialized default Home settings");
    }

    return settings;
  } catch (err) {
    logger.error("Failed to initialize Home settings", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
};

// Merge stored heroTrending with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeHeroTrending = (heroTrending) => {
  const ht = heroTrending || {};
  return {
    title: typeof ht.title === "string" ? ht.title : DEFAULT_HERO_TRENDING.title,
    subtitle:
      typeof ht.subtitle === "string"
        ? ht.subtitle
        : DEFAULT_HERO_TRENDING.subtitle,
    icon: typeof ht.icon === "string" ? ht.icon : DEFAULT_HERO_TRENDING.icon,
    tools: Array.isArray(ht.tools) ? ht.tools : DEFAULT_HERO_TRENDING.tools,
  };
};

// Validate a heroTrending payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateHeroTrending = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["heroTrending must be an object."];
  }

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      errors.push("heroTrending.title must be a non-empty string.");
    } else if (input.title.trim().length > 120) {
      errors.push("heroTrending.title must not exceed 120 characters.");
    }
  }

  if (input.subtitle !== undefined) {
    if (typeof input.subtitle !== "string" || !input.subtitle.trim()) {
      errors.push("heroTrending.subtitle must be a non-empty string.");
    } else if (input.subtitle.trim().length > 120) {
      errors.push("heroTrending.subtitle must not exceed 120 characters.");
    }
  }

  if (input.icon !== undefined) {
    if (typeof input.icon !== "string" || !input.icon.trim()) {
      errors.push("heroTrending.icon must be a non-empty string.");
    } else if (input.icon.trim().length > 60) {
      errors.push("heroTrending.icon must not exceed 60 characters.");
    }
  }

  if (input.tools !== undefined) {
    if (!Array.isArray(input.tools)) {
      errors.push("heroTrending.tools must be an array.");
    } else {
      input.tools.forEach((tool, index) => {
        const label = `heroTrending.tools[${index}]`;

        if (typeof tool !== "object" || tool === null) {
          errors.push(`${label} must be an object.`);
          return;
        }

        if (typeof tool.name !== "string" || !tool.name.trim()) {
          errors.push(`${label}.name must be a non-empty string.`);
        } else if (tool.name.trim().length > 100) {
          errors.push(`${label}.name must not exceed 100 characters.`);
        }

        if (typeof tool.category !== "string" || !tool.category.trim()) {
          errors.push(`${label}.category must be a non-empty string.`);
        } else if (tool.category.trim().length > 60) {
          errors.push(`${label}.category must not exceed 60 characters.`);
        }

        if (typeof tool.rating !== "number" || !Number.isFinite(tool.rating)) {
          errors.push(`${label}.rating must be a number.`);
        } else if (tool.rating < 0 || tool.rating > 5) {
          errors.push(`${label}.rating must be between 0 and 5.`);
        }

        if (typeof tool.description !== "string" || !tool.description.trim()) {
          errors.push(`${label}.description must be a non-empty string.`);
        } else if (tool.description.trim().length > 300) {
          errors.push(`${label}.description must not exceed 300 characters.`);
        }
      });
    }
  }

  return errors;
};

/* ==========================================
   GET HOME SETTINGS (PUBLIC)
   ========================================== */

export const getHomeSettings = async (req, res) => {
  try {
    const settings = await ensureHomeSettingsExist();

    const heroTrending = normalizeHeroTrending(settings.heroTrending);

    res.json({
      success: true,
      settings: {
        heroTrending,
      },
    });
  } catch (err) {
    logger.error("Failed to fetch Home settings", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch Home settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE HOME SETTINGS (ADMIN)
   ========================================== */

export const updateHomeSettings = async (req, res) => {
  try {
    const { heroTrending } = req.body || {};

    // Validate the provided payload
    const errors = validateHeroTrending(heroTrending);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const settings = await ensureHomeSettingsExist();

    // Apply only the provided fields (partial update friendly)
    if (heroTrending.title !== undefined) {
      settings.heroTrending.title = heroTrending.title.trim();
    }
    if (heroTrending.subtitle !== undefined) {
      settings.heroTrending.subtitle = heroTrending.subtitle.trim();
    }
    if (heroTrending.icon !== undefined) {
      settings.heroTrending.icon = heroTrending.icon.trim();
    }
    if (heroTrending.tools !== undefined) {
      settings.heroTrending.tools = heroTrending.tools.map((tool) => ({
        name: tool.name.trim(),
        category: tool.category.trim(),
        rating: tool.rating,
        description: tool.description.trim(),
      }));
    }

    await settings.save();

    const updatedHeroTrending = normalizeHeroTrending(settings.heroTrending);

    res.json({
      success: true,
      message: "Home settings updated successfully",
      settings: {
        heroTrending: updatedHeroTrending,
      },
    });
  } catch (err) {
    logger.error("Failed to update Home settings", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update Home settings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};