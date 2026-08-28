import mongoose from "mongoose";

/* ==========================================
   TOOL ANALYTICS EVENT LOG
========================================== */

/**
 * Records an interaction event on a tool so that analytics dashboards can
 * display Views, Clicks, Likes and Saves — both as aggregate counters and as
 * time-series data for traffic charts.
 *
 * Each row is a single interaction (a unique view, a click, a like, a save).
 * Daily aggregation of these rows powers the "Traffic charts" requirement,
 * while the Tool document counters (views / clicks / bookmarkCount / likes)
 * power the instant summary metric cards.
 */
const toolAnalyticsSchema = new mongoose.Schema(
  {
    // The tool this event belongs to.
    tool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
      index: true,
    },

    // What kind of interaction was recorded.
    action: {
      type: String,
      enum: ["view", "click", "like", "save"],
      required: true,
      index: true,
    },

    // Logged-in user that triggered the event (null for guests).
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Persistent anonymous id for guests (mirrors the blog view tracking
    // visitorId concept). Null for logged-in users.
    visitorId: {
      type: String,
      default: null,
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

// Fast time-series lookups for a single tool + action (traffic chart data).
toolAnalyticsSchema.index({ tool: 1, action: 1, createdAt: -1 });

// Fast aggregate traffic queries across all tools + action.
toolAnalyticsSchema.index({ action: 1, createdAt: -1 });

// Auto-delete analytics events after 1 year (mirrors the Visitor TTL policy).
toolAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model("ToolAnalytics", toolAnalyticsSchema);
