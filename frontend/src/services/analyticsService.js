import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const analyticsApi = axios.create({
  baseURL: `${API_URL}/analytics`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all analytics settings (public)
export const getAnalyticsSettings = async () => {
  try {
    const response = await analyticsApi.get("");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, settings: {} };
  }
};

// Get all analytics settings including all (admin only)
export const getAllAnalyticsSettings = async (token) => {
  try {
    const response = await analyticsApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an analytics setting (admin only)
export const updateAnalyticsSetting = async (token, key, value) => {
  try {
    const response = await analyticsApi.put(
      `/admin/${key}`,
      { value },
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

// Initialize default analytics settings (admin only)
export const initializeAnalyticsSettings = async (token) => {
  try {
    const response = await analyticsApi.post(
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