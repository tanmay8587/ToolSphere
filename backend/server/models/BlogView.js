import mongoose from "mongoose";

const blogViewSchema = new mongoose.Schema(
  {
    // The blog that was viewed
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },

    // Logged-in user who viewed the blog (null for guests)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Persistent anonymous identifier for guests (sent via X-Visitor-ID header).
    // Null for logged-in users.
    visitorId: {
      type: String,
      default: null,
      index: true,
    },

    // Internal 24h window bucket (Math.floor(Date.now() / 24h)). Allows a viewer
    // to be counted again after 24 hours while keeping each insert idempotent and
    // race-safe under concurrent requests.
    window: {
      type: Number,
      required: true,
      index: true,
    },

    // Timestamp of the recorded view
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
   =========================== */

// Unique per (blog, viewer, 24h window). This is the core enforcement:
// MongoDB serializes the upsert on this key, so even concurrent requests from
// the same viewer can only ever create ONE BlogView per 24 hours.
blogViewSchema.index(
  { blogId: 1, userId: 1, visitorId: 1, window: 1 },
  { unique: true }
);

// Fast lookups when computing trending / per-blog view stats
blogViewSchema.index({ blogId: 1, viewedAt: -1 });

export default mongoose.model("BlogView", blogViewSchema);