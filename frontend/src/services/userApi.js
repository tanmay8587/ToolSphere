import axios from "axios";
import { getToken, logout } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
API.interceptors.request.use((config) => {
  const token = getToken();
  // Skip adding Authorization header for verify-email endpoint (public endpoint)
  if (token && !config.url.includes('/verify-email')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Log out unverified users automatically
      logout();
    } else if (
      error.response?.status === 401 &&
      error.response?.data?.message === "User account not found."
    ) {
      // User was deleted by admin — clear auth and redirect to login
      logout();
      window.location.href = "/login?deleted=true";
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const googleAuth = (data) => API.post("/auth/google", data);
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);
export const resetPassword = (token, data) => API.put(`/auth/reset-password/${token}`, data);
export const getProfile = () => API.get("/auth/profile");
export const updateProfile = (data) => API.put("/auth/profile", data);
export const updateNewsletterPreference = (newsletterEnabled) =>
  API.put("/auth/newsletter-preference", { newsletterEnabled });
export const bookmarkTool = (toolId) => API.post(`/auth/tools/${toolId}/bookmark`);
export const reviewTool = (toolId, data) => API.post(`/auth/tools/${toolId}/review`, data);

// Email verification
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const resendVerificationEmail = (email) => API.post("/auth/resend-verification", { email });

export default API;
