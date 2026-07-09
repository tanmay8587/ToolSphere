import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        "x",
        "linkedin",
        "github",
        "instagram",
        "youtube",
        "discord",
        "telegram",
        "facebook",
      ],
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
socialLinkSchema.pre("save", function(next) {
  if (this.isModified("url") && this.url) {
    this.url = sanitizeTextField(this.url);
  }
  next();
});

const SocialLink = mongoose.model("SocialLink", socialLinkSchema);

export default SocialLink;