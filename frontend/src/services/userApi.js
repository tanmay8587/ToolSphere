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

// Response interceptor to handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 – user not found / invalid token / deleted account
    if (error.response?.status === 401) {
      logout();
      // Dispatch event so Layout/navbar updates its auth state immediately
      window.dispatchEvent(new Event("auth-change"));
      // Store a toast message that Layout will pick up on next mount
      sessionStorage.setItem("authToast", "Your account has been deleted. Please sign in again.");
      window.location.href = "/login?deleted=true";
    } else if (error.response?.status === 403) {
      // Log out unverified users automatically
      logout();
      window.dispatchEvent(new Event("auth-change"));
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
export const getLikedBlogs = () => API.get("/users/me/liked-blogs");

// Email verification
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const resendVerificationEmail = (email) => API.post("/auth/resend-verification", { email });

export default API;