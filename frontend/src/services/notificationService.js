import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL;

// Create an axios instance with admin auth interceptor
const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get paginated notifications (admin only)
 * @param {Object} params - { page, limit }
 * @returns {Promise<Object>} - { success, notifications, total, unreadCount, page, totalPages }
 */
export async function getNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);

  const queryString = query.toString();
  const { data } = await adminApi.get(`/notifications${queryString ? `?${queryString}` : ""}`);
  return data;
}

/**
 * Get unread notifications count (admin only)
 * @returns {Promise<Object>} - { success, unreadCount }
 */
export async function getUnreadCount() {
  const { data } = await adminApi.get("/notifications/unread-count");
  return data;
}

/**
 * Get the latest 20 notifications across the entire platform (admin-wide).
 * Uses the dedicated admin endpoint GET /admin/notifications.
 * @returns {Promise<Object>} - { success, notifications: [...] }
 */
export async function getAdminNotifications() {
  const { data } = await adminApi.get("/admin/notifications");
  return data;
}

/**
 * Mark a single notification as read (admin only)
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - { success, message, notification }
 */
export async function markAsRead(id) {
  const { data } = await adminApi.patch(`/notifications/${id}/read`);
  return data;
}

/**
 * Mark all notifications as read (admin only)
 * @returns {Promise<Object>} - { success, message, modifiedCount }
 */
export async function markAllAsRead() {
  const { data } = await adminApi.patch("/notifications/read-all");
  return data;
}

/**
 * Delete a notification (admin only)
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteNotification(id) {
  const { data } = await adminApi.delete(`/notifications/${id}`);
  return data;
}