import Blog from "../models/Blog.js";
import BlogView from "../models/BlogView.js";
import { createSlug } from "../utils/slug.js";
import { normalizeTags } from "../utils/validation.js";
import { notifyNewBlog } from "../utils/newsletterEmail.js";
import { sendErrorResponse, AppError } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

/* ===========================
   VIEW TRACKING HELPERS
   =========================== */

// A viewer is counted at most once within this time window.
const VIEW_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Records a unique view for a blog using backend-enforced dedup.
 *
 * - Logged-in users are deduped by (blogId + userId) within the last 24h.
 * - Guests are deduped by (blogId + visitorId) within the last 24h, where
 *   visitorId is a persistent anonymous id sent in the X-Visitor-ID header.
 *
 * The flow:
 *   1. Query BlogView for an existing record for this viewer in the last 24h.
 *   2. If one exists -> do NOT increment Blog.views (return counted:false).
 *   3. Otherwise -> create a BlogView and atomically increment Blog.views.
 *
 * The unique compound index on BlogView (blogId, userId, visitorId) guarantees
 * that even concurrent / repeated requests can only ever create a single
 * BlogView per viewer, so the counter is never inflated by a race.
 *
 * @returns {{ counted: boolean, views: number }}
 */
const recordUniqueView = async (blog, userId, visitorId) => {
  // Build the dedup query for this viewer.
  const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
  const query = { blogId: blog._id, viewedAt: { $gte: since } };
  if (userId) {
    query.userId = userId;
    query.visitorId = null;
  } else {
    query.userId = null;
    query.visitorId = visitorId || "anonymous";
  }

  // 1) Check whether this viewer already viewed the blog in the last 24h.
  const existing = await BlogView.findOne(query);
  if (existing) {
    // Duplicate within the window -> do NOT increment.
    return { counted: false, views: blog.views || 0 };
  }

  // 2) Create the view record. The unique index makes this race-safe: if a
  //    concurrent request already inserted one, this throws 11000 and we treat
  //    it as a duplicate (no increment).
  try {
    await BlogView.create({
      blogId: blog._id,
      userId: query.userId,
      visitorId: query.visitorId,
      viewedAt: new Date(),
    });
  } catch (err) {
    if (err && err.code !== 11000) {
      logger.error("[recordUniqueView] Failed to record view:", err);
    }
    return { counted: false, views: blog.views || 0 };
  }

  // 3) Genuinely new view -> increment the blog's counter atomically.
  const updated = await Blog.findByIdAndUpdate(
    blog._id,
    { $inc: { views: 1 } },
    { new: true }
  );

  return { counted: true, views: updated ? updated.views : (blog.views || 0) + 1 };
};

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

    // Search by title, excerpt, content, and tags
    if (typeof search === "string" && search.trim()) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { excerpt: { $regex: escapedSearch, $options: "i" } },
        { content: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Tag filter
    if (typeof tag === "string" && tag.trim()) {
      filters.tags = { $regex: new RegExp(`^${tag.trim()}$`, "i") };
    }

    const sortMap = {
      newest: { publishedAt: -1, createdAt: -1 },
      oldest: { publishedAt: 1, createdAt: 1 },
      "most-viewed": { views: -1, publishedAt: -1 },
      "most-liked": { likes: -1, publishedAt: -1 },
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
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
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
   PUBLIC - GET BLOG BY SLUG
   ===================================== */
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // NOTE: Views are intentionally NOT incremented here. View counting is
    // handled exclusively by the dedicated POST /:slug/view endpoint, which
    // enforces backend-side unique view tracking (BlogView model). This prevents
    // refresh / back-forward / re-open from inflating the counter.

    return res.json({
      success: true,
      blog,
    });
  } catch (err) {
    logger.error("[getBlogBySlug] Error fetching blog:", err);
    return sendErrorResponse(res, 500, "Failed to fetch blog");
  }
};

/* =====================================
   PUBLIC - GET TRENDING BLOGS
   ===================================== */
