/* ==========================================
   ANONYMOUS VISITOR ID
   ==========================================
   Generates and persists a stable anonymous identifier for guest users so the
   backend can deduplicate blog views across refreshes / reopens / devices.

   - Stored in localStorage under VISITOR_ID_KEY.
   - Generated once and reused forever (per browser/device).
   - Sent to the backend as the `X-Visitor-ID` request header.
   - The backend is the source of truth for counting; this id is only a key.
   ========================================== */

const VISITOR_ID_KEY = "toolsphere_visitor_id";

/**
 * Returns a persistent anonymous visitor id, generating and storing one
 * in localStorage if it does not already exist.
 * @returns {string}
 */
export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      // crypto.randomUUID is available in all modern browsers and secure contexts.
      id =
        (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
        `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage may be unavailable (private mode / SSR). Fall back to a
    // session-scoped id so the request still carries a header.
    return `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};