import crypto from "crypto";
import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";
import { validateEmail } from "../utils/validation.js";
import { sendEmail } from "./smtpController.js";
import { getContactVerificationTemplate } from "../utils/contactEmail.js";

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

    // Generate a secure random verification token, hash it, and store the hash.
    // The raw token is only sent via email and never persisted.
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : "",
      message: message.trim(),
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await Notification.create({
      title: "New Contact Message",
      message: "A new contact message has been received.",
      type: "contact",
      isRead: false,
    });

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const subject = contact.subject || "No subject";
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #06b6d4;">New Contact Message</h2>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${contact.message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              Received: ${new Date(contact.createdAt).toLocaleString()}
            </p>
          </div>
        `;

        await sendEmail(adminEmail, `New Contact Message - ToolSphere`, html);
        logger.info(`Contact notification email sent to ${adminEmail}`);
      }
    } catch (emailError) {
      logger.error("Failed to send contact notification email:", emailError);
      // Don't fail the request if email fails
    }

    // Send verification email to the guest (does NOT mark as verified)
    try {
      const { subject, html } = getContactVerificationTemplate(verificationToken, contact.name);
      await sendEmail(contact.email, subject, html);
      logger.info(`Contact verification email sent to ${contact.email}`);
    } catch (userEmailError) {
      logger.error("Failed to send contact verification email to user:", userEmailError);
      // Don't fail the request if user email fails
    }

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
   SUBMIT CONTACT FORM (AUTHENTICATED)
   POST /api/contact/auth
   Uses req.user.email, ignores client-provided email
   =========================== */
export async function submitContactAuth(req, res) {
  try {
    const { name, subject, message } = req.body;
    const email = req.user.email; // Always use the authenticated user's email

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
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
      // Authenticated users are already verified via their account
      emailVerified: true,
    });

    await Notification.create({
      title: "New Contact Message",
      message: "A new contact message has been received.",
      type: "contact",
      isRead: false,
    });

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const subject = contact.subject || "No subject";
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #06b6d4;">New Contact Message</h2>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${contact.message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              Received: ${new Date(contact.createdAt).toLocaleString()}
            </p>
          </div>
        `;

        await sendEmail(adminEmail, `New Contact Message - ToolSphere`, html);
        logger.info(`Contact notification email sent to ${adminEmail}`);
      }
    } catch (emailError) {
      logger.error("Failed to send contact notification email:", emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      const userConfirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Thank You for Contacting ToolSphere!</h2>
          <p>Dear ${contact.name},</p>
          <p>Thank you for reaching out to us. We have successfully received your message and appreciate you taking the time to contact us.</p>
          <p><strong>Your message has been received and our team will get back to you as soon as possible.</strong></p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #0e7490; margin-top: 0;">What happens next?</h3>
            <p>Our team typically responds within 24-48 hours. We'll review your message and get back to you with a helpful response.</p>
          </div>
          <p>In the meantime, feel free to explore our platform and discover amazing AI tools at <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #06b6d4;">ToolSphere</a>.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            <strong>ToolSphere</strong><br />
            Empowering your workflow with AI
          </p>
        </div>
      `;

      await sendEmail(contact.email, "Thanks for contacting ToolSphere", userConfirmationHtml);
      logger.info(`Contact confirmation email sent to ${contact.email}`);
    } catch (userEmailError) {
      logger.error("Failed to send contact confirmation email to user:", userEmailError);
      // Don't fail the request if user email fails
    }

    logger.info(`Contact form submitted by authenticated user ${contact.email}`);

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully.",
      data: { id: contact._id },
    });
  } catch (error) {
    logger.error("Contact form (auth) error:", error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    return res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
}

/* ===========================
   VERIFY CONTACT EMAIL (PUBLIC)
   GET /api/contact/verify-email/:token
   =========================== */
export async function verifyContactEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    // Decode in case the token was URL-encoded by the client/mail client
    const decodedToken = decodeURIComponent(token);

    // Hash the incoming token to compare with the stored hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(decodedToken)
      .digest("hex");

    // Find the contact with a matching token that has not expired
    const contact = await Contact.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!contact) {
      // Check if a contact exists with this token (to distinguish expired vs invalid)
      const contactWithToken = await Contact.findOne({
        emailVerificationToken: hashedToken,
      });

      if (contactWithToken) {
        // Token exists but is expired
        return res.status(400).json({
          success: false,
          message: "Verification link has expired. Please submit your message again.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid verification token.",
      });
    }

    // Already verified — idempotent success
    if (contact.emailVerified) {
      return res.status(200).json({
        success: true,
        message: "Your email is already verified. Thank you!",
        alreadyVerified: true,
      });
    }

    // Mark as verified and clear the verification token fields
    contact.emailVerified = true;
    contact.emailVerificationToken = undefined;
    contact.emailVerificationExpires = undefined;
    await contact.save();

    logger.info(`Contact email verified: ${contact.email}`);

    return res.status(200).json({
      success: true,
      message: "Your email has been verified successfully. Thank you for contacting ToolSphere!",
    });
  } catch (error) {
    logger.error("Contact email verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify email. Please try again later.",
    });
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