import express from "express";

import {
  getTools,
  getCategories,
  getFeaturedTools,
  getToolBySlug,
  getRelatedTools,
  getRecommendedTools,
  getRecommendations,
  searchTools,
  reportTool,
  getToolTimeline,
  addToolTimeline,
  updateToolTimeline,
  deleteToolTimeline,
} from "../controllers/toolController.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
=========================== */

/**
 * GET /api/tools
 * - Search + filter + pagination
 */
router.get("/", getTools);

/**
 * GET /api/tools/search
 * - Advanced search (optional separate endpoint)
 */
router.get("/search", searchTools);

/**
 * GET /api/tools/featured
 * - Featured tools only
 */
router.get("/featured", getFeaturedTools);

/**
 * GET /api/tools/categories
 * - All categories list
 */
router.get("/categories", getCategories);

/**
 * GET /api/tools/:slug/related
 * - Related tools
 */
router.get("/:slug/related", getRelatedTools);

/**
 * GET /api/tools/:id/recommendations
 * - Recommended tools (same category)
 */
router.get("/:id/recommendations", getRecommendedTools);

/**
 * GET /api/tools/:slug
 * - Single tool detail page
 */
router.get("/:slug", getToolBySlug);

/**
 * POST /api/tools/report
 * - Report a tool
 */
router.post("/report", reportTool);

/**
 * GET /api/tools/:slug/timeline
 * - Get timeline for a tool
 */
router.get("/:slug/timeline", getToolTimeline);

/**
 * POST /api/tools/:slug/timeline
 * - Add timeline entry (admin)
 */
router.post("/:slug/timeline", addToolTimeline);

/**
 * PUT /api/tools/timeline/:id
 * - Update timeline entry (admin)
 */
router.put("/timeline/:id", updateToolTimeline);

/**
 * DELETE /api/tools/timeline/:id
 * - Delete timeline entry (admin)
 */
router.delete("/timeline/:id", deleteToolTimeline);

export default router;
