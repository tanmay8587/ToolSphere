import express from "express";

import {
  loginAdmin,
  getProfile,
  getDashboard,
  updateProfile,
  changePassword,
  adminSearch,
} from "../controllers/adminController.js";

import {
  exportSettings,
  exportTools,
  exportCategories,
  exportUsers,
} from "../controllers/backupController.js";

import {
  getAllToolsAdmin,
  getToolByIdAdmin,
  addTool,
  updateTool,
  deleteTool,
  approveTool,
  rejectTool,
  toggleFeaturedTool,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getPendingReviews,
  approveReview,
  rejectReview,
  deleteReview,
} from "../controllers/toolController.js";

import {
  getAllToolRequests,
  updateToolRequestStatus,
} from "../controllers/toolRequestController.js";

import { verifyAdmin } from "../middleware/auth.js";
import loginLimiter from "../middleware/loginRateLimiter.js";
import upload from "../middleware/upload.js";
import {
  toggleMaintenanceMode,
  updateMaintenanceSettings,
} from "../controllers/maintenanceController.js";

import {
  getContacts,
  getSingleContact,
  markAsRead,
  deleteContact,
  getUnreadCount,
} from "../controllers/contactController.js";

import {
  getSubscribers,
  deleteSubscriber,
  resendVerification,
  getNewsletterStats,
} from "../controllers/newsletterController.js";

import {
  getAllCategories as getAllBlogCategories,
  getCategoryById as getBlogCategoryById,
  createCategory as createBlogCategory,
  updateCategory as updateBlogCategory,
  deleteCategory as deleteBlogCategory,
} from "../controllers/blogCategoryController.js";

import { getAdminNotifications } from "../controllers/notificationController.js";

import { getActivityLogs } from "../controllers/activityLogController.js";

const router = express.Router();

/* ===========================
   AUTH (PUBLIC)
=========================== */
router.post("/login", loginLimiter, loginAdmin);

/* ===========================
   ADMIN PROFILE / DASHBOARD
=========================== */

/* ===========================
   MAINTENANCE MODE
=========================== */
router.put("/maintenance/toggle", verifyAdmin, toggleMaintenanceMode);
router.put("/maintenance/settings", verifyAdmin, updateMaintenanceSettings);
router.get("/profile", verifyAdmin, getProfile);
router.put("/profile", verifyAdmin, updateProfile);
router.put("/change-password", verifyAdmin, changePassword);
router.get("/dashboard", verifyAdmin, getDashboard);

/* ===========================
   ADMIN SEARCH
=========================== */
router.get("/search", verifyAdmin, adminSearch);

/* ===========================
   TOOLS MANAGEMENT
=========================== */
router.get("/tools", verifyAdmin, getAllToolsAdmin);
router.get("/tools/:id", verifyAdmin, getToolByIdAdmin);

router.post("/tools", verifyAdmin, addTool);
router.put("/tools/:id", verifyAdmin, upload.single("image"), updateTool);
router.delete("/tools/:id", verifyAdmin, deleteTool);

/* TOOL MODERATION */
router.put("/tools/:id/approve", verifyAdmin, approveTool);
router.put("/tools/:id/reject", verifyAdmin, rejectTool);
router.put("/tools/:id/feature", verifyAdmin, toggleFeaturedTool);

/* ===========================
   TOOL CATEGORIES
   =========================== */
router.get("/categories", verifyAdmin, getAdminCategories);
router.post("/categories", verifyAdmin, createCategory);
router.put("/categories/:id", verifyAdmin, updateCategory);
router.delete("/categories/:id", verifyAdmin, deleteCategory);
router.put("/categories/:id/toggle", verifyAdmin, toggleCategoryActive);

/* ===========================
   BLOG CATEGORIES
   =========================== */
router.get("/blog-categories", verifyAdmin, getAllBlogCategories);
router.get("/blog-categories/:id", verifyAdmin, getBlogCategoryById);
router.post("/blog-categories", verifyAdmin, createBlogCategory);
router.put("/blog-categories/:id", verifyAdmin, updateBlogCategory);
router.delete("/blog-categories/:id", verifyAdmin, deleteBlogCategory);

/* ===========================
   USERS MANAGEMENT
   =========================== */
router.get("/users", verifyAdmin, getAdminUsers);
router.put("/users/:id", verifyAdmin, updateAdminUser);
router.delete("/users/:id", verifyAdmin, deleteAdminUser);

/* ===========================
    CONTACT MESSAGES (ADMIN)
=========================== */
router.get("/contact-messages", verifyAdmin, getContacts);
router.get("/contact-messages/unread-count", verifyAdmin, getUnreadCount);
router.get("/contact-messages/:id", verifyAdmin, getSingleContact);
router.patch("/contact-messages/:id/read", verifyAdmin, markAsRead);
router.delete("/contact-messages/:id", verifyAdmin, deleteContact);

/* ===========================
    BACKUP / EXPORT
=========================== */
router.get("/export/settings", verifyAdmin, exportSettings);
router.get("/export/tools", verifyAdmin, exportTools);
router.get("/export/categories", verifyAdmin, exportCategories);
router.get("/export/users", verifyAdmin, exportUsers);

/* ===========================
    NEWSLETTER SUBSCRIBERS (ADMIN)
=========================== */
router.get("/newsletter/subscribers", verifyAdmin, getSubscribers);
router.get("/newsletter/stats", verifyAdmin, getNewsletterStats);
router.delete("/newsletter/subscribers/:id", verifyAdmin, deleteSubscriber);
router.post("/newsletter/subscribers/:id/resend-verification", verifyAdmin, resendVerification);

/* ===========================
    NOTIFICATIONS (ADMIN-WIDE)
=========================== */
router.get("/notifications", verifyAdmin, getAdminNotifications);

/* ===========================
    REVIEWS MODERATION (ADMIN)
=========================== */
router.get("/reviews", verifyAdmin, getPendingReviews);
router.put("/reviews/:id/approve", verifyAdmin, approveReview);
router.put("/reviews/:id/reject", verifyAdmin, rejectReview);
router.delete("/reviews/:id", verifyAdmin, deleteReview);

/* ===========================
   TOOL REQUESTS (ADMIN)
   =========================== */
router.get("/tool-requests", verifyAdmin, getAllToolRequests);
router.put("/tool-requests/:id/status", verifyAdmin, updateToolRequestStatus);

/* ===========================
   ACTIVITY LOGS (ADMIN)
   =========================== */
router.get("/activity-logs", verifyAdmin, getActivityLogs);

export default router;
