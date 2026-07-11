import mongoose from "mongoose";

const blogViewSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      index: true,
    },

    // Client IP address (supports proxies via x-forwarded-for)
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },

    // Session identifier stored in a cookie (bv_sid)
    sessionId: {
      type: String,
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
   COMPOUND INDEX: prevent duplicate lookups
   =========================== */
// Used to quickly check if a (blog, ip, session) combination already viewed
// within the 30-minute window.
blogViewSchema.index({ blog: 1, ipAddress: 1, sessionId: 1, viewedAt: -1 });

export default mongoose.model("BlogView", blogViewSchema);