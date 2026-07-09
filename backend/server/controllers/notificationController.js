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
    const userId = req.admin.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
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
    const userId = req.admin.id;

    const result = await Notification.markAllAsRead(userId);

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