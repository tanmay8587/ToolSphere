import Contact from "../models/Contact.js";
import logger from "../utils/logger.js";
import { validateEmail } from "../utils/validation.js";

/* ===========================
   SUBMIT CONTACT FORM (PUBLIC)
   POST /api/contact
   =========================== */
export async function submitContact(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (message.length > 5000) {
      return res.status(400).json({ success: false, message: "Message is too long (max 5000 characters)" });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : "",
      message: message.trim(),
    });

    logger.info(`Contact form submitted by ${contact.email}`);

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully.",
      data: { id: contact._id },
    });
  } catch (error) {
    logger.error("Contact form error:", error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    return res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
}

/* ===========================
   GET ALL CONTACT MESSAGES (ADMIN)
   GET /api/admin/contact-messages
   =========================== */
export async function getContacts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status && ["unread", "read", "replied"].includes(status)) {
      filter.status = status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);

    // Count unread messages for sidebar badge
    const unreadCount = await Contact.countDocuments({ status: "unread" });

    return res.json({
      success: true,
      contacts,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Get contacts error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch contacts" });
  }
}

/* ===========================
   GET SINGLE CONTACT MESSAGE (ADMIN)
   GET /api/admin/contact-messages/:id
   =========================== */
export async function getSingleContact(req, res) {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id).lean();

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact message not found" });
    }

    return res.json({ success: true, contact });
  } catch (error) {
    logger.error("Get single contact error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid contact ID format" });
    }

    return res.status(500).json({ success: false, message: "Failed to fetch contact message" });
  }
}

/* ===========================
   MARK MESSAGE AS READ (ADMIN)
   PATCH /api/admin/contact-messages/:id/read
   =========================== */
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { isRead: true, status: "read" },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact message not found" });
    }

    logger.info(`Contact message ${id} marked as read`);

    return res.json({ success: true, message: "Message marked as read", contact });
  } catch (error) {
    logger.error("Mark as read error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid contact ID format" });
    }

    return res.status(500).json({ success: false, message: "Failed to mark message as read" });
  }
}

/* ===========================
   UPDATE CONTACT STATUS (ADMIN)
   PATCH /api/admin/contact-messages/:id
   =========================== */
export async function updateContactStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "replied"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updateData = { status };
    if (status === "read") {
      updateData.isRead = true;
    } else if (status === "unread") {
      updateData.isRead = false;
    }

    const contact = await Contact.findByIdAndUpdate(id, updateData, { new: true });

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    return res.json({ success: true, message: "Status updated", contact });
  } catch (error) {
    logger.error("Update contact status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
}

/* ===========================
   DELETE CONTACT (ADMIN)
   DELETE /api/admin/contact-messages/:id
   =========================== */
export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    logger.info(`Contact message ${id} deleted by admin`);

    return res.json({ success: true, message: "Contact message deleted" });
  } catch (error) {
    logger.error("Delete contact error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid contact ID format" });
    }

    return res.status(500).json({ success: false, message: "Failed to delete contact" });
  }
}

/* ===========================
   GET UNREAD COUNT (ADMIN)
   GET /api/admin/contact-messages/unread-count
   =========================== */
export async function getUnreadCount(req, res) {
  try {
    const unreadCount = await Contact.countDocuments({ status: "unread" });

    return res.json({ success: true, unreadCount });
  } catch (error) {
    logger.error("Get unread count error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
}