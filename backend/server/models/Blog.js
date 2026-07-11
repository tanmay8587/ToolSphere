import mongoose from "mongoose";
import slugify from "slugify";
import { sanitizeTextField } from "../utils/validation.js";
import { sanitizeBlogContent } from "../utils/codeBlockPreserver.js";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
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

    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    coverImage: {
      type: String,
      trim: true,
      default: "",
    },

    galleryImages: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      trim: true,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    author: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    featuredAt: {
      type: Date,
      default: null,
    },

    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, "SEO title cannot exceed 70 characters"],
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
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
      trim: true,
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

    readingTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Users who liked this blog (prevents duplicate likes)
    likedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },

    // Users who bookmarked/saved this blog
    bookmarkedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   TEXT SEARCH INDEX
=========================== */
blogSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
  seoKeywords: "text",
});

/* ===========================
   COMPOUND INDEXES FOR COMMON QUERIES
=========================== */
// For public listing: filter by isDeleted and status, sorted by publishedAt
blogSchema.index({ isDeleted: 1, status: 1, publishedAt: -1 });

// For featured listing
blogSchema.index({ featured: 1, status: 1, isDeleted: 1 });

// For admin search by category
blogSchema.index({ category: 1, isDeleted: 1, publishedAt: -1 });

/* ===========================
   HELPERS
=========================== */
// Average adult reading speed ~200 words per minute
const WORDS_PER_MINUTE = 200;

const calculateReadingTime = (content = "") => {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

/* ===========================
   PRE-VALIDATE HOOK: AUTO-GENERATE SLUG
=========================== */
blogSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

/* ===========================
   PRE-SAVE HOOK: SANITIZE + DERIVED FIELDS
=========================== */
blogSchema.pre("save", function (next) {
  // Sanitize text fields for XSS prevention
  if (this.isModified("title") && this.title) {
    this.title = sanitizeTextField(this.title);
  }
  if (this.isModified("excerpt") && this.excerpt) {
    this.excerpt = sanitizeTextField(this.excerpt);
  }
  if (this.isModified("content") && this.content) {
    // Sanitize content while preserving code blocks
    this.content = sanitizeBlogContent(this.content);
    // Auto-calculate reading time from content length
    this.readingTime = calculateReadingTime(this.content);
  }
  if (this.isModified("category") && this.category) {
    this.category = sanitizeTextField(this.category);
  }
  if (this.isModified("author") && this.author) {
    this.author = sanitizeTextField(this.author);
  }
  if (this.isModified("tags") && this.tags) {
    this.tags = this.tags.map((tag) => sanitizeTextField(tag));
  }
  if (this.isModified("galleryImages") && this.galleryImages) {
    this.galleryImages = this.galleryImages.map((img) => sanitizeTextField(img));
  }
  if (this.isModified("seoTitle") && this.seoTitle) {
    this.seoTitle = sanitizeTextField(this.seoTitle);
  }
  if (this.isModified("seoDescription") && this.seoDescription) {
    this.seoDescription = sanitizeTextField(this.seoDescription);
  }
  if (this.isModified("seoKeywords") && this.seoKeywords) {
    this.seoKeywords = this.seoKeywords.map((k) => sanitizeTextField(k));
  }

  // Set publishedAt when a blog transitions to published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

/* ===========================
   HELPER: SANITIZE UPDATE OPERATIONS
=========================== */
const sanitizeBlogUpdate = (update) => {
  if (!update || typeof update !== "object") return;

  const sanitizeArray = (arr) =>
    Array.isArray(arr) ? arr.map((item) => sanitizeTextField(item)) : arr;

  if (update.title) update.title = sanitizeTextField(update.title);
  if (update.excerpt) update.excerpt = sanitizeTextField(update.excerpt);
  if (update.content) {
    // Sanitize content while preserving code blocks
    update.content = sanitizeBlogContent(update.content);
    update.readingTime = calculateReadingTime(update.content);
  }
  if (update.category) update.category = sanitizeTextField(update.category);
  if (update.author) update.author = sanitizeTextField(update.author);
  if (update.tags) update.tags = sanitizeArray(update.tags);
  if (update.galleryImages) update.galleryImages = sanitizeArray(update.galleryImages);
  if (update.seoTitle) update.seoTitle = sanitizeTextField(update.seoTitle);
  if (update.seoDescription) update.seoDescription = sanitizeTextField(update.seoDescription);
  if (update.seoKeywords) update.seoKeywords = sanitizeArray(update.seoKeywords);

  // Set publishedAt when status changes to published
  if (update.status === "published" && !update.publishedAt) {
    update.publishedAt = new Date();
  }
};

/* ===========================
   PRE-UPDATE HOOKS: SANITIZE TEXT FIELDS
=========================== */
blogSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate();
  if (update) {
    sanitizeBlogUpdate(update);
  }
  next();
});

export default mongoose.model("Blog", blogSchema);