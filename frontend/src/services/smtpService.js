import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const smtpApi = axios.create({
  baseURL: `${API_URL}/smtp`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for SMTP requests
});

// Get all SMTP settings (admin only)
export const getAllSmtpSettings = async (token) => {
  try {
    const response = await smtpApi.get("/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a SMTP setting (admin only)
export const updateSmtpSetting = async (token, key, value) => {
  try {
    const response = await smtpApi.put(
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

// Initialize default SMTP settings (admin only)
export const initializeSmtpSettings = async (token) => {
  try {
    const response = await smtpApi.post(
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

// Send test email (admin only)
export const sendTestEmail = async (token, testEmail) => {
  try {
    const response = await smtpApi.post(
      "/admin/test",
      { testEmail },
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