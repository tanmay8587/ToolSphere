/* ==========================================
   ANONYMOUS VISITOR ID
   ==========================================
   Generates and persists a stable anonymous identifier for guest users so the
   backend can deduplicate blog views across refreshes / reopens / devices.

   - A UUID is generated ONCE and stored permanently in localStorage.
   - The same id is reused forever (per browser/device).
   - It is sent to the backend as the `X-Visitor-ID` request header.
   - The backend is the source of truth for counting; this id is only a key.
   - If localStorage is unavailable (private mode / SSR), a single id is
     generated and cached in memory for the lifetime of the page session so we
     NEVER regenerate a new id on every visit/call.
   ========================================== */

const VISITOR_ID_KEY = "toolsphere_visitor_id";

// In-memory fallback used only when localStorage is unavailable. Cached so the
// same id is reused for the entire session instead of being regenerated.
let cachedVisitorId = null;

/**
 * Generates a UUID, preferring the native crypto.randomUUID when available.
 * @returns {string}
 */
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers without crypto.randomUUID.
  return `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Returns a persistent anonymous visitor id, generating and storing one
 * in localStorage if it does not already exist. The same id is reused forever.
 * @returns {string}
 */
export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    cachedVisitorId = id; // keep in sync for the fallback path
    return id;
  } catch {
    // localStorage may be unavailable (private mode / SSR). Reuse a single
    // session-scoped id so we never regenerate one on every visit/call.
    if (!cachedVisitorId) {
      cachedVisitorId = generateId();
    }
    return cachedVisitorId;
  }
};