import mongoose from "mongoose";
import { sanitizeTextField, validateEmail } from "../utils/validation.js";

const blogCommentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: [true, "Blog reference is required"],
      index: true,
    },

    // Authenticated user who commented (null for guests)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Guest fields (only used when user is null)
    guestName: {
      type: String,
      trim: true,
      maxlength: [100, "Guest name cannot exceed 100 characters"],
      default: "",
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [200, "Guest email cannot exceed 200 characters"],
      default: "",
    },

    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    // Parent comment for one-level nested replies (null = top-level comment)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogComment",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
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
   PRE-SAVE HOOK: SANITIZE TEXT FIELDS (XSS prevention)
   =========================== */
blogCommentSchema.pre("save", function (next) {
  if (this.isModified("content") && this.content) {
    this.content = sanitizeTextField(this.content);
  }
  if (this.isModified("guestName") && this.guestName) {
    this.guestName = sanitizeTextField(this.guestName);
  }
  if (this.isModified("guestEmail") && this.guestEmail) {
    this.guestEmail = sanitizeTextField(this.guestEmail).toLowerCase();
  }
  next();
});

/* ===========================
   COMPOUND INDEXES
   =========================== */
// For public listing: top-level approved comments for a blog
blogCommentSchema.index({ blog: 1, parentComment: 1, status: 1, isDeleted: 1, createdAt: 1 });

// For admin moderation queries
blogCommentSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });

const BlogComment = mongoose.model("BlogComment", blogCommentSchema);

export default BlogComment;