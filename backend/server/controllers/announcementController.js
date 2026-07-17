import Announcement from "../models/Announcement.js";

/* ==========================================
   GET ACTIVE ANNOUNCEMENTS (PUBLIC)
   GET /api/announcements/active
   Returns announcements that should be displayed on the homepage
   ========================================== */

export const getActiveAnnouncements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const announcements = await Announcement.getActiveAnnouncements(limit);

    res.json({
      success: true,
      announcements,
    });
  } catch (err) {
    console.error("Error fetching active announcements:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

/* ==========================================
   GET ALL ANNOUNCEMENTS (ADMIN)
   GET /api/admin/announcements
   Returns paginated list of all announcements
   ========================================== */

export const getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const result = await Announcement.getPaginated(
      parseInt(page, 10),
      Math.min(parseInt(limit, 10), 50),
      status
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

/* ==========================================
   GET SINGLE ANNOUNCEMENT (ADMIN)
   GET /api/admin/announcements/:id
   ========================================== */

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id).populate("createdBy", "name email");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      announcement,
    });
  } catch (err) {
    console.error("Error fetching announcement:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
    });
  }
};

/* ==========================================
   CREATE ANNOUNCEMENT (ADMIN)
   POST /api/admin/announcements
   ========================================== */

export const createAnnouncement = async (req, res) => {
  try {
    const adminId = req.admin?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { title, message, type, priority, isActive, scheduledAt, expiresAt } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // Validate dates
    if (scheduledAt && expiresAt && new Date(scheduledAt) > new Date(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date cannot be after expiry date",
      });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || "info",
      priority: priority || "medium",
      isActive: isActive !== undefined ? isActive : true,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      createdBy: adminId,
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement: populatedAnnouncement,
    });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create announcement",
    });
  }
};

/* ==========================================
   UPDATE ANNOUNCEMENT (ADMIN)
   PUT /api/admin/announcements/:id
   ========================================== */

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, priority, isActive, scheduledAt, expiresAt } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Validate dates
    const newScheduledAt = scheduledAt !== undefined ? scheduledAt : announcement.scheduledAt;
    const newExpiresAt = expiresAt !== undefined ? expiresAt : announcement.expiresAt;

    if (newScheduledAt && newExpiresAt && new Date(newScheduledAt) > new Date(newExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date cannot be after expiry date",
      });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (message !== undefined) announcement.message = message;
    if (type !== undefined) announcement.type = type;
    if (priority !== undefined) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (scheduledAt !== undefined) announcement.scheduledAt = scheduledAt;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(id)
      .populate("createdBy", "name email")
      .lean();

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement,
    });
  } catch (err) {
    console.error("Error updating announcement:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update announcement",
    });
  }
};

/* ==========================================
   DELETE ANNOUNCEMENT (ADMIN)
   DELETE /api/admin/announcements/:id
   ========================================== */

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};

/* ==========================================
   TOGGLE ANNOUNCEMENT STATUS (ADMIN)
   PATCH /api/admin/announcements/:id/toggle
   ========================================== */

export const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(id)
      .populate("createdBy", "name email")
      .lean();

    res.json({
      success: true,
      message: `Announcement ${announcement.isActive ? "activated" : "deactivated"} successfully`,
      announcement: updatedAnnouncement,
    });
  } catch (err) {
    console.error("Error toggling announcement status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle announcement status",
    });
  }
};