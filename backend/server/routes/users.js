import express from "express";
import { getSavedBlogs, getLikedBlogs, addViewedTool, getRecentlyViewedTools } from "../controllers/userController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   USER ROUTES  (/api/users)
   All routes require an authenticated user.
   =========================== */
const router = express.Router();

/**
 * GET /api/users/me/saved-blogs
 * - Returns the current user's saved blogs (populated).
 */
router.get("/me/saved-blogs", verifyUser, getSavedBlogs);

/**
 * GET /api/users/me/liked-blogs
 * - Returns the current user's liked blogs (populated).
 */
router.get("/me/liked-blogs", verifyUser, getLikedBlogs);

/**
 * POST /api/users/me/viewed-tools
 * - Adds a tool to the user's recently viewed tools list
 */
router.post("/me/viewed-tools", verifyUser, addViewedTool);

/**
 * GET /api/users/me/recently-viewed-tools
 * - Returns the current user's recently viewed tools (populated)
 */
router.get("/me/recently-viewed-tools", verifyUser, getRecentlyViewedTools);

export default router;
