import express from "express";

import {
  getTools,
  getCategories,
  getFeaturedTools,
  getToolBySlug,
  getRelatedTools,
  searchTools,
  reportTool,
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
 * GET /api/tools/:slug
 * - Single tool detail page
 */
router.get("/:slug", getToolBySlug);

/**
 * POST /api/tools/report
 * - Report a tool
 */
router.post("/report", reportTool);

export default router;
