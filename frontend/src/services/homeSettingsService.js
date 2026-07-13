import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const homeSettingsApi = axios.create({
  baseURL: `${API_URL}/home-settings`,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==========================================
   GET HOME SETTINGS (PUBLIC)
   ========================================== */
export const getHomeSettings = async () => {
  try {
    const response = await homeSettingsApi.get("/");
    return response.data;
  } catch (error) {
    console.error("Error fetching home settings:", error);
    throw error;
  }
};