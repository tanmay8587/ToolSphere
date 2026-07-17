import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Get paginated notifications for a user.
 * @param {string} userId - User ObjectId.
 * @param {object} options - Pagination options.
 * @param {number} options.page - Page number (1-based).
 * @param {number} options.limit - Items per page.
 * @param {string} [options.type] - Optional notification type filter.
 * @returns {Promise<object>} Paginated result.
 */
notificationSchema.statics.getPaginated = async function (userId, { page, limit, type }) {
  const query = { user: userId };
  if (type) {
    query.type = type;
  }

  const total = await this.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    notifications,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Get unread notification count for a user.
 * @param {string} userId - User ObjectId.
 * @returns {Promise<number>} Unread count.
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

export default mongoose.model("Notification", notificationSchema);
