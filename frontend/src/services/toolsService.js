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
    console.error(`[toolsService] Request failed for "${path}":`, error);
    return {
      success: false,
      tools: [],
      tool: null,
      categories: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
      },
    };
  }
}

/* ===========================
   GET ALL TOOLS (SEARCH + FILTER)
=========================== */
export async function getTools(params = {}) {
  const query = new URLSearchParams(params).toString();
  const cacheKey = `tools:${query}`;
  
  return withDeduplication(
    () => request(`/tools${query ? `?${query}` : ""}`),
    cacheKey,
    2 * 60 * 1000 // 2 minutes cache
  );
}

/* ===========================
   FEATURED TOOLS
=========================== */
export async function getFeaturedTools() {
  const cacheKey = "tools:featured";
  
  const data = await withDeduplication(
    () => request("/tools/featured"),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );

  return {
    success: data?.success ?? false,
    tools: data?.tools ?? [],
  };
}

/* ===========================
   CATEGORIES
=========================== */
export async function getCategories() {
  const cacheKey = "tools:categories";
  
  const data = await withDeduplication(
    () => request("/tools/categories"),
    cacheKey,
    10 * 60 * 1000 // 10 minutes cache
  );

  return {
    success: data?.success ?? false,
    categories: data?.categories ?? [],
  };
}

/* ===========================
   SINGLE TOOL BY SLUG
=========================== */
export async function getToolBySlug(slug) {
  const cacheKey = `tool:${slug}`;
  
  const data = await withDeduplication(
    () => request(`/tools/${slug}`),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );

  return {
    success: data?.success ?? false,
    tool: data?.tool ?? null,
  };
}

/* ===========================
   RELATED TOOLS
=========================== */
export async function getRelatedTools(slug) {
  const cacheKey = `tool:${slug}:related`;
  
  const data = await withDeduplication(
    () => request(`/tools/${slug}/related`),
    cacheKey,
    5 * 60 * 1000 // 5 minutes cache
  );

  return {
    success: data?.success ?? false,
    tools: data?.tools ?? [],
  };
}

/* ===========================
   REPORT TOOL
=========================== */
export async function reportTool(toolId, toolName, reason, comment = "") {
  const response = await fetch(`${API_BASE}/tools/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toolId,
      toolName,
      reason,
      comment,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Report failed: ${response.status}`);
  }

  return data;
}
