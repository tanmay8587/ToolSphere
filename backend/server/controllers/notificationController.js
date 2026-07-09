import Notification from "../models/Notification.js";

/* ==========================================
   GET NOTIFICATIONS (Paginated)
   GET /api/notifications
========================================== */

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.admin.id;

    const result = await Notification.getPaginated(userId, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      type,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/* ==========================================
   GET UNREAD NOTIFICATION COUNT
   GET /api/notifications/unread-count
========================================== */

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.admin.id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

/* ==========================================
   MARK SINGLE NOTIFICATION AS READ
   PATCH /api/notifications/:id/read
========================================== */

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin-only route (verifyAdmin). Notifications shown in the admin
    // dropdown are platform-wide and may not be scoped to a single user,
    // so we update by _id directly to persist isRead in MongoDB.
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

/* ==========================================
   MARK ALL NOTIFICATIONS AS READ
   PATCH /api/notifications/read-all
========================================== */

export const markAllAsRead = async (req, res) => {
  try {
    // Admin-only route (verifyAdmin). The admin dropdown shows platform-wide
    // notifications that are not scoped to a single user, so we mark every
    // unread notification as read regardless of user.
    const result = await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

/* ==========================================
   DELETE NOTIFICATION
   DELETE /api/notifications/:id
========================================== */

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.admin.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

/* ==========================================
   GET ALL NOTIFICATIONS (ADMIN-WIDE)
   GET /api/admin/notifications
   Returns the latest 20 notifications across the
   entire platform (not scoped to a single user).
========================================== */

export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};
