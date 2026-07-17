import express from "express";
import { verifyUser, verifyAdmin } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAdminNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

/* ===========================
   USER NOTIFICATION ROUTES
   Authenticated users only.
=========================== */

// Get paginated notifications for the current user
router.get("/", verifyUser, getNotifications);

// Get unread count for the current user
router.get("/unread-count", verifyUser, getUnreadCount);

// Mark single notification as read
router.patch("/:id/read", verifyUser, markAsRead);

// Mark all notifications as read
router.patch("/read-all", verifyUser, markAllAsRead);

// Delete notification
router.delete("/:id", verifyUser, deleteNotification);

/* ===========================
   ADMIN NOTIFICATION ROUTES
   Admin only.
=========================== */

// Get latest 20 platform-wide notifications
router.get("/admin/all", verifyAdmin, getAdminNotifications);

export default router;
