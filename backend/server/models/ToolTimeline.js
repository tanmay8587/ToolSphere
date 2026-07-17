import mongoose from "mongoose";

const toolTimelineSchema = new mongoose.Schema(
  {
    tool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    changes: [
      {
        type: {
          type: String,
          enum: ["feature", "bugfix", "improvement", "breaking", "security", "other"],
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Change description cannot exceed 500 characters"],
        },
      },
    ],
    releasedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isMajor: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
toolTimelineSchema.index({ tool: 1, releasedAt: -1 });

export default mongoose.model("ToolTimeline", toolTimelineSchema);