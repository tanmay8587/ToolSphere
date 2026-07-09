import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "admin",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
adminSchema.pre("save", function(next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  next();
});

export default mongoose.model("Admin", adminSchema);