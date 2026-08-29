import axios from "axios";
import { getToken, logout } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
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
  (response) => {
    console.log({ authStep: "AUTH_RESPONSE", status: response.status, authenticated: response.data?.success });
    return response;
  },
  (error) => {
    const responseStatus = error.response?.status;
    const responseCode = error.response?.data?.code;
    const responseMessage = error.response?.data?.message || "Authentication failed.";

    console.log({ authStep: "AUTH_RESPONSE", status: responseStatus, authenticated: false, code: responseCode, message: responseMessage });

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.response = {
        status: 408,
        data: { success: false, code: "EMAIL_SEND_TIMEOUT", message: "The email request timed out. Please try again." },
      };
    }

    if (responseStatus === 401 && responseCode === "USER_NOT_FOUND") {
      logout();
      window.dispatchEvent(new Event("auth-change"));
      sessionStorage.setItem("authToast", "Your account no longer exists. Please sign in again.");
      window.location.href = "/login?deleted=true";
    } else if (responseStatus === 401) {
      logout();
      window.dispatchEvent(new Event("auth-change"));
      sessionStorage.setItem("authToast", "Your session has expired. Please sign in again.");
      window.location.href = "/login?session=expired";
    } else if (responseStatus === 403) {
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
export const verifyResetToken = (token) => API.get(`/auth/verify-reset-token/${token}`);
export const getProfile = () => API.get("/auth/profile");
export const getMembership = () => API.get("/auth/membership");
export const createCheckout = () => API.post("/payments/checkout");
export const markPaymentSuccess = (data) => API.post("/payments/success", data);
export const markPaymentFailed = (data) => API.post("/payments/failed", data);
export const cancelSubscription = () => API.post("/payments/cancel");
export const refreshSubscriptionState = () => API.post("/payments/refresh");
export const updateProfile = (data) => API.put("/auth/profile", data);
export const updateNewsletterPreference = (newsletterEnabled) =>
  API.put("/auth/newsletter-preference", { newsletterEnabled });
export const changePassword = (data) => API.put("/auth/change-password", data);
export const deleteAccount = (password) => API.delete("/auth/account", { password });
export const bookmarkTool = (toolId) => API.post(`/auth/tools/${toolId}/bookmark`);
export const reviewTool = (toolId, data) => API.post(`/auth/tools/${toolId}/review`, data);
export const getLikedBlogs = () => API.get("/users/me/liked-blogs");

// Email verification
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const resendVerificationEmail = (email) => API.post("/auth/resend-verification", { email });

export default API;