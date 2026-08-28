import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches the list of pending tool submissions for moderation.
 * @param {object} [params]
 * @param {number} [params.page=1] - Page number.
 * @param {number} [params.limit=20] - Items per page.
 * @returns {Promise<{success: boolean, tools?: Array, pagination?: object, message?: string}>}
 */
export const getPendingSubmissions = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const token = getToken();
    if (!token) return { success: false, tools: [], message: "Authentication required." };

    const query = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();

    const response = await fetch(`${API_BASE_URL}/moderation/pending?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    return { success: false, tools: [], message: error.message || "Failed to fetch pending submissions." };
  }
};

/**
 * Approves a pending tool submission.
 * @param {string} id - The tool ID.
 * @returns {Promise<{success: boolean, tool?: object, message?: string}>}
 */
export const approveSubmission = async (id) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/moderation/${id}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error approving submission:", error);
    return { success: false, message: error.message || "Failed to approve submission." };
  }
};

/**
 * Rejects a pending tool submission.
 * @param {string} id - The tool ID.
 * @param {string} [reason] - Optional rejection reason.
 * @returns {Promise<{success: boolean, tool?: object, message?: string}>}
 */
export const rejectSubmission = async (id, reason = "") => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/moderation/${id}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error rejecting submission:", error);
    return { success: false, message: error.message || "Failed to reject submission." };
  }
};

/**
 * Requests changes for a pending tool submission.
 * @param {string} id - The tool ID.
 * @param {string} note - The change request note (required by the backend).
 * @returns {Promise<{success: boolean, tool?: object, message?: string}>}
 */
export const requestChanges = async (id, note) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/moderation/${id}/request-changes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error requesting changes:", error);
    return { success: false, message: error.message || "Failed to request changes." };
  }
};