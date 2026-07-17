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

// Create an axios instance for public requests (no auth)
const publicApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Get active announcements for homepage display (public endpoint)
 * @param {number} limit - Maximum number of announcements to return
 * @returns {Promise<Object>} - { success, announcements: [...] }
 */
export async function getActiveAnnouncements(limit = 10) {
  const { data } = await publicApi.get(`/announcements/active?limit=${limit}`);
  return data;
}

/**
 * Get all announcements with pagination (admin only)
 * @param {Object} params - { page, limit, status }
 * @returns {Promise<Object>} - { success, announcements, total, page, totalPages, ... }
 */
export async function getAllAnnouncements(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  const { data } = await adminApi.get(`/admin/announcements${queryString ? `?${queryString}` : ""}`);
  return data;
}

/**
 * Get single announcement by ID (admin only)
 * @param {string} id - Announcement ID
 * @returns {Promise<Object>} - { success, announcement }
 */
export async function getAnnouncementById(id) {
  const { data } = await adminApi.get(`/admin/announcements/${id}`);
  return data;
}

/**
 * Create a new announcement (admin only)
 * @param {Object} announcementData - { title, message, type, priority, isActive, scheduledAt, expiresAt }
 * @returns {Promise<Object>} - { success, message, announcement }
 */
export async function createAnnouncement(announcementData) {
  const { data } = await adminApi.post("/admin/announcements", announcementData);
  return data;
}

/**
 * Update an existing announcement (admin only)
 * @param {string} id - Announcement ID
 * @param {Object} announcementData - { title, message, type, priority, isActive, scheduledAt, expiresAt }
 * @returns {Promise<Object>} - { success, message, announcement }
 */
export async function updateAnnouncement(id, announcementData) {
  const { data } = await adminApi.put(`/admin/announcements/${id}`, announcementData);
  return data;
}

/**
 * Delete an announcement (admin only)
 * @param {string} id - Announcement ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteAnnouncement(id) {
  const { data } = await adminApi.delete(`/admin/announcements/${id}`);
  return data;
}

/**
 * Toggle announcement active/inactive status (admin only)
 * @param {string} id - Announcement ID
 * @returns {Promise<Object>} - { success, message, announcement }
 */
export async function toggleAnnouncementStatus(id) {
  const { data } = await adminApi.patch(`/admin/announcements/${id}/toggle`);
  return data;
}