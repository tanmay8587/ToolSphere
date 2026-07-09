import Blog from "../models/Blog.js";
import { notifyNewBlog } from "../utils/newsletterEmail.js";

/* =====================================
   PUBLIC - GET BLOGS
===================================== */

export const getBlogs = async (req, res) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [total, blogs] = await Promise.all([
      Blog.countDocuments({ isDeleted: false }),
      Blog.find({ isDeleted: false })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNumber),
    ]);

    res.json({
      success: true,
      blogs,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      isDeleted: false,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Increment views
    await Blog.updateOne({ slug: req.params.slug }, { $inc: { views: 1 } });

    res.json({
      success: true,
      blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
};

/* =====================================
   ADMIN - GET ALL BLOGS
===================================== */

export const getAllBlogsAdmin = async (req, res) => {
  try {
    const { search = "", page = "1", limit = "100" } = req.query;

    const filters = { isDeleted: false };

    if (typeof search === "string" && search) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { excerpt: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    const total = await Blog.countDocuments(filters);

    const blogs = await Blog.find(filters)
      .sort({ publishedAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.json({
      success: true,
      total,
      blogs,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Admin fetch failed",
    });
  }
};

export const getBlogByIdAdmin = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
};

/* =====================================
   ADMIN - ADD BLOG
===================================== */

export const addBlog = async (req, res) => {
  try {
    const payload = {};

    if (req.body.title?.trim()) {
      payload.title = String(req.body.title).trim();
    }

    if (req.body.excerpt?.trim()) {
      payload.excerpt = String(req.body.excerpt).trim();
    }

    if (req.body.content?.trim()) {
      payload.content = String(req.body.content).trim();
    }

    if (req.body.category?.trim()) {
      payload.category = String(req.body.category).trim();
    }

    if (req.body.author?.trim()) {
      payload.author = String(req.body.author).trim();
    }

    if (req.body.tags) {
      payload.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : String(req.body.tags).split(",").map(tag => tag.trim()).filter(Boolean);
    }

    if (req.body.coverImage?.trim()) {
      payload.coverImage = String(req.body.coverImage).trim();
    }

    if (req.body.status) {
      payload.status = req.body.status;
    }

    if (req.body.featured !== undefined) {
      payload.featured = req.body.featured === true || req.body.featured === "true";
    }

    // Generate slug from title
    if (req.body.slug?.trim()) {
      payload.slug = String(req.body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    } else if (payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    }

    // Set publishedAt if status is published
    if (payload.status === "published") {
      payload.publishedAt = new Date();
    }

    const blog = await Blog.create(payload);

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewBlog(blog);
      } catch (err) {
        // Log but don't fail the request
        console.error("Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      message: "Blog added successfully",
      blog,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      if (newsletterResult.count > 0) {
        response.message = `Blog published successfully. Newsletter sent to ${newsletterResult.count} subscribers.`;
      } else {
        response.message = "Blog published successfully. No active newsletter subscribers to notify.";
      }
    }

    return res.status(201).json(response);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to add blog",
    });
  }
};

/* =====================================
   ADMIN - UPDATE BLOG
===================================== */

export const updateBlog = async (req, res) => {
  try {
    const payload = {};

    if (req.body.title?.trim()) {
      payload.title = String(req.body.title).trim();
    }

    if (req.body.excerpt?.trim()) {
      payload.excerpt = String(req.body.excerpt).trim();
    }

    if (req.body.content?.trim()) {
      payload.content = String(req.body.content).trim();
    }

    if (req.body.category?.trim()) {
      payload.category = String(req.body.category).trim();
    }

    if (req.body.author?.trim()) {
      payload.author = String(req.body.author).trim();
    }

    if (req.body.tags) {
      payload.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : String(req.body.tags).split(",").map(tag => tag.trim()).filter(Boolean);
    }

    if (req.body.coverImage?.trim()) {
      payload.coverImage = String(req.body.coverImage).trim();
    }

    if (req.body.status) {
      payload.status = req.body.status;
      // Update publishedAt if status changed to published
      if (req.body.status === "published") {
        payload.publishedAt = new Date();
      }
    }

    if (req.body.featured !== undefined) {
      payload.featured = req.body.featured === true || req.body.featured === "true";
    }

    // Update slug if title changed
    if (req.body.slug?.trim()) {
      payload.slug = String(req.body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    } else if (req.body.title?.trim()) {
      payload.slug = req.body.title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewBlog(blog);
      } catch (err) {
        // Log but don't fail the request
        console.error("Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      blog,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      if (newsletterResult.count > 0) {
        response.message = `Blog updated successfully. Newsletter sent to ${newsletterResult.count} subscribers.`;
      } else {
        response.message = "Blog updated successfully. No active newsletter subscribers to notify.";
      }
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update blog",
    });
  }
};

/* =====================================
   ADMIN - DELETE BLOG
===================================== */

export const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await Blog.findByIdAndUpdate(blogId, { isDeleted: true });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

/* =====================================
   ADMIN - TOGGLE FEATURE
===================================== */

export const toggleFeaturedBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog || blog.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    blog.featured = !blog.featured;
    blog.featuredAt = blog.featured ? Date.now() : null;
    await blog.save();

    res.json({
      success: true,
      featured: blog.featured,
      blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Toggle failed",
    });
  }
};