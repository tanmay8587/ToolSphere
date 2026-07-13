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
  badge: "Discover the future of AI products",
  heading: "Find the best AI tools for every workflow.",
  description:
    "Explore curated AI platforms for writing, coding, design, marketing, and more — all in one place.",
  searchPlaceholder: "Search AI tools, categories, tags...",
  buttonText: "Explore",
};

const DEFAULT_TRENDING_CARD = {
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

const DEFAULT_FEATURED_CATEGORIES = {
  enabled: true,
  categoryOrder: [],
};

const DEFAULT_STATS_COUNTER = {
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
};

const DEFAULT_TESTIMONIALS = {
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
};

const DEFAULT_FAQ_PREVIEW = {
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
};

const DEFAULT_CTA_SECTION = {
  enabled: true,
  title: "Ready to explore AI tools?",
  description: "Join thousands of users discovering the best AI tools for their workflow. Start exploring ToolSphere today.",
  primaryButtonText: "Browse All Tools",
  primaryButtonLink: "/tools",
  secondaryButtonText: "View Categories",
  secondaryButtonLink: "/categories",
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
    badge: typeof ht.badge === "string" ? ht.badge : DEFAULT_HERO_TRENDING.badge,
    heading: typeof ht.heading === "string" ? ht.heading : DEFAULT_HERO_TRENDING.heading,
    description: typeof ht.description === "string" ? ht.description : DEFAULT_HERO_TRENDING.description,
    searchPlaceholder: typeof ht.searchPlaceholder === "string" ? ht.searchPlaceholder : DEFAULT_HERO_TRENDING.searchPlaceholder,
    buttonText: typeof ht.buttonText === "string" ? ht.buttonText : DEFAULT_HERO_TRENDING.buttonText,
  };
};

// Merge stored trendingCard with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeTrendingCard = (trendingCard) => {
  const tc = trendingCard || {};
  return {
    label: typeof tc.label === "string" ? tc.label : DEFAULT_TRENDING_CARD.label,
    title: typeof tc.title === "string" ? tc.title : DEFAULT_TRENDING_CARD.title,
    icon: typeof tc.icon === "string" ? tc.icon : DEFAULT_TRENDING_CARD.icon,
    tools: Array.isArray(tc.tools) ? tc.tools : DEFAULT_TRENDING_CARD.tools,
  };
};

// Merge stored featuredCategories with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeFeaturedCategories = (featuredCategories) => {
  const fc = featuredCategories || {};
  return {
    enabled: typeof fc.enabled === "boolean" ? fc.enabled : DEFAULT_FEATURED_CATEGORIES.enabled,
    categoryOrder: Array.isArray(fc.categoryOrder) ? fc.categoryOrder : DEFAULT_FEATURED_CATEGORIES.categoryOrder,
  };
};

// Merge stored statsCounter with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeStatsCounter = (statsCounter) => {
  const sc = statsCounter || {};
  return {
    enabled: typeof sc.enabled === "boolean" ? sc.enabled : DEFAULT_STATS_COUNTER.enabled,
    items: Array.isArray(sc.items) ? sc.items : DEFAULT_STATS_COUNTER.items,
  };
};

// Merge stored testimonials with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeTestimonials = (testimonials) => {
  const tn = testimonials || {};
  return {
    enabled: typeof tn.enabled === "boolean" ? tn.enabled : DEFAULT_TESTIMONIALS.enabled,
    items: Array.isArray(tn.items) ? tn.items : DEFAULT_TESTIMONIALS.items,
  };
};

// Merge stored faqPreview with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeFaqPreview = (faqPreview) => {
  const fp = faqPreview || {};
  return {
    enabled: typeof fp.enabled === "boolean" ? fp.enabled : DEFAULT_FAQ_PREVIEW.enabled,
    items: Array.isArray(fp.items) ? fp.items : DEFAULT_FAQ_PREVIEW.items,
  };
};

