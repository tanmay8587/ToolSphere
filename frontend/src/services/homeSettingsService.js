import axios from "axios";
import { getAdminToken } from "../utils/auth";

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

/* ==========================================
    UPDATE HOME SETTINGS (ADMIN)
    ========================================== */
export const updateHomeSettings = async (settings) => {
  const token = getAdminToken();

  const response = await fetch(`${API_URL}/admin/home-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
};
