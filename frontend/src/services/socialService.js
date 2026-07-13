import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const socialApi = axios.create({
  baseURL: `${API_URL}/social`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all active social links (public)
export const getSocialLinks = async () => {
  try {
    const response = await socialApi.get("");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, socialLinks: [] };
  }
};

// Get all social links including inactive (admin only)
export const getAllSocialLinks = async (token) => {
  try {
    const response = await socialApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a social link (admin only)
export const updateSocialLink = async (token, platform, data) => {
  try {
    const response = await socialApi.put(
      `/admin/${platform}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Initialize default social links (admin only)
export const initializeSocialLinks = async (token) => {
  try {
    const response = await socialApi.post(
      "/admin/initialize",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};