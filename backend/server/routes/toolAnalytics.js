import express from "express";

import {
  viewTool,
  clickTool,
  toggleToolLike,
  getAllToolsAnalytics,
  getToolAnalytics,
} from "../controllers/toolAnalyticsController.js";

import { verifyAdmin, verifyUser, optionalUser } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   ADMIN ROUTES (declared first so they are not shadowed by /:slug/*)
   =========================== */

/**
 * GET /api/tool-analytics/admin/analytics
 * - Admin: aggregate analytics across all tools (Views, Clicks, Saves, Likes)
 *   plus a 30-day traffic chart.
 */
router.get("/admin/analytics", verifyAdmin, getAllToolsAnalytics);

/**
 * GET /api/tool-analytics/admin/:slug/analytics
 * - Admin: analytics for a single tool (summary metrics + 30-day traffic chart).
 */
router.get("/admin/:slug/analytics", verifyAdmin, getToolAnalytics);

/* ===========================
   PUBLIC / USER ROUTES
   =========================== */

/**
 * POST /api/tool-analytics/:slug/view
 * - Public (optional auth): record a unique tool view. Logged-in users are
 *   deduped by userId within 24h; guests by X-Visitor-ID header.
 */
router.post("/:slug/view", optionalUser, viewTool);

/**
 * POST /api/tool-analytics/:slug/click
 * - Public: record a tool click (Visit Website) and increment the click counter.
 */
router.post("/:slug/click", clickTool);

/**
 * POST /api/tool-analytics/:slug/like
 * - Logged-in users only: toggle like/unlike for a tool (idempotent).
 */
router.post("/:slug/like", verifyUser, toggleToolLike);

export default router;
