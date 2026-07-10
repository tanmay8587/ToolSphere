import Blog from "../models/Blog.js";
import { createSlug } from "../utils/slug.js";
import { normalizeTags } from "../utils/validation.js";
import { notifyNewBlog } from "../utils/newsletterEmail.js";
import { sendErrorResponse, AppError } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

/* =====================================
   PUBLIC - GET BLOGS (paginated + filters)
   ===================================== */
export const getBlogs = async (req, res) => {
  try {
    const {
      search = "",
      category = "All",
      status = "published",
      featured = "All",
      sort = "newest",
      page = "1",
      limit = "10",
    } = req.query;

    const filters = { isDeleted: false };

    // Status filter (defaults to published for public listing)
    if (status && status !== "All") {
      filters.status = status;
    }

    // Category filter (case-insensitive exact match)
    if (category && category !== "All") {
      const escapedCategory = String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.category = { $regex: new RegExp(`^${escapedCategory}$`, "i") };
    }

    // Featured filter
    if (featured === "true") {
      filters.featured = true;
    } else if (featured === "false") {
      filters.featured = false;
    }

    // Search by title
    if (typeof search === "string" && search.trim()) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.title = { $regex: escapedSearch, $options: "i" };
    }

    const sortMap = {
      newest: { publishedAt: -1, createdAt: -1 },
      oldest: { publishedAt: 1, createdAt: 1 },
    };

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [total, blogs] = await Promise.all([
      Blog.countDocuments(filters),
      Blog.find(filters)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(limitNumber),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.json({
      success: true,
      blogs,
      total,
      currentPage: pageNumber,
      totalPages,
    });
  } catch (err) {
    logger.error("[getBlogs] Error fetching blogs:", err);
    return sendErrorResponse(res, 500, "Failed to fetch blogs");
  }
};

/* =====================================
   PUBLIC - GET BLOG BY ID
   ===================================== */
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    return res.json({
      success: true,
      blog,
    });
  } catch (err) {
    logger.error("[getBlogById] Error fetching blog:", err);
    return sendErrorResponse(res, 500, "Failed to fetch blog");
  }
};

/* =====================================
   PUBLIC - GET BLOG BY SLUG (+ related)
   ===================================== */
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Increment views automatically
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    // Related blogs (same category, excluding current)
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      category: blog.category,
      isDeleted: false,
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      blog,
      relatedBlogs,
    });
  } catch (err) {
    logger.error("[getBlogBySlug] Error fetching blog:", err);
    return sendErrorResponse(res, 500, "Failed to fetch blog");
  }
};

/* =====================================
   ADMIN - CREATE BLOG
   ===================================== */
