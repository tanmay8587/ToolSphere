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

    if (Array.isArray(ht.tools)) {
      ht.tools.forEach((tool) => {
        if (tool.name) tool.name = sanitizeTextField(tool.name);
        if (tool.category) tool.category = sanitizeTextField(tool.category);
        if (tool.description) tool.description = sanitizeTextField(tool.description);
      });
    }
  }

  next();
});

const HomeSettings = mongoose.model("HomeSettings", homeSettingsSchema);

export default HomeSettings;