// Merge stored ctaSection with defaults so the response always contains a
// complete, stable shape (backward compatibility for partial/legacy docs).
const normalizeCtaSection = (ctaSection) => {
  const cs = ctaSection || {};
  return {
    enabled: typeof cs.enabled === "boolean" ? cs.enabled : DEFAULT_CTA_SECTION.enabled,
    title: typeof cs.title === "string" ? cs.title : DEFAULT_CTA_SECTION.title,
    description: typeof cs.description === "string" ? cs.description : DEFAULT_CTA_SECTION.description,
    primaryButtonText: typeof cs.primaryButtonText === "string" ? cs.primaryButtonText : DEFAULT_CTA_SECTION.primaryButtonText,
    primaryButtonLink: typeof cs.primaryButtonLink === "string" ? cs.primaryButtonLink : DEFAULT_CTA_SECTION.primaryButtonLink,
    secondaryButtonText: typeof cs.secondaryButtonText === "string" ? cs.secondaryButtonText : DEFAULT_CTA_SECTION.secondaryButtonText,
    secondaryButtonLink: typeof cs.secondaryButtonLink === "string" ? cs.secondaryButtonLink : DEFAULT_CTA_SECTION.secondaryButtonLink,
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

  if (input.badge !== undefined) {
    if (typeof input.badge !== "string" || !input.badge.trim()) {
      errors.push("heroTrending.badge must be a non-empty string.");
    } else if (input.badge.trim().length > 120) {
      errors.push("heroTrending.badge must not exceed 120 characters.");
    }
  }

  if (input.heading !== undefined) {
    if (typeof input.heading !== "string" || !input.heading.trim()) {
      errors.push("heroTrending.heading must be a non-empty string.");
    } else if (input.heading.trim().length > 200) {
      errors.push("heroTrending.heading must not exceed 200 characters.");
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string" || !input.description.trim()) {
      errors.push("heroTrending.description must be a non-empty string.");
    } else if (input.description.trim().length > 500) {
      errors.push("heroTrending.description must not exceed 500 characters.");
    }
  }

  if (input.searchPlaceholder !== undefined) {
    if (typeof input.searchPlaceholder !== "string" || !input.searchPlaceholder.trim()) {
      errors.push("heroTrending.searchPlaceholder must be a non-empty string.");
    } else if (input.searchPlaceholder.trim().length > 120) {
      errors.push("heroTrending.searchPlaceholder must not exceed 120 characters.");
    }
  }

  if (input.buttonText !== undefined) {
    if (typeof input.buttonText !== "string" || !input.buttonText.trim()) {
      errors.push("heroTrending.buttonText must be a non-empty string.");
    } else if (input.buttonText.trim().length > 60) {
      errors.push("heroTrending.buttonText must not exceed 60 characters.");
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

// Validate a trendingCard payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateTrendingCard = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["trendingCard must be an object."];
  }

  if (input.label !== undefined) {
    if (typeof input.label !== "string" || !input.label.trim()) {
      errors.push("trendingCard.label must be a non-empty string.");
    } else if (input.label.trim().length > 120) {
      errors.push("trendingCard.label must not exceed 120 characters.");
    }
  }

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      errors.push("trendingCard.title must be a non-empty string.");
    } else if (input.title.trim().length > 120) {
      errors.push("trendingCard.title must not exceed 120 characters.");
    }
  }

  if (input.icon !== undefined) {
    if (typeof input.icon !== "string" || !input.icon.trim()) {
      errors.push("trendingCard.icon must be a non-empty string.");
    } else if (input.icon.trim().length > 60) {
      errors.push("trendingCard.icon must not exceed 60 characters.");
    }
  }

  if (input.tools !== undefined) {
    if (!Array.isArray(input.tools)) {
      errors.push("trendingCard.tools must be an array.");
    } else {
      input.tools.forEach((tool, index) => {
        const label = `trendingCard.tools[${index}]`;

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

// Validate a featuredCategories payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateFeaturedCategories = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["featuredCategories must be an object."];
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      errors.push("featuredCategories.enabled must be a boolean.");
    }
  }

  if (input.categoryOrder !== undefined) {
    if (!Array.isArray(input.categoryOrder)) {
      errors.push("featuredCategories.categoryOrder must be an array.");
    } else {
      input.categoryOrder.forEach((cat, index) => {
        if (typeof cat !== "string" || !cat.trim()) {
          errors.push(`featuredCategories.categoryOrder[${index}] must be a non-empty string.`);
        } else if (cat.trim().length > 120) {
          errors.push(`featuredCategories.categoryOrder[${index}] must not exceed 120 characters.`);
        }
      });
    }
  }

  return errors;
};

// Validate a statsCounter payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateStatsCounter = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["statsCounter must be an object."];
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      errors.push("statsCounter.enabled must be a boolean.");
    }
  }

  if (input.items !== undefined) {
    if (!Array.isArray(input.items)) {
      errors.push("statsCounter.items must be an array.");
    } else {
      input.items.forEach((item, index) => {
        const label = `statsCounter.items[${index}]`;

        if (typeof item !== "object" || item === null) {
          errors.push(`${label} must be an object.`);
          return;
        }

        if (typeof item.label !== "string" || !item.label.trim()) {
          errors.push(`${label}.label must be a non-empty string.`);
        } else if (item.label.trim().length > 120) {
          errors.push(`${label}.label must not exceed 120 characters.`);
        }

        if (typeof item.value !== "string" || !item.value.trim()) {
          errors.push(`${label}.value must be a non-empty string.`);
        } else if (item.value.trim().length > 60) {
          errors.push(`${label}.value must not exceed 60 characters.`);
        }
      });
    }
  }

  return errors;
};

