const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

import { getAdminToken } from "../utils/auth";

/* ===========================
   SAFE REQUEST WRAPPER
   =========================== */
async function request(path, options = {}) {
  const token = options.token || getAdminToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/* ===========================
   GET ALL BLOGS (ADMIN)
   =========================== */
export async function getBlogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/blogs${query ? `?${query}` : ""}`, {
    token: getAdminToken(),
  });
}

/* ===========================
   GET BLOG STATS (ADMIN)
   =========================== */
export async function getBlogStats() {
  return request(`/admin/blogs/stats`, {
    token: getAdminToken(),
  });
}

/* ===========================
   UPDATE BLOG STATUS (ADMIN)
   draft | published | scheduled
   =========================== */
export async function updateBlogStatus(id, status) {
  return request(`/admin/blogs/${id}/status`, {
    method: "PATCH",
    token: getAdminToken(),
    body: JSON.stringify({ status }),
  });
}

/* ===========================
   TOGGLE FEATURED (ADMIN)
   =========================== */
export async function toggleFeaturedBlog(id) {
  return request(`/admin/blogs/${id}/featured`, {
    method: "PATCH",
    token: getAdminToken(),
  });
}

/* ===========================
   DELETE BLOG (ADMIN - soft delete)
   =========================== */
export async function deleteBlog(id) {
  return request(`/admin/blogs/${id}`, {
    method: "DELETE",
    token: getAdminToken(),
  });
}