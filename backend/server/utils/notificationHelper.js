import Notification from "../models/Notification.js";
import logger from "./logger.js";

/**
 * Create a notification for a user.
 *
 * @param {Object} params
 * @param {string} params.user - User ObjectId the notification belongs to.
 * @param {string} params.title - Notification title.
 * @param {string} params.message - Notification message body.
 * @param {string} params.type - Notification type/category.
 * @param {string} [params.relatedId] - Optional ObjectId of a related resource.
 * @returns {Promise<object|null>} The created notification document, or null if creation failed.
 */
export const createNotification = async ({
  user,
  title,
  message,
  type,
  relatedId,
}) => {
  try {
    const notification = new Notification({
      user,
      title,
      message,
      type,
      relatedId,
    });

    return await notification.save();
  } catch (err) {
    // Notification creation should never break the main request flow.
    logger.error(`Failed to create notification: ${err.message}`);
    return null;
  }
};

export default createNotification;