// Validate a testimonials payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateTestimonials = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["testimonials must be an object."];
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      errors.push("testimonials.enabled must be a boolean.");
    }
  }

  if (input.items !== undefined) {
    if (!Array.isArray(input.items)) {
      errors.push("testimonials.items must be an array.");
    } else {
      input.items.forEach((item, index) => {
        const label = `testimonials.items[${index}]`;

        if (typeof item !== "object" || item === null) {
          errors.push(`${label} must be an object.`);
          return;
        }

        if (typeof item.name !== "string" || !item.name.trim()) {
          errors.push(`${label}.name must be a non-empty string.`);
        } else if (item.name.trim().length > 120) {
          errors.push(`${label}.name must not exceed 120 characters.`);
        }

        if (typeof item.role !== "string" || !item.role.trim()) {
          errors.push(`${label}.role must be a non-empty string.`);
        } else if (item.role.trim().length > 120) {
          errors.push(`${label}.role must not exceed 120 characters.`);
        }

        if (typeof item.content !== "string" || !item.content.trim()) {
          errors.push(`${label}.content must be a non-empty string.`);
        } else if (item.content.trim().length > 500) {
          errors.push(`${label}.content must not exceed 500 characters.`);
        }

        if (typeof item.rating !== "number" || !Number.isFinite(item.rating)) {
          errors.push(`${label}.rating must be a number.`);
        } else if (item.rating < 0 || item.rating > 5) {
          errors.push(`${label}.rating must be between 0 and 5.`);
        }
      });
    }
  }

  return errors;
};

// Validate a faqPreview payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateFaqPreview = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["faqPreview must be an object."];
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      errors.push("faqPreview.enabled must be a boolean.");
    }
  }

  if (input.items !== undefined) {
    if (!Array.isArray(input.items)) {
      errors.push("faqPreview.items must be an array.");
    } else {
      input.items.forEach((item, index) => {
        const label = `faqPreview.items[${index}]`;

        if (typeof item !== "object" || item === null) {
          errors.push(`${label} must be an object.`);
          return;
        }

        if (typeof item.question !== "string" || !item.question.trim()) {
          errors.push(`${label}.question must be a non-empty string.`);
        } else if (item.question.trim().length > 200) {
          errors.push(`${label}.question must not exceed 200 characters.`);
        }

        if (typeof item.answer !== "string" || !item.answer.trim()) {
          errors.push(`${label}.answer must be a non-empty string.`);
        } else if (item.answer.trim().length > 500) {
          errors.push(`${label}.answer must not exceed 500 characters.`);
        }
      });
    }
  }

  return errors;
};

