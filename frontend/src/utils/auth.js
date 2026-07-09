/* ==========================================
   AUTH UTILITIES
   ========================================== */

const USER_TOKEN_KEY = "userAuthToken";
const USER_KEY = "authUser";
const ADMIN_TOKEN_KEY = "adminToken";

/* Save user auth token */
export const saveToken = (token) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

/* Get user auth token */
export const getToken = () => {
  return localStorage.getItem(USER_TOKEN_KEY);
};

/* Save User */
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/* Get User */
export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

/* Remove user auth token + user */
export const logout = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/* Check user login - also verifies email is verified */
export const isLoggedIn = () => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  const user = getUser();
  // Only return true if both token exists AND user is verified
  return !!(token && user && user.isVerified === true);
};

/* Admin auth token helpers */
export const saveAdminToken = (token) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const getAdminToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

/* Check if user has a token (even if unverified) - for verification page access */
export const hasUserToken = () => {
  return !!localStorage.getItem(USER_TOKEN_KEY);
};
