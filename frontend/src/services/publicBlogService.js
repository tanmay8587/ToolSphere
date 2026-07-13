const API_BASE = import.meta.env.VITE_API_URL;

import { getVisitorId } from "../utils/visitorId.js";
import { getToken } from "../utils/auth.js";
import { withDeduplication, apiCache } from "../utils/performance.js";

/* ===========================
   SAFE REQUEST WRAPPER (public)
   =========================== */
async function request(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[publicBlogService] Request failed for "${path}":`, error);
    return { success: false, blogs: [], blog: null, total: 0, currentPage: 1, totalPages: 0 };
  }
}

/* ===========================
   GET PUBLIC BLOGS
   =========================== */
export async function getPublicBlogs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category && params.category !== "All") query.set("category", params.category);
  if (params.tag) query.set("tag", params.tag);
  if (params.status) query.set("status", params.status);
  if (params.featured === "true") query.set("featured", "true");
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  const cacheKey = `blogs:${qs}`;
  
  return withDeduplication(
    () => request(`/blogs${qs ? `?${qs}` : ""}`),
    cacheKey,
    2 * 60 * 1000 // 2 minutes cache
  );
}

/* ===========================
   GET PUBLIC BLOG BY SLUG
   =========================== */
export async function getPublicBlogBySlug(slug) {
  const cacheKey = `blog:${slug}`;
  
  return withDeduplication(
    () => request(`/blogs/${slug}`),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );
}

/* ===========================
   GET RELATED BLOGS
   =========================== */
export async function getRelatedBlogs(slug) {
  const cacheKey = `blog:${slug}:related`;
  
  return withDeduplication(
    () => request(`/blogs/${slug}/related`),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );
}

/* ===========================
   GET ADJACENT BLOGS (PREVIOUS/NEXT)
   =========================== */
export async function getAdjacentBlogs(slug) {
  const cacheKey = `blog:${slug}:adjacent`;
  
  return withDeduplication(
    () => request(`/blogs/${slug}/adjacent`),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );
}

/* ===========================
   RECORD BLOG VIEW (POST /api/blogs/:slug/view)
   Sends the persistent anonymous visitor id (X-Visitor-ID) and, when present,
   the user auth token so the backend can deduplicate the view correctly.
   =========================== */
export async function recordBlogView(slug) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "X-Visitor-ID": getVisitorId(),
    };

    // Include the user token if logged in so the backend dedups by userId.
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/blogs/${slug}/view`, {
      method: "POST",
      headers,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[publicBlogService] Failed to record view for "${slug}":`, error);
    return { success: false, views: 0, counted: false };
  }
}

/* ===========================
   GET TRENDING BLOGS (top 6 by views)
   =========================== */
export async function getTrendingBlogs() {
  const cacheKey = `blogs:trending`;
  
  return withDeduplication(
    () => request(`/blogs/trending`),
    cacheKey,
    10 * 60 * 1000 // 10 minutes cache
  );
}
