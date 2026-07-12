import express from "express";
import {
  getInteractionState,
  likeBlog,
  unlikeBlog,
  bookmarkBlog,
  removeBookmark,
} from "../controllers/blogInteractionController.js";
import { verifyUser, optionalUser } from "../middleware/auth.js";

/* ===========================
   BLOG INTERACTION ROUTES  (/api/blogs/:slug/...)
   All mutation routes require an authenticated user.
   =================================== */
const router = express.Router();

/**
 * GET /api/blogs/:slug/interaction
 * - Public-safe: returns like/bookmark counts + current user's state.
 *   Uses optionalUser so a logged-in user's token is honored (populates
 *   req.user) while guests fall back to anonymous — this keeps the Like/Save
 *   button state correct after refresh and across login/logout.
 */
router.get("/:slug/interaction", optionalUser, getInteractionState);

/**
 * POST /api/blogs/:slug/like
 * - Like a blog (idempotent, prevents duplicates)
 */
router.post("/:slug/like", verifyUser, likeBlog);

/**
 * DELETE /api/blogs/:slug/like
 * - Unlike a blog (idempotent)
 */
router.delete("/:slug/like", verifyUser, unlikeBlog);

/**
 * POST /api/blogs/:slug/bookmark
 * - Bookmark/save a blog (idempotent)
 */
router.post("/:slug/bookmark", verifyUser, bookmarkBlog);

/**
 * DELETE /api/blogs/:slug/bookmark
 * - Remove a bookmark (idempotent)
 */
router.delete("/:slug/bookmark", verifyUser, removeBookmark);

export default router;