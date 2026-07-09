import express from "express";
import { verifyAdmin } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

/* ===========================
   ALL ROUTES REQUIRE ADMIN AUTH
=========================== */

// Get paginated notifications
router.get("/", verifyAdmin, getNotifications);

// Get unread count
router.get("/unread-count", verifyAdmin, getUnreadCount);

// Mark single notification as read
router.patch("/:id/read", verifyAdmin, markAsRead);

// Mark all notifications as read
router.patch("/read-all", verifyAdmin, markAllAsRead);

// Delete notification
router.delete("/:id", verifyAdmin, deleteNotification);

export default router;