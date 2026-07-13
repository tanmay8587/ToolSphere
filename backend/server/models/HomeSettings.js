import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

/* ==========================================
   HERO TRENDING TOOL SUB-SCHEMA
   ========================================== */

const heroTrendingToolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: true }
);

/* ==========================================
   HERO TRENDING SUB-SCHEMA
   ========================================== */

const heroTrendingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Trending now",
      trim: true,
      maxlength: 120,
    },
    subtitle: {
      type: String,
      default: "AI Design Stack",
      trim: true,
      maxlength: 120,
    },
    icon: {
      type: String,
      default: "FiZap",
      trim: true,
      maxlength: 60,
    },
    tools: {
      type: [heroTrendingToolSchema],
      default: [],
    },
    badge: {
      type: String,
      default: "Discover the future of AI products",
      trim: true,
      maxlength: 120,
    },
    heading: {
      type: String,
      default: "Find the best AI tools for every workflow.",
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "Explore curated AI platforms for writing, coding, design, marketing, and more — all in one place.",
      trim: true,
      maxlength: 500,
    },
    searchPlaceholder: {
      type: String,
      default: "Search AI tools, categories, tags...",
      trim: true,
      maxlength: 120,
    },
    buttonText: {
      type: String,
      default: "Explore",
      trim: true,
      maxlength: 60,
    },
  },
  { _id: false }
);

/* ==========================================
   TRENDING CARD SUB-SCHEMA
   ========================================== */

const trendingCardSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "Trending now",
      trim: true,
      maxlength: 120,
    },
    title: {
      type: String,
      default: "AI Design Stack",
      trim: true,
      maxlength: 120,
    },
    icon: {
      type: String,
      default: "FiZap",
      trim: true,
      maxlength: 60,
    },
    tools: {
      type: [heroTrendingToolSchema],
      default: [],
    },
  },
  { _id: false }
);

/* ==========================================
   FEATURED CATEGORIES SUB-SCHEMA
   ========================================== */

const featuredCategoriesSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    categoryOrder: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/* ==========================================
   STATS COUNTER SUB-SCHEMA
   ========================================== */

const statsCounterSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    items: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: 120,
        },
        value: {
          type: String,
          required: true,
          trim: true,
          maxlength: 60,
        },
      },
    ],
  },
  { _id: false }
);

/* ==========================================
   TESTIMONIALS SUB-SCHEMA
   ========================================== */

const testimonialsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 120,
        },
        role: {
          type: String,
          required: true,
          trim: true,
          maxlength: 120,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        rating: {
          type: Number,
          required: true,
          min: 0,
          max: 5,
        },
      },
    ],
  },
  { _id: false }
);

/* ==========================================
   FAQ PREVIEW SUB-SCHEMA
   ========================================== */

const faqPreviewSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    items: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        answer: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
      },
    ],
  },
  { _id: false }
);

/* ==========================================
   CTA SECTION SUB-SCHEMA
   ========================================== */

const ctaSectionSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: "Ready to explore AI tools?",
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "Join thousands of users discovering the best AI tools for their workflow. Start exploring ToolSphere today.",
      trim: true,
      maxlength: 500,
    },
    primaryButtonText: {
      type: String,
      default: "Browse All Tools",
      trim: true,
      maxlength: 60,
    },
    primaryButtonLink: {
      type: String,
      default: "/tools",
      trim: true,
      maxlength: 200,
    },
    secondaryButtonText: {
      type: String,
      default: "View Categories",
      trim: true,
      maxlength: 60,
    },
    secondaryButtonLink: {
      type: String,
      default: "/categories",
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

/* ==========================================
   HOME SETTINGS (SINGLETON) SCHEMA
   ========================================== */

const homeSettingsSchema = new mongoose.Schema(
  {
    // Singleton document: a single settings record identified by a fixed key.
    // Keeping a key (instead of relying on _id) makes the document stable and
    // easy to locate/seed, while remaining backward compatible with any future
    // multi-section expansion.
    key: {
      type: String,
      default: "home",
      unique: true,
      trim: true,
    },
    heroTrending: {
      type: heroTrendingSchema,
      default: () => ({}),
    },
    trendingCard: {
      type: trendingCardSchema,
      default: () => ({}),
    },
    featuredCategories: {
      type: featuredCategoriesSchema,
      default: () => ({}),
    },
    statsCounter: {
      type: statsCounterSchema,
      default: () => ({}),
    },
    testimonials: {
      type: testimonialsSchema,
      default: () => ({}),
    },
    faqPreview: {
      type: faqPreviewSchema,
      default: () => ({}),
    },
    ctaSection: {
      type: ctaSectionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================
   PRE-SAVE SANITIZATION (XSS PREVENTION)
   ========================================== */

homeSettingsSchema.pre("save", function (next) {
  const ht = this.heroTrending;
  const tc = this.trendingCard;

  if (ht) {
    if (this.isModified("heroTrending.title") && ht.title) {
      ht.title = sanitizeTextField(ht.title);
    }
    if (this.isModified("heroTrending.subtitle") && ht.subtitle) {
      ht.subtitle = sanitizeTextField(ht.subtitle);
    }
    if (this.isModified("heroTrending.icon") && ht.icon) {
      ht.icon = sanitizeTextField(ht.icon);
    }
    if (this.isModified("heroTrending.badge") && ht.badge) {
      ht.badge = sanitizeTextField(ht.badge);
    }
    if (this.isModified("heroTrending.heading") && ht.heading) {
      ht.heading = sanitizeTextField(ht.heading);
    }
    if (this.isModified("heroTrending.description") && ht.description) {
      ht.description = sanitizeTextField(ht.description);
    }
    if (this.isModified("heroTrending.searchPlaceholder") && ht.searchPlaceholder) {
      ht.searchPlaceholder = sanitizeTextField(ht.searchPlaceholder);
    }
    if (this.isModified("heroTrending.buttonText") && ht.buttonText) {
      ht.buttonText = sanitizeTextField(ht.buttonText);
    }

    if (Array.isArray(ht.tools)) {
      ht.tools.forEach((tool) => {
        if (tool.name) tool.name = sanitizeTextField(tool.name);
        if (tool.category) tool.category = sanitizeTextField(tool.category);
        if (tool.description) tool.description = sanitizeTextField(tool.description);
      });
    }
  }

  if (tc) {
    if (this.isModified("trendingCard.label") && tc.label) {
      tc.label = sanitizeTextField(tc.label);
    }
    if (this.isModified("trendingCard.title") && tc.title) {
      tc.title = sanitizeTextField(tc.title);
    }
    if (this.isModified("trendingCard.icon") && tc.icon) {
      tc.icon = sanitizeTextField(tc.icon);
    }

    if (Array.isArray(tc.tools)) {
      tc.tools.forEach((tool) => {
        if (tool.name) tool.name = sanitizeTextField(tool.name);
        if (tool.category) tool.category = sanitizeTextField(tool.category);
        if (tool.description) tool.description = sanitizeTextField(tool.description);
      });
    }
  }

  const fc = this.featuredCategories;

  if (fc) {
    if (this.isModified("featuredCategories.categoryOrder") && Array.isArray(fc.categoryOrder)) {
      fc.categoryOrder = fc.categoryOrder.map((cat) =>
        typeof cat === "string" ? sanitizeTextField(cat) : cat
      );
    }
  }

  const sc = this.statsCounter;

  if (sc) {
    if (this.isModified("statsCounter.items") && Array.isArray(sc.items)) {
      sc.items = sc.items.map((item) => ({
        label: typeof item.label === "string" ? sanitizeTextField(item.label) : item.label,
        value: typeof item.value === "string" ? sanitizeTextField(item.value) : item.value,
      }));
    }
  }

  const tn = this.testimonials;

  if (tn) {
    if (this.isModified("testimonials.items") && Array.isArray(tn.items)) {
      tn.items = tn.items.map((item) => ({
        name: typeof item.name === "string" ? sanitizeTextField(item.name) : item.name,
        role: typeof item.role === "string" ? sanitizeTextField(item.role) : item.role,
        content: typeof item.content === "string" ? sanitizeTextField(item.content) : item.content,
        rating: typeof item.rating === "number" ? item.rating : item.rating,
      }));
    }
  }

  const fp = this.faqPreview;

  if (fp) {
    if (this.isModified("faqPreview.items") && Array.isArray(fp.items)) {
      fp.items = fp.items.map((item) => ({
        question: typeof item.question === "string" ? sanitizeTextField(item.question) : item.question,
        answer: typeof item.answer === "string" ? sanitizeTextField(item.answer) : item.answer,
      }));
    }
  }

  const cs = this.ctaSection;

  if (cs) {
    if (this.isModified("ctaSection.title") && cs.title) {
      cs.title = sanitizeTextField(cs.title);
    }
    if (this.isModified("ctaSection.description") && cs.description) {
      cs.description = sanitizeTextField(cs.description);
    }
    if (this.isModified("ctaSection.primaryButtonText") && cs.primaryButtonText) {
      cs.primaryButtonText = sanitizeTextField(cs.primaryButtonText);
    }
    if (this.isModified("ctaSection.primaryButtonLink") && cs.primaryButtonLink) {
      cs.primaryButtonLink = sanitizeTextField(cs.primaryButtonLink);
    }
    if (this.isModified("ctaSection.secondaryButtonText") && cs.secondaryButtonText) {
      cs.secondaryButtonText = sanitizeTextField(cs.secondaryButtonText);
    }
    if (this.isModified("ctaSection.secondaryButtonLink") && cs.secondaryButtonLink) {
      cs.secondaryButtonLink = sanitizeTextField(cs.secondaryButtonLink);
    }
  }

  next();
});

const HomeSettings = mongoose.model("HomeSettings", homeSettingsSchema);

export default HomeSettings;