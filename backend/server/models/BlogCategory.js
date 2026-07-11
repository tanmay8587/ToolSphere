import mongoose from "mongoose";
import slugify from "slugify";
import { sanitizeTextField } from "../utils/validation.js";

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
      unique: true,
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "#3B82F6", // Default blue color
      validate: {
        validator: function (v) {
          if (!v) return true;
          // Validate hex color format
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: "Invalid color format. Use hex format (e.g., #3B82F6)",
      },
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
    PRE-VALIDATE HOOK: AUTO-GENERATE SLUG
   =========================== */
blogCategorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

/* ===========================
    PRE-SAVE HOOK: SANITIZE FIELDS
   =========================== */
blogCategorySchema.pre("save", function (next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  if (this.isModified("description") && this.description) {
    this.description = sanitizeTextField(this.description);
  }
  if (this.isModified("color") && this.color) {
    this.color = sanitizeTextField(this.color);
  }
  next();
});

/* ===========================
    PRE-UPDATE HOOKS: SANITIZE TEXT FIELDS
   =========================== */
blogCategorySchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.name) update.name = sanitizeTextField(update.name);
    if (update.description) update.description = sanitizeTextField(update.description);
    if (update.color) update.color = sanitizeTextField(update.color);
  }
  next();
});

export default mongoose.model("BlogCategory", blogCategorySchema);