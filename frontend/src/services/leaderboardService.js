import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches the top reviewers leaderboard.
 * @param {number} limit
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getTopReviewers = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/top-reviewers?limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching top reviewers:", error);
    return { success: false, data: [], message: error.message || "Failed to load top reviewers." };
  }
};

/**
 * Fetches the most active users leaderboard.
 * @param {number} limit
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getMostActiveUsers = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/most-active?limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching most active users:", error);
    return { success: false, data: [], message: error.message || "Failed to load most active users." };
  }
};

/**
 * Fetches the most liked reviews leaderboard.
 * @param {number} limit
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getMostLikedReviews = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/most-liked-reviews?limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching most liked reviews:", error);
    return { success: false, data: [], message: error.message || "Failed to load most liked reviews." };
  }
};

/**
 * Fetches the monthly leaderboard.
 * @param {number} limit
 * @param {string} month - Optional "YYYY-MM" to fetch a specific month.
 * @returns {Promise<{success: boolean, data?: Array, month?: string, message?: string}>}
 */
export const getMonthlyLeaderboard = async (limit = 10, month) => {
  try {
    const query = month ? `?limit=${limit}&month=${encodeURIComponent(month)}` : `?limit=${limit}`;
    const response = await fetch(`${API_BASE_URL}/leaderboard/monthly${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching monthly leaderboard:", error);
    return { success: false, data: [], message: error.message || "Failed to load monthly leaderboard." };
  }
};

/**
 * Toggles the current user's like on a review (requires auth).
 * @param {string} reviewId
 * @returns {Promise<{success: boolean, liked?: boolean, likeCount?: number, message?: string}>}
 */
export const toggleReviewLike = async (reviewId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/users/me/reviews/${reviewId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error toggling review like:", error);
    return { success: false, message: error.message || "Failed to update like." };
  }
};