import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Submits a tool claim (company -> owns a tool listing) on behalf of the
 * logged-in user, including verification details for admin review.
 *
 * @param {{
 *   tool: string,
 *   companyName: string,
 *   contactEmail: string,
 *   companyWebsite?: string,
 *   role?: string,
 *   verificationDetails?: string,
 * }} payload
 * @returns {Promise<{success: boolean, message: string, data?: object}>}
 */
export const submitToolClaim = async (payload) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/tool-claims`, {
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
    console.error("Error submitting tool claim:", error);
    return { success: false, message: error.message || "Failed to submit tool claim." };
  }
};

/**
 * Fetches the tool claims submitted by the current user.
 * @returns {Promise<{success: boolean, data?: object[], message?: string}>}
 */
export const getMyToolClaims = async () => {
  try {
    const token = getToken();
    if (!token) return { success: false, data: [], message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/tool-claims/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tool claims:", error);
    return { success: false, data: [], message: error.message || "Failed to fetch tool claims." };
  }
};