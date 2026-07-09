import API from "./adminApi";

/* ===============================
   Notification API Service
   All endpoints require admin auth (handled by adminApi interceptor)
=============================== */

/**
 * Fetch paginated notifications
 * @param {Object} params - Query params { page, limit, type }
 * @returns {Promise<Object>} { success, notifications, pagination }
 */
export const getNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.type) query.set("type", params.type);
  const qs = query.toString();
  return API.get(`/notifications${qs ? `?${qs}` : ""}`);
};

/**
 * Get unread notification count
 * @returns {Promise<Object>} { success, count }
 */
export const getUnreadCount = () =>
  API.get("/notifications/unread-count");

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} { success, message, notification }
 */
export const markAsRead = (id) =>
  API.patch(`/notifications/${id}/read`);

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} { success, message, modifiedCount }
 */
export const markAllAsRead = () =>
  API.patch("/notifications/read-all");

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} { success, message }
 */
export const deleteNotification = (id) =>
  API.delete(`/notifications/${id}`);