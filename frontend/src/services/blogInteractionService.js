import { getToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ===============================
   Authenticated request wrapper
   =============================== */
async function authRequest(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(data?.message || `Request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return data;
}

/* ===============================
   Public-safe interaction state
   =============================== */
export async function getBlogInteraction(slug) {
  const response = await fetch(
    `${API_BASE}/blogs/${encodeURIComponent(slug)}/interaction`
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load interaction state");
  }
  return data;
}

/* ===============================
   Like / Unlike
   =============================== */
export async function likeBlog(slug) {
  return authRequest(`/blogs/${encodeURIComponent(slug)}/like`, {
    method: "POST",
  });
}

export async function unlikeBlog(slug) {
  return authRequest(`/blogs/${encodeURIComponent(slug)}/like`, {
    method: "DELETE",
  });
}

/* ===============================
   Bookmark / Remove
   =============================== */
export async function bookmarkBlog(slug) {
  return authRequest(`/blogs/${encodeURIComponent(slug)}/bookmark`, {
    method: "POST",
  });
}

export async function removeBookmark(slug) {
  return authRequest(`/blogs/${encodeURIComponent(slug)}/bookmark`, {
    method: "DELETE",
  });
}