import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scheduledAt: {
      type: Date,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Get active announcements that should be displayed.
 * An announcement is active if:
 * 1. isActive is true
 * 2. scheduledAt is null or in the past
 * 3. expiresAt is null or in the future
 * @param {number} limit - Maximum number of announcements to return
 * @returns {Promise<Array>} Active announcements sorted by priority and creation date
 */
announcementSchema.statics.getActiveAnnouncements = async function (limit = 10) {
  const now = new Date();
  
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  const announcements = await this.find({
    isActive: true,
    $or: [
      { scheduledAt: null },
      { scheduledAt: { $lte: now } }
    ],
    $or: [
      { expiresAt: null },
      { expiresAt: { $gte: now } }
    ]
  })
    .sort((a, b) => {
      // Sort by priority first (higher priority first)
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      // Then by creation date (newest first)
      return b.createdAt - a.createdAt;
    })
    .limit(limit)
    .lean();

  return announcements;
};

/**
 * Get all announcements with pagination (admin only)
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @param {string} [status] - Optional filter: 'active', 'inactive', 'scheduled', 'expired'
 * @returns {Promise<Object>} Paginated result
 */
announcementSchema.statics.getPaginated = async function (page = 1, limit = 20, status = null) {
  const now = new Date();
  let query = {};

  if (status === "active") {
    query = {
      isActive: true,
      $or: [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    };
  } else if (status === "inactive") {
    query = { isActive: false };
  } else if (status === "scheduled") {
    query = { scheduledAt: { $gt: now } };
  } else if (status === "expired") {
    query = { expiresAt: { $lt: now } };
  }

  const total = await this.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;

  const announcements = await this.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    announcements,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export default mongoose.model("Announcement", announcementSchema);