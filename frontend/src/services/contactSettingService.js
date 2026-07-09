import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const contactSettingApi = axios.create({
  baseURL: `${API_URL}/contact-settings`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all contact settings (public)
export const getContactSettings = async () => {
  try {
    const response = await contactSettingApi.get("");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, settings: {} };
  }
};

// Get all contact settings including all (admin only)
export const getAllContactSettings = async (token) => {
  try {
    const response = await contactSettingApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a contact setting (admin only)
export const updateContactSetting = async (token, key, value) => {
  try {
    const response = await contactSettingApi.put(
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

// Initialize default contact settings (admin only)
export const initializeContactSettings = async (token) => {
  try {
    const response = await contactSettingApi.post(
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

// Get footer settings (public)
export const getFooterSettings = async () => {
  try {
    const response = await contactSettingApi.get("/footer");
    return response.data;
  } catch (error) {
    // Return empty data instead of throwing - graceful error handling
    return { success: false, settings: {} };
  }
};