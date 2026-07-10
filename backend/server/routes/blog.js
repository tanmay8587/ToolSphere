import express from "express";

import {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  updateStatus,
  getBlogStats,
  likeBlog,
  unlikeBlog,
} from "../controllers/blogController.js";

import { verifyAdmin, verifyUser } from "../middleware/auth.js";

/* ===========================
   PUBLIC ROUTES  (/api/blogs)
   =========================== */
const blogRouter = express.Router();

/**
 * GET /api/blogs
 * - Public blog listing (pagination, search, filters, sort)
 */
blogRouter.get("/", getBlogs);

/**
 * GET /api/blogs/:slug
 * - Public single blog by slug (increments views, returns related)
 */
blogRouter.get("/:slug", getBlogBySlug);

/**
 * POST /api/blogs/:id/like
 * - Like a blog (logged-in users only)
 */
blogRouter.post("/:id/like", verifyUser, likeBlog);

/**
 * DELETE /api/blogs/:id/like
 * - Unlike a blog (logged-in users only)
 */
blogRouter.delete("/:id/like", verifyUser, unlikeBlog);

/* ===========================
   ADMIN ROUTES  (/api/admin/blogs)
   =========================== */
const adminBlogRouter = express.Router();

/**
 * GET /api/admin/blogs
 * - Admin blog listing (all statuses, paginated + filters)
 */
adminBlogRouter.get("/blogs", verifyAdmin, getBlogs);

/**
 * GET /api/admin/blogs/stats
 * - Admin blog dashboard statistics
 */
adminBlogRouter.get("/blogs/stats", verifyAdmin, getBlogStats);

/**
 * GET /api/admin/blogs/:id
 * - Admin single blog by id
 */
adminBlogRouter.get("/blogs/:id", verifyAdmin, getBlogById);

/**
 * POST /api/admin/blogs
 * - Create a new blog (admin only)
 */
adminBlogRouter.post("/blogs", verifyAdmin, createBlog);

/**
 * PUT /api/admin/blogs/:id
 * - Update an existing blog (admin only)
 */
adminBlogRouter.put("/blogs/:id", verifyAdmin, updateBlog);

/**
 * DELETE /api/admin/blogs/:id
 * - Soft delete a blog (admin only)
 */
adminBlogRouter.delete("/blogs/:id", verifyAdmin, deleteBlog);

/**
 * PATCH /api/admin/blogs/:id/status
 * - Update blog status: draft | published | scheduled (admin only)
 */
adminBlogRouter.patch("/blogs/:id/status", verifyAdmin, updateStatus);

/**
 * PATCH /api/admin/blogs/:id/featured
 * - Toggle featured flag (admin only)
 */
adminBlogRouter.patch("/blogs/:id/featured", verifyAdmin, toggleFeatured);

export default blogRouter;
export { adminBlogRouter };