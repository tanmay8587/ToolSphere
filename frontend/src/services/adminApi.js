import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   Upload Image API
=============================== */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return API.post("/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

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
   Auth APIs
=============================== */
export const loginAdmin = (data) =>
  API.post("/admin/login", data);

export const getProfile = () =>
  API.get("/admin/profile");

export const updateProfile = (data) =>
  API.put("/admin/profile", data);

export const changePassword = (data) =>
  API.put("/admin/change-password", data);

export const adminSearch = (q) =>
  API.get(`/admin/search?q=${encodeURIComponent(q)}`);

export const getDashboard = () =>
  API.get("/admin/dashboard");

/* ===============================
   Categories
=============================== */
export const getCategories = () =>
  API.get("/admin/categories");

export const createCategory = (data) =>
  API.post("/admin/categories", data);

export const updateCategory = (id, data) =>
  API.put(`/admin/categories/${id}`, data);

export const deleteCategory = (id) =>
  API.delete(`/admin/categories/${id}`);

export const toggleCategoryActive = (id, isActive) =>
  API.put(`/admin/categories/${id}/toggle`, { isActive });

/* ===============================
   Users
================================ */
export const getAdminUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return API.get(`/admin/users${query ? `?${query}` : ""}`);
};

export const deleteUser = (id) =>
  API.delete(`/admin/users/${id}`);

/* ===============================
   Tools
=============================== */
export const getAllTools = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return API.get(`/admin/tools${query ? `?${query}` : ""}`);
};

export const getToolById = (id) =>
  API.get(`/admin/tools/${id}`);

export const addTool = (data) =>
  API.post("/admin/tools", data);

export const updateTool = (id, data) =>
  API.put(`/admin/tools/${id}`, data);

export const deleteTool = (id) =>
  API.delete(`/admin/tools/${id}`);

export const approveTool = (id) =>
  API.put(`/admin/tools/${id}/approve`);

export const rejectTool = (id, data = {}) =>
  API.put(`/admin/tools/${id}/reject`, data);

export const featureTool = (id) =>
  API.put(`/admin/tools/${id}/feature`);

/* ===============================
   BACKUP / EXPORT
=============================== */
export const exportSettingsData = () =>
  API.get("/admin/export/settings");

export const exportToolsData = () =>
  API.get("/admin/export/tools");

export const exportCategoriesData = () =>
  API.get("/admin/export/categories");

export const exportUsersData = () =>
  API.get("/admin/export/users");

/* ===============================
   Newsletter
=============================== */
export const getSubscribers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return API.get(`/newsletter/subscribers${query ? `?${query}` : ""}`);
};

export const deleteSubscriber = (id) =>
  API.delete(`/newsletter/subscribers/${id}`);

/* ===============================
   Default Export
=============================== */
export default API;
