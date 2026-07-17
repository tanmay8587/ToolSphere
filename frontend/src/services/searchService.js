const API_BASE = import.meta.env.VITE_API_URL;

import { withDeduplication } from "../utils/performance.js";

/* ===========================
   SAFE REQUEST WRAPPER
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
    console.error(`[searchService] Request failed for "${path}":`, error);
    return {
      success: false,
      results: {
        tools: [],
        blogs: [],
        categories: [],
      },
      total: 0,
    };
  }
}

/* ===========================
   GLOBAL SEARCH
   =========================== */
export async function globalSearch(query, limit = 20) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (limit) params.set("limit", Math.min(50, limit));
  const qs = params.toString();
  const cacheKey = `search:${qs}`;

  return withDeduplication(
    () => request(`/search${qs ? `?${qs}` : ""}`),
    cacheKey,
    30 * 1000 // 30 seconds cache for search
  );
}