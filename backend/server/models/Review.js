import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
reviewSchema.pre("save", function(next) {
  if (this.isModified("comment") && this.comment) {
    this.comment = sanitizeTextField(this.comment);
  }
  next();
});

// Unique compound index to prevent duplicate reviews
reviewSchema.index({ tool: 1, user: 1 }, { unique: true });

// Index for fetching all reviews for a tool (sorted by newest)
reviewSchema.index({ tool: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);