// Validate a ctaSection payload. Supports partial updates: only provided
// fields are validated. Returns an array of error strings (empty = valid).
const validateCtaSection = (input) => {
  const errors = [];

  if (input === undefined || input === null || typeof input !== "object") {
    return ["ctaSection must be an object."];
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      errors.push("ctaSection.enabled must be a boolean.");
    }
  }

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      errors.push("ctaSection.title must be a non-empty string.");
    } else if (input.title.trim().length > 200) {
      errors.push("ctaSection.title must not exceed 200 characters.");
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string" || !input.description.trim()) {
      errors.push("ctaSection.description must be a non-empty string.");
    } else if (input.description.trim().length > 500) {
      errors.push("ctaSection.description must not exceed 500 characters.");
    }
  }

  if (input.primaryButtonText !== undefined) {
    if (typeof input.primaryButtonText !== "string" || !input.primaryButtonText.trim()) {
      errors.push("ctaSection.primaryButtonText must be a non-empty string.");
    } else if (input.primaryButtonText.trim().length > 60) {
      errors.push("ctaSection.primaryButtonText must not exceed 60 characters.");
    }
  }

  if (input.primaryButtonLink !== undefined) {
    if (typeof input.primaryButtonLink !== "string" || !input.primaryButtonLink.trim()) {
      errors.push("ctaSection.primaryButtonLink must be a non-empty string.");
    } else if (input.primaryButtonLink.trim().length > 200) {
      errors.push("ctaSection.primaryButtonLink must not exceed 200 characters.");
    }
  }

  if (input.secondaryButtonText !== undefined) {
    if (typeof input.secondaryButtonText !== "string" || !input.secondaryButtonText.trim()) {
      errors.push("ctaSection.secondaryButtonText must be a non-empty string.");
    } else if (input.secondaryButtonText.trim().length > 60) {
      errors.push("ctaSection.secondaryButtonText must not exceed 60 characters.");
    }
  }

  if (input.secondaryButtonLink !== undefined) {
    if (typeof input.secondaryButtonLink !== "string" || !input.secondaryButtonLink.trim()) {
      errors.push("ctaSection.secondaryButtonLink must be a non-empty string.");
    } else if (input.secondaryButtonLink.trim().length > 200) {
      errors.push("ctaSection.secondaryButtonLink must not exceed 200 characters.");
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
    const trendingCard = normalizeTrendingCard(settings.trendingCard);
    const featuredCategories = normalizeFeaturedCategories(settings.featuredCategories);
    const statsCounter = normalizeStatsCounter(settings.statsCounter);
    const testimonials = normalizeTestimonials(settings.testimonials);
    const faqPreview = normalizeFaqPreview(settings.faqPreview);
    const ctaSection = normalizeCtaSection(settings.ctaSection);

    res.json({
      success: true,
      settings: {
        heroTrending,
        trendingCard,
        featuredCategories,
        statsCounter,
        testimonials,
        faqPreview,
        ctaSection,
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
    const { heroTrending, trendingCard, featuredCategories, statsCounter, testimonials, faqPreview, ctaSection } = req.body || {};

    // Validate the provided payloads
    const heroErrors = validateHeroTrending(heroTrending);
    const trendingErrors = validateTrendingCard(trendingCard);
    const featuredErrors = validateFeaturedCategories(featuredCategories);
    const statsErrors = validateStatsCounter(statsCounter);
    const testimonialsErrors = validateTestimonials(testimonials);
    const faqErrors = validateFaqPreview(faqPreview);
    const ctaErrors = validateCtaSection(ctaSection);

    const errors = [...heroErrors, ...trendingErrors, ...featuredErrors, ...statsErrors, ...testimonialsErrors, ...faqErrors, ...ctaErrors];

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const settings = await ensureHomeSettingsExist();

    // Apply only the provided fields (partial update friendly)
    if (heroTrending) {
      if (heroTrending.title !== undefined) {
        settings.heroTrending.title = heroTrending.title.trim();
      }
      if (heroTrending.subtitle !== undefined) {
        settings.heroTrending.subtitle = heroTrending.subtitle.trim();
      }
      if (heroTrending.icon !== undefined) {
        settings.heroTrending.icon = heroTrending.icon.trim();
      }
      if (heroTrending.badge !== undefined) {
        settings.heroTrending.badge = heroTrending.badge.trim();
      }
      if (heroTrending.heading !== undefined) {
        settings.heroTrending.heading = heroTrending.heading.trim();
      }
      if (heroTrending.description !== undefined) {
        settings.heroTrending.description = heroTrending.description.trim();
      }
      if (heroTrending.searchPlaceholder !== undefined) {
        settings.heroTrending.searchPlaceholder = heroTrending.searchPlaceholder.trim();
      }
      if (heroTrending.buttonText !== undefined) {
        settings.heroTrending.buttonText = heroTrending.buttonText.trim();
      }
      if (heroTrending.tools !== undefined) {
        settings.heroTrending.tools = heroTrending.tools.map((tool) => ({
          name: tool.name.trim(),
          category: tool.category.trim(),
          rating: tool.rating,
          description: tool.description.trim(),
        }));
      }
    }

    if (trendingCard) {
      if (trendingCard.label !== undefined) {
        settings.trendingCard.label = trendingCard.label.trim();
      }
      if (trendingCard.title !== undefined) {
        settings.trendingCard.title = trendingCard.title.trim();
      }
      if (trendingCard.icon !== undefined) {
        settings.trendingCard.icon = trendingCard.icon.trim();
      }
      if (trendingCard.tools !== undefined) {
        settings.trendingCard.tools = trendingCard.tools.map((tool) => ({
          name: tool.name.trim(),
          category: tool.category.trim(),
          rating: tool.rating,
          description: tool.description.trim(),
        }));
      }
    }

    if (featuredCategories) {
      if (featuredCategories.enabled !== undefined) {
        settings.featuredCategories.enabled = featuredCategories.enabled;
      }
      if (featuredCategories.categoryOrder !== undefined) {
        settings.featuredCategories.categoryOrder = featuredCategories.categoryOrder.map((cat) => cat.trim());
      }
    }

    if (statsCounter) {
      if (statsCounter.enabled !== undefined) {
        settings.statsCounter.enabled = statsCounter.enabled;
      }
      if (statsCounter.items !== undefined) {
        settings.statsCounter.items = statsCounter.items.map((item) => ({
          label: item.label.trim(),
          value: item.value.trim(),
        }));
      }
    }

    if (testimonials) {
      if (testimonials.enabled !== undefined) {
        settings.testimonials.enabled = testimonials.enabled;
      }
      if (testimonials.items !== undefined) {
        settings.testimonials.items = testimonials.items.map((item) => ({
          name: item.name.trim(),
          role: item.role.trim(),
          content: item.content.trim(),
          rating: item.rating,
        }));
      }
    }

    if (faqPreview) {
      if (faqPreview.enabled !== undefined) {
        settings.faqPreview.enabled = faqPreview.enabled;
      }
      if (faqPreview.items !== undefined) {
        settings.faqPreview.items = faqPreview.items.map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }));
      }
    }

    if (ctaSection) {
      if (ctaSection.enabled !== undefined) {
        settings.ctaSection.enabled = ctaSection.enabled;
      }
      if (ctaSection.title !== undefined) {
        settings.ctaSection.title = ctaSection.title.trim();
      }
      if (ctaSection.description !== undefined) {
        settings.ctaSection.description = ctaSection.description.trim();
      }
      if (ctaSection.primaryButtonText !== undefined) {
        settings.ctaSection.primaryButtonText = ctaSection.primaryButtonText.trim();
      }
      if (ctaSection.primaryButtonLink !== undefined) {
        settings.ctaSection.primaryButtonLink = ctaSection.primaryButtonLink.trim();
      }
      if (ctaSection.secondaryButtonText !== undefined) {
        settings.ctaSection.secondaryButtonText = ctaSection.secondaryButtonText.trim();
      }
      if (ctaSection.secondaryButtonLink !== undefined) {
        settings.ctaSection.secondaryButtonLink = ctaSection.secondaryButtonLink.trim();
      }
    }

    await settings.save();

    const updatedHeroTrending = normalizeHeroTrending(settings.heroTrending);
    const updatedTrendingCard = normalizeTrendingCard(settings.trendingCard);
    const updatedFeaturedCategories = normalizeFeaturedCategories(settings.featuredCategories);
    const updatedStatsCounter = normalizeStatsCounter(settings.statsCounter);
    const updatedTestimonials = normalizeTestimonials(settings.testimonials);
    const updatedFaqPreview = normalizeFaqPreview(settings.faqPreview);
    const updatedCtaSection = normalizeCtaSection(settings.ctaSection);

    res.json({
      success: true,
      message: "Home settings updated successfully",
      settings: {
        heroTrending: updatedHeroTrending,
        trendingCard: updatedTrendingCard,
        featuredCategories: updatedFeaturedCategories,
        statsCounter: updatedStatsCounter,
        testimonials: updatedTestimonials,
        faqPreview: updatedFaqPreview,
        ctaSection: updatedCtaSection,
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