export const getTrendingBlogs = async (req, res) => {
  try {
    const trendingBlogs = await Blog.find({
      isDeleted: false,
      status: "published",
    })
      .sort({ views: -1, publishedAt: -1 })
      .limit(6)
      .select(
        "title slug coverImage category excerpt readingTime views publishedAt"
      );

    return res.json({
      success: true,
      blogs: trendingBlogs,
    });
  } catch (err) {
    logger.error("[getTrendingBlogs] Error fetching trending blogs:", err);
    return sendErrorResponse(res, 500, "Failed to fetch trending blogs");
  }
};

/* =====================================
   PUBLIC - POST BLOG VIEW (unique, backend-enforced)
   ===================================== */
export const viewBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Identify the viewer.
    // 1) Logged-in user (req.user is populated by the optional auth middleware).
    const userId = req.user?.id || null;

    // 2) Guest: persistent anonymous id from the X-Visitor-ID header.
    //    The backend does NOT trust localStorage alone — it only uses this id
    //    as a dedup key. If missing, we still record a view but keyed as a
    //    generic anonymous so we never crash; the frontend always sends it.
    const visitorId = req.headers["x-visitor-id"] || null;

    const { counted, views } = await recordUniqueView(blog, userId, visitorId);

    return res.json({
      success: true,
      views,
      counted,
    });
  } catch (err) {
    logger.error("[viewBlog] Error recording blog view:", err);
    return sendErrorResponse(res, 500, "Failed to record blog view");
  }
};

/* =====================================
   PUBLIC - GET RELATED BLOGS
   ===================================== */
export const getRelatedBlogs = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const relatedBlogs = [];
    const seenIds = new Set([blog._id.toString()]);

    // Step 1: Get blogs from same category (max 4)
    const sameCategoryBlogs = await Blog.find({
      _id: { $ne: blog._id },
      category: blog.category,
      isDeleted: false,
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .limit(4);

    sameCategoryBlogs.forEach((b) => {
      relatedBlogs.push(b);
      seenIds.add(b._id.toString());
    });

    // Step 2: If fewer than 4, fill with blogs sharing similar tags
    if (relatedBlogs.length < 4 && blog.tags && blog.tags.length > 0) {
      const tagMatches = await Blog.find({
        _id: { $nin: Array.from(seenIds).map(id => id) },
        tags: { $in: blog.tags },
        isDeleted: false,
        status: "published",
      })
        .sort({ publishedAt: -1 })
        .limit(4 - relatedBlogs.length);

      tagMatches.forEach((b) => {
        relatedBlogs.push(b);
        seenIds.add(b._id.toString());
      });
    }

    // Step 3: If still fewer than 4, fill with latest published blogs
    if (relatedBlogs.length < 4) {
      const latestBlogs = await Blog.find({
        _id: { $nin: Array.from(seenIds).map(id => id) },
        isDeleted: false,
        status: "published",
      })
        .sort({ publishedAt: -1 })
        .limit(4 - relatedBlogs.length);

      latestBlogs.forEach((b) => {
        relatedBlogs.push(b);
        seenIds.add(b._id.toString());
      });
    }

    // Return only fields needed for cards
    const formattedBlogs = relatedBlogs.slice(0, 4).map(({ _id, title, slug, coverImage, excerpt, category, readingTime, publishedAt }) => ({
      _id,
      title,
      slug,
      coverImage,
      excerpt,
      category,
      readingTime,
      publishedAt,
    }));

    return res.json({
      success: true,
      relatedBlogs: formattedBlogs,
    });
  } catch (err) {
    logger.error("[getRelatedBlogs] Error fetching related blogs:", err);
    return sendErrorResponse(res, 500, "Failed to fetch related blogs");
  }
};

/* =====================================
   PUBLIC - GET PREVIOUS/NEXT BLOG
   ===================================== */
