import axios from "axios";
import { getToken } from "../utils/auth";

/**
 * Company Dashboard API service.
 *
 * Talks to the `/api/company` endpoints which require an authenticated
 * (verified) user. Reuses the existing user token from utils/auth.
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the user JWT to every request.
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------- Overview ---------- */
export const getCompanyOverview = () => API.get("/company/overview");

/* ---------- Claimed tools ---------- */
export const getCompanyTools = () => API.get("/company/tools");
export const getCompanyTool = (id) => API.get(`/company/tools/${id}`);
export const updateCompanyTool = (id, data) => API.put(`/company/tools/${id}`, data);

/* ---------- Analytics ---------- */
export const getCompanyAnalytics = () => API.get("/company/analytics");

/* ---------- Team members ---------- */
export const getTeamMembers = () => API.get("/company/team");
export const inviteTeamMember = (data) => API.post("/company/team", data);
export const updateTeamMember = (id, data) => API.put(`/company/team/${id}`, data);
export const removeTeamMember = (id) => API.delete(`/company/team/${id}`);

export default API;
