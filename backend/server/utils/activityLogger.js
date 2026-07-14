import ActivityLog from "../models/ActivityLog.js";
import logger from "./logger.js";

/**
 * Save an activity log entry.
 *
 * @param {Object} params
 * @param {string} params.admin - User ObjectId of the admin performing the action.
 * @param {string} params.adminName - Display name of the admin.
 * @param {string} params.action - Description of the action performed.
 * @param {string} params.resource - The resource type affected (e.g. "Tool", "User").
 * @param {string} params.resourceId - ObjectId of the affected resource.
 * @param {string} [params.details] - Optional extra details about the action.
 * @returns {Promise<object|null>} The created log document, or null if logging failed.
 */
export const logActivity = async ({
  admin,
  adminName,
  action,
  resource,
  resourceId,
  details = "",
}) => {
  try {
    const entry = new ActivityLog({
      admin,
      adminName,
      action,
      resource,
      resourceId,
      details,
    });

    return await entry.save();
  } catch (err) {
    // Activity logging should never break the main request flow.
    logger.error(`Failed to save activity log: ${err.message}`);
    return null;
  }
};

export default logActivity;