import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ===========================
   PUBLIC CATEGORY APIs
   =========================== */

/**
 * GET /api/blogs/categories
 * Get all categories (public)
 */
export const getAllCategories = async () => {
  try {
    const response = await api.get("/blogs/categories");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to fetch categories");
  }
};

/**
 * GET /api/blogs/categories/:id
 * Get single category by ID (public)
 */
export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/blogs/categories/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to fetch category");
  }
};

/* ===========================
   ADMIN CATEGORY APIs
   =========================== */

/**
 * POST /api/admin/categories
 * Create new category (admin only)
 */
export const createCategory = async (data) => {
  try {
    const response = await api.post("/admin/categories", data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to create category");
  }
};

/**
 * PUT /api/admin/categories/:id
 * Update category (admin only)
 */
export const updateCategory = async (id, data) => {
  try {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to update category");
  }
};

/**
 * DELETE /api/admin/categories/:id
 * Delete category (admin only)
 */
export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to delete category");
  }
};
