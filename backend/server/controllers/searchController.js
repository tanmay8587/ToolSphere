import Tool from "../models/Tool.js";
import Blog from "../models/Blog.js";
import Category from "../models/Category.js";
import logger from "../utils/logger.js";

/* =====================================
   GLOBAL SEARCH
   ===================================== */

export const globalSearch = async (req, res) => {
  try {
    const { q = "", limit = "20" } = req.query;

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        results: {
          tools: [],
          blogs: [],
          categories: [],
        },
        total: 0,
      });
    }

    const searchQuery = q.trim().substring(0, 100);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit) || 20));

    // Escape special regex characters
    const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search tools
    const tools = await Tool.find({
      approved: true,
      isDeleted: false,
      status: "active",
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { tags: { $in: [new RegExp(escapedSearch, "i")] } },
      ],
    })
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .limit(limitNumber)
      .select("_id name slug category logo description tags rating")
      .lean();

    // Search published blogs
    const blogs = await Blog.find({
      isDeleted: false,
      status: "published",
      $or: [
        { title: { $regex: escapedSearch, $options: "i" } },
        { excerpt: { $regex: escapedSearch, $options: "i" } },
        { content: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: escapedSearch, $options: "i" } },
      ],
    })
      .sort({ publishedAt: -1 })
      .limit(limitNumber)
      .select("_id title slug coverImage excerpt category readingTime publishedAt")
      .lean();

    // Search categories
    const categories = await Category.find({
      isActive: true,
      name: { $regex: escapedSearch, $options: "i" },
    })
      .sort({ name: 1 })
      .limit(10)
      .select("_id name icon description")
      .lean();

    const total = tools.length + blogs.length + categories.length;

    res.json({
      success: true,
      results: {
        tools,
        blogs,
        categories,
      },
      total,
    });
  } catch (err) {
    logger.error("[globalSearch] Error:", err);
    res.status(500).json({
      success: false,
      message: "Search failed",
      results: {
        tools: [],
        blogs: [],
        categories: [],
      },
      total: 0,
    });
  }
};

export default { globalSearch };