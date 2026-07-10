import Notification from "../models/Notification.js";
import Admin from "../models/Admin.js";
import logger from "./logger.js";

/**
 * Seed sample notifications for testing
 * Run via: node backend/server/utils/seedNotifications.js
 */
const seedNotifications = async () => {
  try {
    // Get the first admin user
    const admin = await Admin.findOne();
    if (!admin) {
      logger.error("❌ No admin found. Create an admin first.");
      process.exit(1);
    }

    const existingCount = await Notification.countDocuments({ user: admin._id });
    if (existingCount > 0) {
      logger.info(`ℹ️ ${existingCount} notifications already exist. Skipping seed.`);
      logger.info("   To re-seed, delete existing notifications first.");
      process.exit(0);
    }

    const notifications = [
      {
        user: admin._id,
        title: "New AI Tool Added",
        message: "ChatGPT 5 has been added to the directory.",
        type: "new_ai_tool",
        link: "/admin/tools",
        metadata: { toolId: "sample-id-1" },
      },
      {
        user: admin._id,
        title: "Tool Updated",
        message: "Midjourney v6 has been updated with new features.",
        type: "tool_updated",
        link: "/admin/tools",
      },
      {
        user: admin._id,
        title: "Review Approved",
        message: "Your review for DALL-E 4 has been approved.",
        type: "review_approved",
        link: "/tools/dall-e-4",
      },
      {
        user: admin._id,
        title: "Contact Reply Received",
        message: "You have a new reply from your contact form submission.",
        type: "contact_reply",
        link: "/admin/messages",
      },
      {
        user: admin._id,
        title: "System Announcement",
        message: "Scheduled maintenance tonight at 2 AM UTC.",
        type: "system_announcement",
      },
      {
        user: admin._id,
        title: "Newsletter Update",
        message: "Monthly newsletter has been sent to 1,234 subscribers.",
        type: "newsletter_update",
        link: "/admin/newsletter",
      },
      {
        user: admin._id,
        title: "Saved Tool Updated",
        message: "A tool you bookmarked has received a major update.",
        type: "saved_tool_updated",
        link: "/profile",
      },
      {
        user: admin._id,
        title: "Admin Message",
        message: "Welcome to the admin dashboard! Here are some tips to get started.",
        type: "admin_message",
        metadata: { priority: "high" },
      },
    ];

    await Notification.insertMany(notifications);
    logger.info(`✅ Seeded ${notifications.length} notifications for admin: ${admin.email}`);
    logger.info("   Types seeded:");
    notifications.forEach((n) => logger.info(`   - ${n.type}: ${n.title}`));
    process.exit(0);
  } catch (err) {
    logger.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seedNotifications();