import BlogComment from "../models/BlogComment.js";
import Blog from "../models/Blog.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";
import { validateEmail, sanitizeTextField } from "../utils/validation.js";
import { sendErrorResponse, AppError } from "../utils/errorResponse.js";

/* =====================================
   HELPERS
   ===================================== */

// Resolve the blog by slug (must be published and not deleted)
const resolveBlogBySlug = async (slug) => {
  return Blog.findOne({ slug, isDeleted: false, status: "published" });
};

// Build a nested comment tree (one level of replies) from a flat list
const buildCommentTree = (comments) => {
  const map = new Map();
  const roots = [];

  comments.forEach((c) => {
    const obj = c.toObject ? c.toObject() : { ...c };
    obj.replies = [];
    map.set(String(obj._id), obj);
  });

  comments.forEach((c) => {
    const obj = map.get(String(c._id));
    if (c.parentComment) {
      const parent = map.get(String(c.parentComment));
      if (parent) {
        parent.replies.push(obj);
        return;
      }
    }
    roots.push(obj);
  });

  return roots;
};

/* =====================================
   PUBLIC - GET COMMENTS BY BLOG SLUG
   GET /api/blogs/:slug/comments
   Returns only approved, non-deleted comments as a nested tree.
   ===================================== */
export const getCommentsByBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    const comments = await BlogComment.find({
      blog: blog._id,
      status: "approved",
      isDeleted: false,
    })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 })
      .lean();

    // Attach display name for guests
    const decorated = comments.map((c) => ({
      ...c,
      authorName: c.user?.name || c.guestName || "Anonymous",
      authorAvatar: c.user?.avatar || "",
      isGuest: !c.user,
    }));

    const tree = buildCommentTree(decorated);

    return res.json({
      success: true,
      comments: tree,
      total: decorated.length,
    });
  } catch (err) {
    logger.error("[getCommentsByBlog] Error fetching comments:", err);
    return sendErrorResponse(res, 500, "Failed to fetch comments");
  }
};

/* =====================================
   PUBLIC - ADD COMMENT
   POST /api/blogs/:slug/comments
   Supports both guests and authenticated users.
   ===================================== */
export const addComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { content, guestName, guestEmail, parentComment } = req.body;

    const blog = await resolveBlogBySlug(slug);
    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found");
    }

    // Validate content
    if (!content || !String(content).trim()) {
      return sendErrorResponse(res, 400, "Comment content is required");
    }
    if (String(content).trim().length > 2000) {
      return sendErrorResponse(res, 400, "Comment cannot exceed 2000 characters");
    }

    const payload = {
      blog: blog._id,
      content: String(content).trim(),
      status: "pending",
    };

    // Authenticated user path
    if (req.user && req.user.id) {
      payload.user = req.user.id;
    } else {
      // Guest path: require name + valid email
      if (!guestName || !String(guestName).trim()) {
        return sendErrorResponse(res, 400, "Your name is required to post a comment");
      }
      if (!guestEmail || !String(guestEmail).trim()) {
        return sendErrorResponse(res, 400, "Your email is required to post a comment");
      }
      if (!validateEmail(guestEmail)) {
        return sendErrorResponse(res, 400, "Please provide a valid email address");
      }
      payload.guestName = String(guestName).trim().slice(0, 100);
      payload.guestEmail = String(guestEmail).trim().toLowerCase().slice(0, 200);
    }

    // Handle reply (one level only)
    if (parentComment) {
      const parent = await BlogComment.findOne({
        _id: parentComment,
        blog: blog._id,
        isDeleted: false,
      });
      if (!parent) {
        return sendErrorResponse(res, 404, "Parent comment not found");
      }
      // Only allow replies to top-level comments (no nested replies beyond one level)
      if (parent.parentComment) {
        return sendErrorResponse(res, 400, "Replies can only be made to top-level comments");
      }
      payload.parentComment = parent._id;
    }

    const comment = await BlogComment.create(payload);

    // Notify admin of a new comment awaiting moderation
    try {
      await Notification.create({
        title: "New Blog Comment",
        message: `A new comment was submitted on "${blog.title}".`,
        type: "blog-comment",
        isRead: false,
      });
    } catch (notifyErr) {
      logger.error("[addComment] Failed to create notification:", notifyErr);
    }

    logger.info(`[addComment] Comment submitted for blog ${blog.slug} (status: pending)`);

    return res.status(201).json({
      success: true,
      message:
        "Your comment has been submitted and is awaiting moderation.",
      comment: {
        _id: comment._id,
        status: comment.status,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendErrorResponse(res, err.statusCode, err.message);
    }
    logger.error("[addComment] Error creating comment:", err);
    return sendErrorResponse(res, 500, "Failed to submit comment");
  }
};

