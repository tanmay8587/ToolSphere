import express from "express";
import {
  getTopReviewers,
  getMostActiveUsers,
  getMostLikedReviews,
  getMonthlyLeaderboard,
} from "../controllers/leaderboardController.js";

/* ===========================
   LEADERBOARD ROUTES  (/api/leaderboard)
   Public endpoints (no auth required).
   =========================== */
const router = express.Router();

/**
 * GET /api/leaderboard/top-reviewers
 * - Top reviewers ranked by number of approved reviews.
 */
router.get("/top-reviewers", getTopReviewers);

/**
 * GET /api/leaderboard/most-active
 * - Most active users ranked by a composite activity score.
 */
router.get("/most-active", getMostActiveUsers);

/**
 * GET /api/leaderboard/most-liked-reviews
 * - Reviews ranked by number of likes received.
 */
router.get("/most-liked-reviews", getMostLikedReviews);

/**
 * GET /api/leaderboard/monthly
 * - Monthly leaderboard (top reviewers for a given month).
 * - Optional ?month=YYYY-MM query.
 */
router.get("/monthly", getMonthlyLeaderboard);

export default router;