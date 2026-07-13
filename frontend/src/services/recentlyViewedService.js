import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Adds a tool to the user's recently viewed tools list
 * @param {string} toolId - The ID of the tool to add
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const addViewedTool = async (toolId) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Authentication required." };
    }

    const response = await fetch(`${API_BASE_URL}/users/me/viewed-tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toolId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding viewed tool:", error);
    return { success: false, message: error.message || "Failed to add viewed tool." };
  }
};

/**
 * Fetches the user's recently viewed tools
 * @returns {Promise<{success: boolean, recentlyViewedTools: Array, total: number}>}
 */
export const getRecentlyViewedTools = async () => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, recentlyViewedTools: [], total: 0 };
    }

    const response = await fetch(`${API_BASE_URL}/users/me/recently-viewed-tools`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recently viewed tools:", error);
    return { success: false, recentlyViewedTools: [], total: 0 };
  }
};

/**
 * Adds a blog to the user's recently viewed blogs list
 * @param {string} blogId - The ID of the blog to add
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const addViewedBlog = async (blogId) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Authentication required." };
    }

    const response = await fetch(`${API_BASE_URL}/users/me/viewed-blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ blogId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding viewed blog:", error);
    return { success: false, message: error.message || "Failed to add viewed blog." };
  }
};

/**
 * Fetches the user's recently viewed blogs
 * @returns {Promise<{success: boolean, recentlyViewedBlogs: Array, total: number}>}
 */
export const getRecentlyViewedBlogs = async () => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, recentlyViewedBlogs: [], total: 0 };
    }

    const response = await fetch(`${API_BASE_URL}/users/me/recently-viewed-blogs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recently viewed blogs:", error);
    return { success: false, recentlyViewedBlogs: [], total: 0 };
  }
};
