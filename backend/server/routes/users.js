import express from "express";
import { getSavedBlogs, getLikedBlogs, addViewedTool, getRecentlyViewedTools, addViewedBlog, getRecentlyViewedBlogs, getPublicUserProfile, followUser, unfollowUser } from "../controllers/userController.js";
import { getPersonalizedFeed } from "../controllers/feedController.js";
import { verifyUser, optionalUser } from "../middleware/auth.js";

/* ===========================
   USER ROUTES  (/api/users)
   All routes require an authenticated user unless specified.
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

/**
 * POST /api/users/me/viewed-blogs
 * - Adds a blog to the user's recently viewed blogs list
 */
router.post("/me/viewed-blogs", verifyUser, addViewedBlog);

/**
 * GET /api/users/me/recently-viewed-blogs
 * - Returns the current user's recently viewed blogs (populated)
 */
router.get("/me/recently-viewed-blogs", verifyUser, getRecentlyViewedBlogs);

/**
 * POST /api/users/:userId/follow
 * - Follow a user (requires auth)
 */
router.post("/:userId/follow", verifyUser, followUser);

/**
 * DELETE /api/users/:userId/follow
 * - Unfollow a user (requires auth)
 */
router.delete("/:userId/follow", verifyUser, unfollowUser);

/**
 * GET /api/users/me/personalized-feed
 * - Returns personalized feed for the authenticated user
 * - Sections: tools from followed users, latest reviews, new blogs, trending tools
 */
router.get("/me/personalized-feed", verifyUser, getPersonalizedFeed);

/**
 * GET /api/users/public/:userId
 * - Public endpoint (no auth required).
 * - Returns public profile data for a user.
 */
router.get("/public/:userId", optionalUser, getPublicUserProfile);

export default router;
