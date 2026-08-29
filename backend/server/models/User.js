import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";
import { MEMBERSHIP_TIER } from "./Membership.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Blogs the user has saved/bookmarked (toggle save/unsave).
    savedBlogs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
      default: [],
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
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    googleId: {
      type: String,
      default: "",
      index: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    membershipTier: {
      type: String,
      enum: Object.values(MEMBERSHIP_TIER),
      default: MEMBERSHIP_TIER.FREE,
      required: true,
    },
    membershipStatus: {
      type: String,
      default: "active",
    },
    membershipSince: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      default: "",
    },
    emailVerificationExpire: {
      type: Date,
      default: null,
    },
    newsletterEnabled: {
      type: Boolean,
      default: true,
    },
    recentlyViewedTools: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tool" }],
      default: [],
    },

    // Blogs the user has recently viewed (most recent first, max 10).
    recentlyViewed: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
      default: [],
    },

    // Follow system
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
userSchema.pre("save", function(next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  next();
});

export default mongoose.model("User", userSchema);