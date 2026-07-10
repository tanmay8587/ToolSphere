import Blog from "../models/Blog.js";
import logger from "../utils/logger.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/* =====================================
   HELPERS
   ===================================== */

// Resolve a published, non-deleted blog by slug
const resolveBlogBySlug = async (slug) => {
  return Blog.findOne({ slug, isDeleted: false, status: "published" });
};

// Build the interaction payload returned to the client
const buildInteractionState = (blog, userId) => ({
  success: true,
  likes: blog.likes || 0,
  bookmarks: blog.bookmarkedBy?.length || 0,
  isLiked: !!(userId && blog.likedBy?.some((id) => id.toString() === userId)),
  isBookmarked: !!(userId && blog.bookmarkedBy?.some((id) => id.toString() === userId)),
});

/* =====================================
   GET INTERACTION STATE
   GET /api/blogs/:slug/interaction
   Returns like/bookmark counts + whether the current user
   has liked/bookmarked. Public-safe (works without auth).
   ===================================== */
export const getInteractionState = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const userId = req.user?.id || null;
    return res.json(buildInteractionState(blog, userId));
  } catch (err) {
    logger.error("[getInteractionState] Error:", err);
    return sendErrorResponse(res, 500, "Failed to fetch interaction state");
  }
};

/* =====================================
   LIKE
   POST /api/blogs/:slug/like
   Prevents duplicate likes (idempotent).
   ===================================== */
export const likeBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Already liked → idempotent success
    if (blog.likedBy?.some((id) => id.toString() === userId)) {
      return res.json(buildInteractionState(blog, userId));
    }

    const updated = await Blog.findByIdAndUpdate(
      blog._id,
      {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 },
      },
      { new: true }
    );

    logger.info(`[likeBlog] User ${userId} liked blog ${slug}`);

    return res.json(buildInteractionState(updated, userId));
  } catch (err) {
    logger.error("[likeBlog] Error:", err);
    return sendErrorResponse(res, 500, "Failed to like blog");
  }
};

/* =====================================
   UNLIKE
   DELETE /api/blogs/:slug/like
   Idempotent: safe to call when not liked.
   ===================================== */
export const unlikeBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const alreadyLiked = blog.likedBy?.some((id) => id.toString() === userId);

    // If not liked, return current state without decrementing
    if (!alreadyLiked) {
      return res.json(buildInteractionState(blog, userId));
    }

    const updated = await Blog.findByIdAndUpdate(
      blog._id,
      {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      },
      { new: true }
    );

    logger.info(`[unlikeBlog] User ${userId} unliked blog ${slug}`);

    return res.json(buildInteractionState(updated, userId));
  } catch (err) {
    logger.error("[unlikeBlog] Error:", err);
    return sendErrorResponse(res, 500, "Failed to unlike blog");
  }
};

/* =====================================
   BOOKMARK
   POST /api/blogs/:slug/bookmark
   Idempotent.
   ===================================== */
export const bookmarkBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    if (blog.bookmarkedBy?.some((id) => id.toString() === userId)) {
      return res.json(buildInteractionState(blog, userId));
    }

    const updated = await Blog.findByIdAndUpdate(
      blog._id,
      { $addToSet: { bookmarkedBy: userId } },
      { new: true }
    );

    logger.info(`[bookmarkBlog] User ${userId} bookmarked blog ${slug}`);

    return res.json(buildInteractionState(updated, userId));
  } catch (err) {
    logger.error("[bookmarkBlog] Error:", err);
    return sendErrorResponse(res, 500, "Failed to bookmark blog");
  }
};

/* =====================================
   REMOVE BOOKMARK
   DELETE /api/blogs/:slug/bookmark
   Idempotent.
   ===================================== */
export const removeBookmark = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    if (!blog.bookmarkedBy?.some((id) => id.toString() === userId)) {
      return res.json(buildInteractionState(blog, userId));
    }

    const updated = await Blog.findByIdAndUpdate(
      blog._id,
      { $pull: { bookmarkedBy: userId } },
      { new: true }
    );

    logger.info(`[removeBookmark] User ${userId} removed bookmark on blog ${slug}`);

    return res.json(buildInteractionState(updated, userId));
  } catch (err) {
    logger.error("[removeBookmark] Error:", err);
    return sendErrorResponse(res, 500, "Failed to remove bookmark");
  }
};