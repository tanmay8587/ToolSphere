import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // ADD ICON FOR FRONTEND UI (important fix)
    icon: {
      type: String,
      default: "🤖",
    },

    // CLEAN DESCRIPTION FOR UI
    description: {
      type: String,
      default: "Discover AI tools for this category.",
      trim: true,
    },

    createdBy: {
      type: String,
      default: "admin",
    },

    // OPTIONAL BUT USEFUL FOR FILTERING
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
categorySchema.pre("save", function(next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  if (this.isModified("description") && this.description) {
    this.description = sanitizeTextField(this.description);
  }
  next();
});

export default mongoose.model("Category", categorySchema);