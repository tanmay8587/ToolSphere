const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  return request(`/tools${query ? `?${query}` : ""}`);
}

/* ===========================
   FEATURED TOOLS
=========================== */
export async function getFeaturedTools() {
  const data = await request("/tools/featured");

  return {
    success: data?.success ?? false,
    tools: data?.tools ?? [],
  };
}

/* ===========================
   CATEGORIES
=========================== */
export async function getCategories() {
  const data = await request("/tools/categories");

  return {
    success: data?.success ?? false,
    categories: data?.categories ?? [],
  };
}

/* ===========================
   SINGLE TOOL BY SLUG
=========================== */
export async function getToolBySlug(slug) {
  const data = await request(`/tools/${slug}`);

  return {
    success: data?.success ?? false,
    tool: data?.tool ?? null,
  };
}

/* ===========================
   RELATED TOOLS
=========================== */
export async function getRelatedTools(slug) {
  const data = await request(`/tools/${slug}/related`);

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