/* =====================================
   ADMIN - GET ALL COMMENTS
   GET /api/admin/blog-comments
   ===================================== */
export const getAdminComments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search ? String(req.query.search).trim() : "";

    const filter = { isDeleted: false };

    if (status && ["approved", "pending", "rejected"].includes(status)) {
      filter.status = status;
    }

    let blogMatch = null;
    if (search) {
      // Search by blog title
      const blogs = await Blog.find({
        title: { $regex: search, $options: "i" },
        isDeleted: false,
      }).select("_id");
      const blogIds = blogs.map((b) => b._id);
      filter.blog = { $in: blogIds };
    }

    const [comments, total] = await Promise.all([
      BlogComment.find(filter)
        .populate("user", "name email avatar")
        .populate("blog", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogComment.countDocuments(filter),
    ]);

    const decorated = comments.map((c) => ({
      ...c,
      authorName: c.user?.name || c.guestName || "Anonymous",
      authorEmail: c.user?.email || c.guestEmail || "",
      isGuest: !c.user,
    }));

    // Counts for summary cards
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      BlogComment.countDocuments({ isDeleted: false, status: "pending" }),
      BlogComment.countDocuments({ isDeleted: false, status: "approved" }),
      BlogComment.countDocuments({ isDeleted: false, status: "rejected" }),
    ]);

    return res.json({
      success: true,
      comments: decorated,
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error("[getAdminComments] Error fetching comments:", err);
    return sendErrorResponse(res, 500, "Failed to fetch comments");
  }
};

/* =====================================
   ADMIN - APPROVE COMMENT
   PATCH /api/admin/blog-comments/:id/approve
   ===================================== */
export const approveComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await BlogComment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    comment.status = "approved";
    await comment.save();

    logger.info(`[approveComment] Comment ${id} approved`);

    return res.json({
      success: true,
      message: "Comment approved",
      comment,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid comment ID format");
    }
    logger.error("[approveComment] Error approving comment:", err);
    return sendErrorResponse(res, 500, "Failed to approve comment");
  }
};

/* =====================================
   ADMIN - REJECT COMMENT
   PATCH /api/admin/blog-comments/:id/reject
   ===================================== */
export const rejectComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await BlogComment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    comment.status = "rejected";
    await comment.save();

    logger.info(`[rejectComment] Comment ${id} rejected`);

    return res.json({
      success: true,
      message: "Comment rejected",
      comment,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid comment ID format");
    }
    logger.error("[rejectComment] Error rejecting comment:", err);
    return sendErrorResponse(res, 500, "Failed to reject comment");
  }
};

/* =====================================
   ADMIN - DELETE COMMENT (soft delete)
   DELETE /api/admin/blog-comments/:id
   ===================================== */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await BlogComment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    // Soft-delete the comment and any direct replies
    await BlogComment.updateMany(
      { $or: [{ _id: id }, { parentComment: id }] },
      { isDeleted: true }
    );

    logger.info(`[deleteComment] Comment ${id} deleted by admin`);

    return res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (err) {
    if (err.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid comment ID format");
    }
    logger.error("[deleteComment] Error deleting comment:", err);
    return sendErrorResponse(res, 500, "Failed to delete comment");
  }
};