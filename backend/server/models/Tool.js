import mongoose from "mongoose";
import slugify from "slugify";
import { sanitizeTextField } from "../utils/validation.js";

const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tool name is required"],
      trim: true,
      maxlength: [100, "Tool name cannot exceed 100 characters"],
      index: true,
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [30, "Description must be at least 30 characters"],
      maxlength: [5000, "Description is too long"],
    },

    pricing: {
      type: String,
      enum: ["Free", "Freemium", "Paid", "Custom"],
      default: "Freemium",
      index: true
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true
    },

    website: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          try {
            const url = new URL(v);
            return ["http:", "https:"].includes(url.protocol);
          } catch {
            return false;
          }
        },
        message: "Invalid website URL",
      },
    },

    logo: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    gallery: {
      type: [String],
      default: [],
    },

    features: {
      type: [String],
      default: [],
    },

    pros: {
      type: [String],
      default: [],
    },

    cons: {
      type: [String],
      default: [],
    },

    screenshots: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
      index: true
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    approved: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "active",
      index: true,
    },

    clicks: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    visitCount: {
      type: Number,
      default: 0,
    },

    bookmarkCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: String,
      default: "admin",
    },

    updatedBy: {
      type: String,
      default: "admin",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    featuredAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedReason: {
      type: String,
      default: "",
    },

    seoTitle: {
      type: String,
      trim: true,
      maxlength: 70,
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    seoKeywords: {
      type: [String],
      default: [],
      index: true,
    },

    ogImage: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          try {
            const url = new URL(v);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        },
        message: "Invalid OG Image URL",
      },
    },

    canonicalUrl: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;

          try {
            const url = new URL(v);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        },
        message: "Invalid canonical URL",
      },
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   TEXT SEARCH INDEX
=========================== */
toolSchema.index({
  name: "text",
  description: "text",
  category: "text",
  tags: "text",
  seoKeywords: "text",
});

/* ===========================
   COMPOUND INDEXES FOR COMMON QUERIES
=========================== */
// For getTools: filter by approved, isDeleted, status, and category
toolSchema.index({ approved: 1, isDeleted: 1, status: 1, category: 1 });

// For getFeaturedTools: filter by featured, approved, isDeleted, status
toolSchema.index({ featured: 1, approved: 1, isDeleted: 1, status: 1 });

// For getRelatedTools: filter by category, approved, status, isDeleted
toolSchema.index({ category: 1, approved: 1, status: 1, isDeleted: 1 });

// For sorting by rating and views
toolSchema.index({ rating: -1, views: -1, createdAt: -1 });

// Pre-validate hook to generate slug
toolSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

// Pre-save hook to sanitize text fields for XSS prevention
toolSchema.pre("save", function(next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  if (this.isModified("description") && this.description) {
    this.description = sanitizeTextField(this.description);
  }
  if (this.isModified("category") && this.category) {
    this.category = sanitizeTextField(this.category);
  }
  if (this.isModified("tags") && this.tags) {
    this.tags = this.tags.map(tag => sanitizeTextField(tag));
  }
  if (this.isModified("features") && this.features) {
    this.features = this.features.map(f => sanitizeTextField(f));
  }
  if (this.isModified("pros") && this.pros) {
    this.pros = this.pros.map(p => sanitizeTextField(p));
  }
  if (this.isModified("cons") && this.cons) {
    this.cons = this.cons.map(c => sanitizeTextField(c));
  }
  if (this.isModified("seoTitle") && this.seoTitle) {
    this.seoTitle = sanitizeTextField(this.seoTitle);
  }
  if (this.isModified("seoDescription") && this.seoDescription) {
    this.seoDescription = sanitizeTextField(this.seoDescription);
  }
  if (this.isModified("seoKeywords") && this.seoKeywords) {
    this.seoKeywords = this.seoKeywords.map(k => sanitizeTextField(k));
  }
  if (this.isModified("rejectedReason") && this.rejectedReason) {
    this.rejectedReason = sanitizeTextField(this.rejectedReason);
  }
  next();
});

// Helper function to sanitize update operations
const sanitizeUpdate = (update) => {
  if (!update || typeof update !== "object") return;
  
  const sanitizeArray = (arr) => Array.isArray(arr) ? arr.map(item => sanitizeTextField(item)) : arr;
  
  if (update.name) update.name = sanitizeTextField(update.name);
  if (update.description) update.description = sanitizeTextField(update.description);
  if (update.category) update.category = sanitizeTextField(update.category);
  if (update.tags) update.tags = sanitizeArray(update.tags);
  if (update.features) update.features = sanitizeArray(update.features);
  if (update.pros) update.pros = sanitizeArray(update.pros);
  if (update.cons) update.cons = sanitizeArray(update.cons);
  if (update.seoTitle) update.seoTitle = sanitizeTextField(update.seoTitle);
  if (update.seoDescription) update.seoDescription = sanitizeTextField(update.seoDescription);
  if (update.seoKeywords) update.seoKeywords = sanitizeArray(update.seoKeywords);
  if (update.rejectedReason) update.rejectedReason = sanitizeTextField(update.rejectedReason);
};

// Pre hooks for update operations to sanitize text fields for XSS prevention
toolSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function(next) {
  const update = this.getUpdate();
  if (update) {
    sanitizeUpdate(update);
  }
  next();
});

/* ===========================
   VIRTUAL FIELD: RECOMMENDATION SCORE
=========================== */

/**
 * Calculate AI Recommendation Score based on:
 * - Reviews (count and average rating)
 * - Bookmarks/Saves
 * - Views
 * 
 * Score formula (0-100):
 * - Reviews: up to 40 points (10 reviews * 4 points each, max 40)
 * - Bookmarks: up to 30 points (15 bookmarks * 2 points each, max 30)
 * - Views: up to 30 points (logarithmic scale, max 30)
 * - Rating bonus: up to 10 points (rating * 2)
 * 
 * Total: max 110 points, normalized to 100
 */
toolSchema.virtual("recommendationScore").get(function () {
  const reviews = this.reviewCount || 0;
  const bookmarks = this.bookmarkCount || 0;
  const views = this.views || 0;
  const rating = this.rating || 0;

  // Reviews score: 4 points per review, max 40
  const reviewScore = Math.min(reviews * 4, 40);

  // Bookmarks score: 2 points per bookmark, max 30
  const bookmarkScore = Math.min(bookmarks * 2, 30);

  // Views score: logarithmic scale, max 30
  // log10(views + 1) * 10 gives us a nice scale
  // 10 views = ~10 points, 100 views = ~20 points, 1000 views = ~30 points
  const viewScore = Math.min(Math.log10(views + 1) * 10, 30);

  // Rating bonus: 2 points per star, max 10
  const ratingBonus = Math.min(rating * 2, 10);

  // Total score (max 110, normalize to 100)
  const totalScore = reviewScore + bookmarkScore + viewScore + ratingBonus;
  const normalizedScore = Math.min(Math.round((totalScore / 110) * 100), 100);

  return normalizedScore;
});

// Ensure virtual fields are included in JSON output
toolSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    return ret;
  },
});

toolSchema.set("toObject", {
  virtuals: true,
  transform: function (doc, ret) {
    return ret;
  },
});

export default mongoose.model("Tool", toolSchema);