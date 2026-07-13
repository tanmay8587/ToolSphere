import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
    Blogs
 =============================== */
export const getBlogById = (id) =>
  API.get(`/admin/blogs/${id}`);

export const addBlog = (data) =>
  API.post("/admin/blogs", data);

export const updateBlog = (id, data) =>
  API.put(`/admin/blogs/${id}`, data);

/* ===============================
    Image Deletion (Cloudinary)
    Extracts the public_id from a Cloudinary URL and
    deletes the asset via the existing /upload endpoint.
 =============================== */
export const deleteImage = async (url) => {
  if (!url) return;

  try {
    // Cloudinary URLs look like:
    // https://res.cloudinary.com/<cloud>/image/upload/v123/folder/name.jpg
    // The public_id is "folder/name" (without extension).
    const marker = "/image/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return;

    const after = url.slice(idx + marker.length);
    const withoutVersion = after.replace(/^v\d+\//, "");
    const publicId = withoutVersion.replace(/\.[^./\\]+$/, "");

    if (!publicId) return;

    await API.delete("/upload/", { data: { publicId } });
  } catch (err) {
    // Non-blocking: deletion failures should not break the form flow.
    console.error("Failed to delete image from Cloudinary:", err);
  }
};

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
