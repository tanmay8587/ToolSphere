import express from "express";
import {
  getBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogByIdAdmin,
  addBlog,
  updateBlog,
  deleteBlog,
  toggleFeaturedBlog,
} from "../controllers/blogController.js";

const router = express.Router();

/* =====================================
   PUBLIC ROUTES
===================================== */

// Get all published blogs
router.get("/", getBlogs);

// Get blog by slug
router.get("/:slug", getBlogBySlug);

/* =====================================
   ADMIN ROUTES
===================================== */

// Get all blogs (admin)
router.get("/admin/all", getAllBlogsAdmin);

// Get blog by ID (admin)
router.get("/admin/:id", getBlogByIdAdmin);

// Add blog (admin)
router.post("/admin/add", addBlog);

// Update blog (admin)
router.put("/admin/:id", updateBlog);

// Delete blog (admin)
router.delete("/admin/:id", deleteBlog);

// Toggle featured (admin)
router.patch("/admin/:id/feature", toggleFeaturedBlog);

export default router;