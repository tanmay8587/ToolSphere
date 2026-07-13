const API_BASE = import.meta.env.VITE_API_URL;

import { isLoggedIn, getAdminToken } from "../utils/auth";

/* ===========================
   SAFE REQUEST WRAPPER
   =========================== */
async function request(path, options = {}) {
  // Admin endpoints must be authorized with the admin token. Public
  // endpoints (subscribe/unsubscribe) fall back to the user token.
  const token = options.token || localStorage.getItem("userAuthToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

/* ===========================
   SUBSCRIBE TO NEWSLETTER
   =========================== */
export async function subscribeToNewsletter(email, source = "website") {
  const body = { source };

  // Only include email for guest users. Logged-in users are identified by their
  // auth token on the backend (req.user.email), so no email field is sent.
  if (!isLoggedIn()) {
    body.email = email;
  }

  return request("/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ===========================
    UNSUBSCRIBE FROM NEWSLETTER
=========================== */
export async function unsubscribeFromNewsletter(email) {
  return request("/newsletter/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/* ===========================
    VERIFY NEWSLETTER SUBSCRIPTION
=========================== */
export async function verifyNewsletter(token) {
  return request(`/newsletter/verify/${token}`, {
    method: "GET",
  });
}

/* ===========================
   GET SUBSCRIBERS (ADMIN)
   =========================== */
export async function getSubscribers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/newsletter/subscribers${query ? `?${query}` : ""}`, {
    token: getAdminToken(),
  });
}

/* ===========================
    DELETE SUBSCRIBER (ADMIN)
    =========================== */
export async function deleteSubscriber(id) {
  return request(`/newsletter/subscribers/${id}`, {
    method: "DELETE",
    token: getAdminToken(),
  });
}

/* ===========================
    RESEND VERIFICATION (ADMIN)
    =========================== */
export async function resendVerification(id) {
  return request(`/newsletter/subscribers/${id}/resend-verification`, {
    method: "POST",
    token: getAdminToken(),
  });
}

/* ===========================
    GET NEWSLETTER STATS (ADMIN)
    =========================== */
export async function getNewsletterStats() {
  return request(`/newsletter/stats`, {
    token: getAdminToken(),
  });
}
