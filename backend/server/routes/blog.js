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
  bookmarkBlog,
  removeBookmark,
  getRelatedBlogs,
  getAdjacentBlogs,
  viewBlog,
  getTrendingBlogs,
} from "../controllers/blogController.js";

import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/blogCategoryController.js";

import { verifyAdmin, verifyUser, optionalUser } from "../middleware/auth.js";

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
 * GET /api/blogs/trending
 * - Public: top 6 published blogs ordered by views
 *   (declared before /:slug so it is not captured as a slug)
 */
blogRouter.get("/trending", getTrendingBlogs);

/**
 * GET /api/blogs/categories
 * - Public: list all blog categories
 *   (declared BEFORE /:slug so it is not captured as a slug)
 */
blogRouter.get("/categories", getAllCategories);
blogRouter.get("/categories/:id", getCategoryById);

/**
 * GET /api/blogs/:slug
 * - Public single blog by slug (increments views)
 */
blogRouter.get("/:slug", getBlogBySlug);

/**
 * POST /api/blogs/:slug/view
 * - Public: record a unique blog view (backend-enforced dedup).
 *   Logged-in users are identified via the optional auth token; guests are
 *   identified by the X-Visitor-ID header.
 */
blogRouter.post("/:slug/view", optionalUser, viewBlog);

/**
 * GET /api/blogs/:slug/related
 * - Public related blogs for a given slug
 */
blogRouter.get("/:slug/related", getRelatedBlogs);

/**
 * GET /api/blogs/:slug/adjacent
 * - Public previous/next blogs by publish date
 */
blogRouter.get("/:slug/adjacent", getAdjacentBlogs);

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

/**
 * POST /api/blogs/:id/bookmark
 * - Bookmark a blog (logged-in users only)
 */
blogRouter.post("/:id/bookmark", verifyUser, bookmarkBlog);

/**
 * DELETE /api/blogs/:id/bookmark
 * - Remove bookmark (logged-in users only)
 */
blogRouter.delete("/:id/bookmark", verifyUser, removeBookmark);

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

/* ===========================
    ADMIN CATEGORY ROUTES
    =========================== */
adminBlogRouter.get("/categories", verifyAdmin, getAllCategories);
adminBlogRouter.get("/categories/:id", verifyAdmin, getCategoryById);
adminBlogRouter.post("/categories", verifyAdmin, createCategory);
adminBlogRouter.put("/categories/:id", verifyAdmin, updateCategory);
adminBlogRouter.delete("/categories/:id", verifyAdmin, deleteCategory);

export default blogRouter;
export { adminBlogRouter };
