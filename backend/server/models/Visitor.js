import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
      index: true,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
    // Store month and year for efficient monthly queries
    visitMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    visitYear: {
      type: Number,
      required: true,
      index: true,
    },
    // Track if this is a unique visitor for the month
    isUnique: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient monthly unique visitor queries
visitorSchema.index({ ipAddress: 1, visitMonth: 1, visitYear: 1, isUnique: 1 });

// Unique compound index to prevent duplicate visitor records
// Combines IP, sessionId, and time period for accurate unique visitor tracking
visitorSchema.index(
  { ipAddress: 1, sessionId: 1, visitMonth: 1, visitYear: 1 },
  { unique: true }
);

// TTL index to automatically delete old visitor records after 1 year
visitorSchema.index({ visitedAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model("Visitor", visitorSchema);