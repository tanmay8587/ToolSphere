import express from "express";
import { verifyAdmin } from "../middleware/auth.js";
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "../controllers/announcementController.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   No authentication required
   =========================== */

// Get active announcements for homepage display
router.get("/active", getActiveAnnouncements);

/* ===========================
   ADMIN ROUTES
   Admin authentication required
   =========================== */

// Get all announcements with pagination and filtering
router.get("/", verifyAdmin, getAllAnnouncements);

// Get single announcement by ID
router.get("/:id", verifyAdmin, getAnnouncementById);

// Create new announcement
router.post("/", verifyAdmin, createAnnouncement);

// Update announcement
router.put("/:id", verifyAdmin, updateAnnouncement);

// Delete announcement
router.delete("/:id", verifyAdmin, deleteAnnouncement);

// Toggle announcement active/inactive status
router.patch("/:id/toggle", verifyAdmin, toggleAnnouncementStatus);

export default router;