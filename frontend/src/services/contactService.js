import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ===============================
   Public Contact Form API
   =============================== */

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/**
 * Submit a contact form message (public)
 * @param {Object} params - { name, email, subject, message }
 * @returns {Promise<Object>} - { success, message, data }
 */
export async function submitContact({ name, email, subject, message }) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, subject, message }),
  });
}

/* ===============================
   Admin Contact Messages API
   =============================== */

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
 * Get all contact messages (admin only)
 * @param {Object} params - { page, limit, status }
 * @returns {Promise<Object>} - { success, contacts, total, unreadCount, page, totalPages }
 */
export async function getContactMessages(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  const { data } = await adminApi.get(`/admin/contact-messages${queryString ? `?${queryString}` : ""}`);
  return data;
}

/**
 * Get a single contact message by ID (admin only)
 * @param {string} id - Contact message ID
 * @returns {Promise<Object>} - { success, contact }
 */
export async function getContactMessageById(id) {
  const { data } = await adminApi.get(`/admin/contact-messages/${id}`);
  return data;
}

/**
 * Mark a contact message as read (admin only)
 * @param {string} id - Contact message ID
 * @returns {Promise<Object>} - { success, message, contact }
 */
export async function markContactAsRead(id) {
  const { data } = await adminApi.patch(`/admin/contact-messages/${id}/read`);
  return data;
}

/**
 * Delete a contact message (admin only)
 * @param {string} id - Contact message ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteContactMessage(id) {
  const { data } = await adminApi.delete(`/admin/contact-messages/${id}`);
  return data;
}

/**
 * Get unread contact messages count (admin only)
 * @returns {Promise<Object>} - { success, unreadCount }
 */
export async function getUnreadContactCount() {
  const { data } = await adminApi.get("/admin/contact-messages/unread-count");
  return data;
}