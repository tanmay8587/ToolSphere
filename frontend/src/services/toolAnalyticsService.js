import axios from "axios";
import { getVisitorId } from "../utils/visitorId.js";
import { getToken, getAdminToken } from "../utils/auth.js";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

/* ===========================
   VIEWS
   =========================== */

/**
 * Record a unique tool view.
 * Sends the persistent anonymous visitor id (X-Visitor-ID) and, when present,
 * the user auth token so the backend can deduplicate the view correctly.
 */
export const recordToolView = async (slug) => {
  try {
    const headers = { "X-Visitor-ID": getVisitorId() };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await API.post(`/tool-analytics/${slug}/view`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error("[toolAnalyticsService] recordToolView failed:", error);
    return { success: false, counted: false, views: 0 };
  }
};

/* ===========================
   CLICKS
   =========================== */

/**
 * Record a tool click (Visit Website). Fire-and-forget friendly: returns the
 * updated click total but never throws so UI navigation is never blocked.
 */
export const trackToolClick = async (slug) => {
  try {
    const headers = { "X-Visitor-ID": getVisitorId() };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await API.post(`/tool-analytics/${slug}/click`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error("[toolAnalyticsService] trackToolClick failed:", error);
    return { success: false };
  }
};

/* ===========================
   LIKES
   =========================== */

/** Toggle like/unlike for the logged-in user. Requires a user auth token. */
export const toggleToolLike = async (slug) => {
  const token = getToken();
  if (!token) {
    return { success: false, message: "Authentication required." };
  }

  try {
    const response = await API.post(
      `/tool-analytics/${slug}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("[toolAnalyticsService] toggleToolLike failed:", error);
    throw error;
  }
};

/* ===========================
   ADMIN - ANALYTICS
   =========================== */

/**
 * Admin: aggregate analytics across all tools (Views, Clicks, Saves, Likes)
 * plus a 30-day traffic chart.
 */
export const getAllToolsAnalytics = async () => {
  const token = getAdminToken();
  const response = await API.get("/tool-analytics/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Admin: analytics for a single tool (summary metrics + 30-day traffic chart).
 */
export const getToolAnalytics = async (slug) => {
  const token = getAdminToken();
  const response = await API.get(`/tool-analytics/admin/${slug}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export default API;
