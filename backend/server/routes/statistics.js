import express from "express";
import { getStatistics, trackVisitor } from "../controllers/statisticsController.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */

/**
 * GET /api/statistics
 * - Get all statistics (tools, categories, visitors, subscribers)
 */
router.get("/", getStatistics);

/**
 * POST /api/statistics/track-visitor
 * - Track a visitor visit
 */
router.post("/track-visitor", trackVisitor);

export default router;