import { getToken } from "../utils/auth";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

/* ===============================
   Safe request wrapper (public)
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

/* ===============================
   Public Comment APIs
   =============================== */

/**
 * Get approved comments (nested) for a blog by slug.
 * @param {string} slug
 * @returns {Promise<{success:boolean, comments:Array, total:number}>}
 */
export async function getBlogComments(slug) {
  return request(`/blogs/${encodeURIComponent(slug)}/comments`);
}

/**
 * Submit a comment (guest or authenticated user).
 * For authenticated users, the token is attached and backend uses req.user.
 * @param {string} slug
 * @param {Object} payload - { content, guestName?, guestEmail?, parentComment? }
 * @returns {Promise<Object>}
 */
export async function postBlogComment(slug, payload) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return request(`/blogs/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/* ===============================
   Admin Comment APIs
   =============================== */

// Create an axios instance with admin auth interceptor
const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get all comments (admin) with optional filters.
 * @param {Object} params - { page, limit, status, search }
 */
export async function getAdminComments(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  const { data } = await adminApi.get(
    `/admin/blog-comments${queryString ? `?${queryString}` : ""}`
  );
  return data;
}

/**
 * Approve a comment (admin).
 * @param {string} id
 */
export async function approveComment(id) {
  const { data } = await adminApi.patch(`/admin/blog-comments/${id}/approve`);
  return data;
}

/**
 * Reject a comment (admin).
 * @param {string} id
 */
export async function rejectComment(id) {
  const { data } = await adminApi.patch(`/admin/blog-comments/${id}/reject`);
  return data;
}

/**
 * Delete a comment (admin).
 * @param {string} id
 */
export async function deleteComment(id) {
  const { data } = await adminApi.delete(`/admin/blog-comments/${id}`);
  return data;
}