export const getAdjacentBlogs = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isDeleted: false, status: "published" });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Previous blog: published before current, closest date
    const previousBlog = await Blog.findOne({
      _id: { $ne: blog._id },
      publishedAt: { $lt: blog.publishedAt },
      isDeleted: false,
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .limit(1);

    // Next blog: published after current, closest date
    const nextBlog = await Blog.findOne({
      _id: { $ne: blog._id },
      publishedAt: { $gt: blog.publishedAt },
      isDeleted: false,
      status: "published",
    })
      .sort({ publishedAt: 1 })
      .limit(1);

    const formatBlog = (b) => {
      if (!b) return null;
      const { _id, title, slug, coverImage, excerpt, category, readingTime, publishedAt } = b;
      return { _id, title, slug, coverImage, excerpt, category, readingTime, publishedAt };
    };

    return res.json({
      success: true,
      previousBlog: formatBlog(previousBlog),
      nextBlog: formatBlog(nextBlog),
    });
  } catch (err) {
    logger.error("[getAdjacentBlogs] Error fetching adjacent blogs:", err);
    return sendErrorResponse(res, 500, "Failed to fetch adjacent blogs");
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
    USER - LIKE BLOG
    ===================================== */
export const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const userId = req.user.id;

    // Check if user already liked this blog
    if (blog.likedBy.includes(userId)) {
      return sendErrorResponse(res, 400, "You have already liked this blog");
    }

    // Add user to likedBy array and increment likes count
    blog.likedBy.push(userId);
    blog.likes = (blog.likes || 0) + 1;
    await blog.save();

    return res.json({
      success: true,
      message: "Blog liked successfully",
      likes: blog.likes,
      isLiked: true,
    });
  } catch (err) {
    logger.error("[likeBlog] Error liking blog:", err);
    return sendErrorResponse(res, 500, "Failed to like blog");
  }
};

/* =====================================
    USER - UNLIKE BLOG
    ===================================== */
export const unlikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const userId = req.user.id;

    // Check if user has liked this blog
    if (!blog.likedBy.includes(userId)) {
      return sendErrorResponse(res, 400, "You have not liked this blog");
    }

    // Remove user from likedBy array and decrement likes count
    blog.likedBy = blog.likedBy.filter(id => id.toString() !== userId.toString());
    blog.likes = Math.max(0, (blog.likes || 0) - 1);
    await blog.save();

    return res.json({
      success: true,
      message: "Blog unliked successfully",
      likes: blog.likes,
      isLiked: false,
    });
  } catch (err) {
    logger.error("[unlikeBlog] Error unliking blog:", err);
    return sendErrorResponse(res, 500, "Failed to unlike blog");
  }
};

/* =====================================
    USER - BOOKMARK BLOG
    ===================================== */
export const bookmarkBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const userId = req.user.id;

    // Check if user already bookmarked this blog (prevent duplicates)
    if (blog.bookmarkedBy.includes(userId)) {
      return sendErrorResponse(res, 400, "You have already bookmarked this blog");
    }

    // Add user to bookmarkedBy array
    blog.bookmarkedBy.push(userId);
    await blog.save();

    return res.json({
      success: true,
      message: "Blog bookmarked successfully",
      bookmarks: blog.bookmarkedBy.length,
      isBookmarked: true,
    });
  } catch (err) {
    logger.error("[bookmarkBlog] Error bookmarking blog:", err);
    return sendErrorResponse(res, 500, "Failed to bookmark blog");
  }
};

/* =====================================
    USER - REMOVE BOOKMARK
    ===================================== */
export const removeBookmark = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const userId = req.user.id;

    // Check if user has bookmarked this blog
    if (!blog.bookmarkedBy.includes(userId)) {
      return sendErrorResponse(res, 400, "You have not bookmarked this blog");
    }

    // Remove user from bookmarkedBy array
    blog.bookmarkedBy = blog.bookmarkedBy.filter(id => id.toString() !== userId.toString());
    await blog.save();

    return res.json({
      success: true,
      message: "Bookmark removed successfully",
      bookmarks: blog.bookmarkedBy.length,
      isBookmarked: false,
    });
  } catch (err) {
    logger.error("[removeBookmark] Error removing bookmark:", err);
    return sendErrorResponse(res, 500, "Failed to remove bookmark");
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