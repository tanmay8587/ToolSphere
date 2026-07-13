import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const seoApi = axios.create({
  baseURL: `${API_URL}/seo`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all SEO settings (public)
export const getSeoSettings = async () => {
  try {
    const response = await seoApi.get("");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, settings: {} };
  }
};

// Get all SEO settings including all (admin only)
export const getAllSeoSettings = async (token) => {
  try {
    const response = await seoApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a SEO setting (admin only)
export const updateSeoSetting = async (token, key, value) => {
  try {
    const response = await seoApi.put(
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

// Initialize default SEO settings (admin only)
export const initializeSeoSettings = async (token) => {
  try {
    const response = await seoApi.post(
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