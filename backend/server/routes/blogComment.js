import express from "express";

import {
  getCommentsByBlog,
  addComment,
  getAdminComments,
  approveComment,
  rejectComment,
  deleteComment,
} from "../controllers/blogCommentController.js";

import { verifyAdmin, verifyUser } from "../middleware/auth.js";

/* ===========================
   PUBLIC ROUTES  (/api/blogs/:slug/comments)
   =========================== */
const publicRouter = express.Router();

/**
 * GET /api/blogs/:slug/comments
 * - Public list of approved comments (nested replies) for a blog
 */
publicRouter.get("/:slug/comments", getCommentsByBlog);

/**
 * POST /api/blogs/:slug/comments
 * - Submit a comment (guest or authenticated user)
 */
publicRouter.post("/:slug/comments", verifyUser, addComment);

/* ===========================
   ADMIN ROUTES  (/api/admin/blog-comments)
   =========================== */
const adminRouter = express.Router();

/**
 * GET /api/admin/blog-comments
 * - Admin list of all comments (filter by status/search)
 */
adminRouter.get("/blog-comments", verifyAdmin, getAdminComments);

/**
 * PATCH /api/admin/blog-comments/:id/approve
 * - Approve a comment (admin only)
 */
adminRouter.patch("/blog-comments/:id/approve", verifyAdmin, approveComment);

/**
 * PATCH /api/admin/blog-comments/:id/reject
 * - Reject a comment (admin only)
 */
adminRouter.patch("/blog-comments/:id/reject", verifyAdmin, rejectComment);

/**
 * DELETE /api/admin/blog-comments/:id
 * - Soft delete a comment (admin only)
 */
adminRouter.delete("/blog-comments/:id", verifyAdmin, deleteComment);

export default publicRouter;
export { adminRouter };