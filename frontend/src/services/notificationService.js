import axios from "axios";
import { getAdminToken, getToken } from "../utils/auth";

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

// Create an axios instance with user auth interceptor
const userApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

userApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get paginated notifications for the current user.
 * @param {Object} params - { page, limit, type }
 * @returns {Promise<Object>} - { success, notifications, total, page, totalPages }
 */
export async function getNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.type) query.set("type", params.type);

  const queryString = query.toString();
  const { data } = await userApi.get(`/notifications${queryString ? `?${queryString}` : ""}`);
  return data;
}

/**
 * Get unread notifications count for the current user.
 * @returns {Promise<Object>} - { success, count }
 */
export async function getUnreadCount() {
  const { data } = await userApi.get("/notifications/unread-count");
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
 * Mark a single notification as read for the current user.
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - { success, message, notification }
 */
export async function markAsRead(id) {
  const { data } = await userApi.patch(`/notifications/${id}/read`);
  return data;
}

/**
 * Mark all notifications as read for the current user.
 * @returns {Promise<Object>} - { success, message, modifiedCount }
 */
export async function markAllAsRead() {
  const { data } = await userApi.patch("/notifications/read-all");
  return data;
}

/**
 * Delete a notification for the current user.
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteNotification(id) {
  const { data } = await userApi.delete(`/notifications/${id}`);
  return data;
}