export const createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields
    if (!title || !String(title).trim()) {
      throw new AppError("Blog title is required", 400);
    }
    if (!content || !String(content).trim()) {
      throw new AppError("Blog content is required", 400);
    }

    const payload = {
      title: String(title).trim(),
      content: String(content).trim(),
    };

    if (req.body.excerpt?.trim()) {
      payload.excerpt = String(req.body.excerpt).trim();
    }
    if (req.body.coverImage?.trim()) {
      payload.coverImage = String(req.body.coverImage).trim();
    }
    if (req.body.category?.trim()) {
      payload.category = String(req.body.category).trim();
    }
    if (req.body.author?.trim()) {
      payload.author = String(req.body.author).trim();
    }
    if (req.body.tags) {
      payload.tags = normalizeTags(req.body.tags);
    }
    if (Array.isArray(req.body.galleryImages)) {
      payload.galleryImages = req.body.galleryImages.map((img) => String(img).trim()).filter(Boolean);
    }
    if (req.body.status) {
      payload.status = req.body.status;
    }
    if (typeof req.body.featured === "boolean") {
      payload.featured = req.body.featured;
    }
    if (req.body.seoTitle?.trim()) {
      payload.seoTitle = String(req.body.seoTitle).trim();
    }
    if (req.body.seoDescription?.trim()) {
      payload.seoDescription = String(req.body.seoDescription).trim();
    }
    if (req.body.seoKeywords) {
      payload.seoKeywords = normalizeTags(req.body.seoKeywords);
    }
    if (req.body.ogImage?.trim()) {
      payload.ogImage = String(req.body.ogImage).trim();
    }
    if (req.body.canonicalUrl?.trim()) {
      payload.canonicalUrl = String(req.body.canonicalUrl).trim();
    }

    // Generate slug if missing
    const baseSlug = req.body.slug?.trim()
      ? createSlug(req.body.slug)
      : createSlug(payload.title);

    if (!baseSlug) {
      throw new AppError("Unable to generate slug from title", 400);
    }

    // Prevent duplicate slug
    let slugCandidate = baseSlug;
    let count = 1;
    while (await Blog.findOne({ slug: slugCandidate, isDeleted: false })) {
      slugCandidate = `${baseSlug}-${count}`;
      count++;
    }
    payload.slug = slugCandidate;

      // Use a provided publish date if valid, otherwise default for published posts
      if (req.body.publishedAt) {
        const parsedDate = new Date(req.body.publishedAt);
        if (!isNaN(parsedDate.getTime())) {
          payload.publishedAt = parsedDate;
        }
      }
      if (payload.status === "published" && !payload.publishedAt) {
        payload.publishedAt = new Date();
      }

    const blog = await Blog.create(payload);

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewBlog(blog);
      } catch (err) {
        logger.error("[createBlog] Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      message: "Blog created successfully",
      blog,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      response.message =
        newsletterResult.count > 0
          ? `Blog published successfully. Newsletter sent to ${newsletterResult.count} subscribers.`
          : "Blog published successfully. No active newsletter subscribers to notify.";
    }

    return res.status(201).json(response);
  } catch (err) {
    if (err instanceof AppError) {
      return sendErrorResponse(res, err.statusCode, err.message);
    }
    logger.error("[createBlog] Error creating blog:", err);
    return sendErrorResponse(res, 500, "Failed to create blog");
  }
};

/* =====================================
   ADMIN - UPDATE BLOG
   ===================================== */
export const updateBlog = async (req, res) => {
  try {
    const existing = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!existing) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

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
    if (req.body.coverImage?.trim()) {
      payload.coverImage = String(req.body.coverImage).trim();
    }
    if (req.body.category?.trim()) {
      payload.category = String(req.body.category).trim();
    }
    if (req.body.author?.trim()) {
      payload.author = String(req.body.author).trim();
    }
    if (req.body.tags) {
      payload.tags = normalizeTags(req.body.tags);
    }
    if (Array.isArray(req.body.galleryImages)) {
      payload.galleryImages = req.body.galleryImages.map((img) => String(img).trim()).filter(Boolean);
    }
    if (req.body.status) {
      payload.status = req.body.status;
    }
    if (typeof req.body.featured === "boolean") {
      payload.featured = req.body.featured;
    }
    if (req.body.seoTitle?.trim()) {
      payload.seoTitle = String(req.body.seoTitle).trim();
    }
    if (req.body.seoDescription?.trim()) {
      payload.seoDescription = String(req.body.seoDescription).trim();
    }
    if (req.body.seoKeywords) {
      payload.seoKeywords = normalizeTags(req.body.seoKeywords);
    }
    if (req.body.ogImage?.trim()) {
      payload.ogImage = String(req.body.ogImage).trim();
    }
    if (req.body.canonicalUrl?.trim()) {
      payload.canonicalUrl = String(req.body.canonicalUrl).trim();
    }

    // Update slug if title changes (and no explicit slug provided)
    if (payload.title && !req.body.slug?.trim()) {
      const baseSlug = createSlug(payload.title);
      let slugCandidate = baseSlug;
      let count = 1;
      while (
        await Blog.findOne({
          slug: slugCandidate,
          _id: { $ne: existing._id },
          isDeleted: false,
        })
      ) {
        slugCandidate = `${baseSlug}-${count}`;
        count++;
      }
      payload.slug = slugCandidate;
    } else if (req.body.slug?.trim()) {
      const baseSlug = createSlug(req.body.slug);
      let slugCandidate = baseSlug;
      let count = 1;
      while (
        await Blog.findOne({
          slug: slugCandidate,
          _id: { $ne: existing._id },
          isDeleted: false,
        })
      ) {
        slugCandidate = `${baseSlug}-${count}`;
        count++;
      }
      payload.slug = slugCandidate;
    }

      // Use a provided publish date if valid
      if (req.body.publishedAt) {
        const parsedDate = new Date(req.body.publishedAt);
        if (!isNaN(parsedDate.getTime())) {
          payload.publishedAt = parsedDate;
        }
      }

      // Set publishedAt when transitioning to published (only if not already set)
      if (payload.status === "published" && !existing.publishedAt && !payload.publishedAt) {
        payload.publishedAt = new Date();
      }

    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewBlog(blog);
      } catch (err) {
        logger.error("[updateBlog] Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      message: "Blog updated successfully",
      blog,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      response.message =
        newsletterResult.count > 0
          ? `Blog updated successfully. Newsletter sent to ${newsletterResult.count} subscribers.`
          : "Blog updated successfully. No active newsletter subscribers to notify.";
    }

    return res.json(response);
  } catch (err) {
    logger.error("[updateBlog] Error updating blog:", err);
    return sendErrorResponse(res, 500, "Failed to update blog");
  }
};

