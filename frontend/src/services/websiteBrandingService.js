import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const websiteBrandingApi = axios.create({
  baseURL: `${API_URL}/website-branding`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all branding settings (public)
export const getBrandingSettings = async () => {
  try {
    const response = await websiteBrandingApi.get("");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, settings: {} };
  }
};

// Get all branding settings including all (admin only)
export const getAllBrandingSettings = async (token) => {
  try {
    const response = await websiteBrandingApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a branding setting (admin only)
export const updateBrandingSetting = async (token, key, value) => {
  try {
    const response = await websiteBrandingApi.put(
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

// Initialize default branding settings (admin only)
export const initializeBrandingSettings = async (token) => {
  try {
    const response = await websiteBrandingApi.post(
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