
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
  getToolAlternatives,
  getToolTimeline,
  addToolTimeline,
  updateToolTimeline,
  deleteToolTimeline,
  getToolRecommendationScore,
  submitTool,
} from "../controllers/toolController.js";

import { verifyUser } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

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
 * GET /api/tools/:id/alternatives
 * - Tool alternatives based on category, tags, and pricing
 */
router.get("/:id/alternatives", getToolAlternatives);

/**
 * GET /api/tools/:slug
 * - Single tool detail page
 */
router.get("/:slug", getToolBySlug);

/**
 * GET /api/tools/:id/recommendation-score
 * - Get AI recommendation score for a tool
 */
router.get("/:id/recommendation-score", getToolRecommendationScore);


/**
 * POST /api/tools/report
 * - Report a tool
 */
router.post("/report", reportTool);

/**
 * POST /api/tools/submit
 * - User-submitted tool (pending admin approval)
 * - Requires user auth + optional logo upload
 */
router.post("/submit", verifyUser, upload.single("logo"), submitTool);

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
