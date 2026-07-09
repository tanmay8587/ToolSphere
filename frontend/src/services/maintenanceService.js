import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   Request Interceptor
   =============================== */
API.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ===============================
   Get Maintenance Status (Public)
   =============================== */
export const getMaintenanceStatus = async () => {
  try {
    const response = await API.get("/maintenance/status");
    return response.data;
  } catch (error) {
    // Return default values instead of throwing - graceful error handling
    return { success: false, isEnabled: false, message: "" };
  }
};

/* ===============================
   Toggle Maintenance Mode (Admin)
   =============================== */
export const toggleMaintenanceMode = (data) =>
  API.put("/admin/maintenance/toggle", data);

/* ===============================
   Update Maintenance Settings (Admin)
   =============================== */
export const updateMaintenanceSettings = (data) =>
  API.put("/admin/maintenance/settings", data);

/* ===============================
   Default Export
   =============================== */
export default API;