import Newsletter from "../models/Newsletter.js";
import { sendEmail } from "../controllers/smtpController.js";
import logger from "./logger.js";

/* =====================================
   NEWSLETTER EMAIL TEMPLATES
   ===================================== */

const getNewToolEmailTemplate = (tool) => {
  return {
    subject: `🚀 New AI Tool: ${tool.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">New AI Tool Released!</h2>
        <p>We're excited to announce a new AI tool has been added to our platform:</p>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0e7490; margin-top: 0;">${tool.name}</h3>
          <p style="color: #334155;">${tool.description || "Check out this amazing new tool!"}</p>

          ${tool.category ? `<p><strong>Category:</strong> ${tool.category}</p>` : ""}
          ${tool.pricing ? `<p><strong>Pricing:</strong> ${tool.pricing}</p>` : ""}
          ${tool.rating ? `<p><strong>Rating:</strong> ⭐ ${tool.rating}/5</p>` : ""}
        </div>

        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/tools/${tool.slug}"
           style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          View Tool Details
        </a>

        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          You're receiving this email because you subscribed to our newsletter.
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/unsubscribe" style="color: #0891b2;">Unsubscribe</a>
        </p>

        <p style="color: #64748b; font-size: 14px; margin-top: 10px;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile" style="color: #0891b2;">Manage Email Preferences</a>
        </p>
      </div>
    `,
  };
};

/**
 * Build the newsletter subscription verification email template.
 * @param {string} token - The raw (unhashed) verification token to embed in the link.
 * @returns {{ subject: string, html: string }}
 */
export const getNewsletterVerificationTemplate = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-newsletter/${token}`;

  return {
    subject: "Confirm your ToolSphere Newsletter Subscription",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #06b6d4; margin: 0; font-size: 28px;">ToolSphere</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Your AI Tools Discovery Platform</p>
        </div>

        <div style="background: #f0f9ff; padding: 24px; border-radius: 10px;">
          <h2 style="color: #0e7490; margin-top: 0;">Confirm Your Subscription</h2>
          <p style="color: #334155;">
            Thanks for subscribing to the ToolSphere newsletter! We're excited to keep you
            updated with the latest AI tools, blog posts, and platform news.
          </p>
          <p style="margin: 24px 0; text-align: center;">
            <a href="${verificationUrl}"
               style="display: inline-block; background: #06b6d4; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Confirm Subscription
            </a>
          </p>
          <p style="color: #64748b; font-size: 14px;">
            This confirmation link will expire in 24 hours.
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          If you did not request this subscription, ignore this email and you won't be subscribed.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          &copy; ToolSphere. All rights reserved.
        </p>
      </div>
    `,
  };
};

const getNewBlogEmailTemplate = (blog) => {
  return {
    subject: `📝 New Blog Post: ${blog.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">New Blog Post Published!</h2>
        <p>We've just published a new article you might find interesting:</p>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0e7490; margin-top: 0;">${blog.title}</h3>
          <p style="color: #334155;">${blog.excerpt || blog.description || "Click below to read the full article."}</p>

          ${blog.category ? `<p><strong>Category:</strong> ${blog.category}</p>` : ""}
          ${blog.author ? `<p><strong>Author:</strong> ${blog.author}</p>` : ""}
        </div>

        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/blog/${blog.slug}"
           style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Read Article
        </a>

        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          You're receiving this email because you subscribed to our newsletter.
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/unsubscribe" style="color: #0891b2;">Unsubscribe</a>
        </p>

        <p style="color: #64748b; font-size: 14px; margin-top: 10px;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile" style="color: #0891b2;">Manage Email Preferences</a>
        </p>
      </div>
    `,
  };
};

/* =====================================
   HELPER FUNCTIONS
   ===================================== */

/**
 * Send newsletter notification for new tool
 * @param {Object} tool - Tool object with name, slug, description, category, pricing, rating
 */
export const notifyNewTool = async (tool) => {
  try {
    if (!tool || !tool.name) {
      logger.warn("Invalid tool data for newsletter notification");
      return { success: false, message: "Invalid tool data" };
    }

    // Get all active, verified subscribers
    const subscribers = await Newsletter.find({
      status: "active",
      isVerified: true,
      email: { $exists: true, $ne: "" }
    }).select("email");

    if (subscribers.length === 0) {
      logger.info("No active, verified subscribers to notify for new tool");
      return { success: true, message: "No subscribers to notify", count: 0 };
    }

    const emailTemplate = getNewToolEmailTemplate(tool);

    // Send emails to all active subscribers
    const emailPromises = subscribers.map(subscriber =>
      sendEmail(subscriber.email, emailTemplate.subject, emailTemplate.html).catch(err => {
        logger.error(`Failed to send newsletter to ${subscriber.email}: ${err.message}`);
        return null;
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled" && r.value !== null).length;
    const failureCount = results.length - successCount;

    logger.info(`Newsletter sent for new tool "${tool.name}": ${successCount} sent, ${failureCount} failed`);

    return {
      success: true,
      message: `Newsletter sent to ${successCount} subscribers`,
      count: successCount,
      failures: failureCount
    };

  } catch (err) {
    logger.error(`Error sending newsletter for new tool: ${err.message}`);
    return { success: false, message: err.message };
  }
};

/**
 * Send newsletter notification for new blog post
 * @param {Object} blog - Blog object with title, slug, excerpt, description, category, author
 */
export const notifyNewBlog = async (blog) => {
  try {
    if (!blog || !blog.title) {
      logger.warn("Invalid blog data for newsletter notification");
      return { success: false, message: "Invalid blog data" };
    }

    // Get all active, verified subscribers
    const subscribers = await Newsletter.find({
      status: "active",
      isVerified: true,
      email: { $exists: true, $ne: "" }
    }).select("email");

    if (subscribers.length === 0) {
      logger.info("No active, verified subscribers to notify for new blog post");
      return { success: true, message: "No subscribers to notify", count: 0 };
    }

    const emailTemplate = getNewBlogEmailTemplate(blog);

    // Send emails to all active subscribers
    const emailPromises = subscribers.map(subscriber =>
      sendEmail(subscriber.email, emailTemplate.subject, emailTemplate.html).catch(err => {
        logger.error(`Failed to send newsletter to ${subscriber.email}: ${err.message}`);
        return null;
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled" && r.value !== null).length;
    const failureCount = results.length - successCount;

    logger.info(`Newsletter sent for new blog "${blog.title}": ${successCount} sent, ${failureCount} failed`);

    return {
      success: true,
      message: `Newsletter sent to ${successCount} subscribers`,
      count: successCount,
      failures: failureCount
    };

  } catch (err) {
    logger.error(`Error sending newsletter for new blog: ${err.message}`);
    return { success: false, message: err.message };
  }
};

/**
 * Get active subscriber count
 */
export const getActiveSubscriberCount = async () => {
  try {
    const count = await Newsletter.countDocuments({ status: "active" });
    return count;
  } catch (err) {
    logger.error(`Error getting subscriber count: ${err.message}`);
    return 0;
  }
};