/* =====================================
   ADMIN - DELETE BLOG (soft delete)
   ===================================== */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    return res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    logger.error("[deleteBlog] Error deleting blog:", err);
    return sendErrorResponse(res, 500, "Failed to delete blog");
  }
};

/* =====================================
   ADMIN - TOGGLE FEATURED
   ===================================== */
export const toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    blog.featured = !blog.featured;
    blog.featuredAt = blog.featured ? new Date() : null;
    await blog.save();

    return res.json({
      success: true,
      featured: blog.featured,
      blog,
    });
  } catch (err) {
    logger.error("[toggleFeatured] Error toggling feature:", err);
    return sendErrorResponse(res, 500, "Failed to toggle featured status");
  }
};

/* =====================================
   ADMIN - UPDATE STATUS
   ===================================== */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["draft", "published", "scheduled"];
    if (!status || !allowedStatuses.includes(status)) {
      throw new AppError("Status must be one of: draft, published, scheduled", 400);
    }

    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

      blog.status = status;

      // Use a provided publish date if valid
      if (req.body.publishedAt) {
        const parsedDate = new Date(req.body.publishedAt);
        if (!isNaN(parsedDate.getTime())) {
          blog.publishedAt = parsedDate;
        }
      }

      // Set publishedAt when transitioning to published (only if not already set)
      if (status === "published" && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }

    await blog.save();

    return res.json({
      success: true,
      message: `Blog status updated to ${status}`,
      blog,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendErrorResponse(res, err.statusCode, err.message);
    }
    logger.error("[updateStatus] Error updating status:", err);
    return sendErrorResponse(res, 500, "Failed to update blog status");
  }
};

/* =====================================
   ADMIN - GET BLOG STATS
   ===================================== */
export const getBlogStats = async (req, res) => {
  try {
    const [total, published, draft, scheduled, featured, viewsResult] = await Promise.all([
      Blog.countDocuments({ isDeleted: false }),
      Blog.countDocuments({ isDeleted: false, status: "published" }),
      Blog.countDocuments({ isDeleted: false, status: "draft" }),
      Blog.countDocuments({ isDeleted: false, status: "scheduled" }),
      Blog.countDocuments({ isDeleted: false, featured: true }),
      Blog.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]),
    ]);

    const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

    return res.json({
      success: true,
      stats: {
        totalBlogs: total,
        published,
        draft,
        scheduled,
        featured,
        totalViews,
      },
    });
  } catch (err) {
    logger.error("[getBlogStats] Error fetching blog stats:", err);
    return sendErrorResponse(res, 500, "Failed to fetch blog statistics");
  }
};