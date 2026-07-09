import mongoose from "mongoose";

/* ==========================================
   NOTIFICATION TYPES
========================================== */
const NOTIFICATION_TYPES = [
  "review",
  "contact",
  "user",
  "newsletter",
  "tool",
];

/* ==========================================
   NOTIFICATION SCHEMA
========================================== */
const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type: {VALUE}",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================
   STATIC METHODS
========================================== */
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

notificationSchema.statics.getPaginated = function (userId, options = {}) {
  const { page = 1, limit = 20, type } = options;

  const filter = { user: userId };
  if (type) {
    filter.type = type;
  }

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.max(parseInt(limit, 10) || 20, 1);
  const skip = (currentPage - 1) * perPage;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage)
    .then((notifications) =>
      this.countDocuments(filter).then((total) => ({
        notifications,
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      }))
    );
};

export default mongoose.model("Notification", notificationSchema);
