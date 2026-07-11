const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  return request(`/blogs${qs ? `?${qs}` : ""}`);
}

/* ===========================
   GET PUBLIC BLOG BY SLUG
   =========================== */
export async function getPublicBlogBySlug(slug) {
  return request(`/blogs/${slug}`);
}

/* ===========================
   GET RELATED BLOGS
   =========================== */
export async function getRelatedBlogs(slug) {
  return request(`/blogs/${slug}/related`);
}

/* ===========================
   GET ADJACENT BLOGS (PREVIOUS/NEXT)
   =========================== */
export async function getAdjacentBlogs(slug) {
  return request(`/blogs/${slug}/adjacent`);
}

/* ===========================
   RECORD BLOG VIEW (POST /api/blogs/:slug/view)
   =========================== */
export async function recordBlogView(slug) {
  try {
    const response = await fetch(`${API_BASE}/blogs/${slug}/view`, {
      method: "POST",
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
