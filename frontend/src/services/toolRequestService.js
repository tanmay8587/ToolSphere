import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Submits a new tool request on behalf of the logged-in user.
 * @param {{ toolName: string, website?: string, category: string, description?: string }} payload
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const submitToolRequest = async (payload) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/tool-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting tool request:", error);
    return { success: false, message: error.message || "Failed to submit tool request." };
  }
};