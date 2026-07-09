import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const reportSchema = new mongoose.Schema(
  {
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: [true, "Tool ID is required"],
      index: true,
    },
    toolName: {
      type: String,
      required: [true, "Tool name is required"],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: {
        values: ["Broken Link", "Incorrect Information", "Duplicate Tool", "Spam", "Other"],
        message: "Invalid report reason",
      },
      index: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
reportSchema.pre("save", function(next) {
  if (this.isModified("toolName") && this.toolName) {
    this.toolName = sanitizeTextField(this.toolName);
  }
  if (this.isModified("comment") && this.comment) {
    this.comment = sanitizeTextField(this.comment);
  }
  next();
});

// Compound index for efficient queries by tool and status
reportSchema.index({ toolId: 1, status: 1 });

// Compound index for admin queries filtering by status with sorting
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;