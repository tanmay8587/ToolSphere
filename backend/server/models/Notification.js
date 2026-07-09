import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

/* ==========================================
   NOTIFICATION TYPES ENUM
   Extend this to add future notification types
========================================== */
const NOTIFICATION_TYPES = [
  "tool_updated",
  "new_ai_tool",
  "saved_tool_updated",
  "review_approved",
  "contact_reply",
  "system_announcement",
  "newsletter_update",
  "admin_message",
  "message",
  "report",
  "review",
  "subscriber",
  "alert",
];

/* ==========================================
   NOTIFICATION SCHEMA
========================================== */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "User is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type: {VALUE}",
      },
      required: [true, "Type is required"],
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
notificationSchema.pre("save", function(next) {
  if (this.isModified("title") && this.title) {
    this.title = sanitizeTextField(this.title);
  }
  if (this.isModified("message") && this.message) {
    this.message = sanitizeTextField(this.message);
  }
  next();
});

/* ==========================================
   INDEXES
========================================== */

// For fetching user's notifications sorted by newest first
notificationSchema.index({ user: 1, createdAt: -1 });

// For unread count queries
notificationSchema.index({ user: 1, isRead: 1 });

// Compound for type-based queries
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });

/* ==========================================
   VIRTUAL: read (alias for isRead)
   Provides backward compatibility
========================================== */
notificationSchema.virtual("read").get(function () {
  return this.isRead;
});

/* ==========================================
   STATIC METHODS
========================================== */

/**
 * Create a notification for an admin user
 * @param {Object} data - Notification data
 * @param {string} data.user - User/admin ID
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type from enum
 * @param {string} [data.link] - Optional link
 * @param {Object} [data.metadata] - Optional metadata
 * @returns {Promise<Object>} Created notification
 */
notificationSchema.statics.createNotification = async function (data) {
  return this.create(data);
};

/**
 * Get unread count for a user
 * @param {string} userId - User/admin ID
 * @returns {Promise<number>} Unread count
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User/admin ID
 * @returns {Promise<Object>} Update result
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

/**
 * Get paginated notifications for a user
 * @param {string} userId - User/admin ID
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.type] - Filter by type
 * @returns {Promise<Object>} Paginated notifications
 */
notificationSchema.statics.getPaginated = async function (userId, options = {}) {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (type) filter.type = type;

  const [notifications, total] = await Promise.all([
    this.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total,
    },
  };
};

export default mongoose.model("Notification", notificationSchema);