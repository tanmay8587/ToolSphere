import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ===========================
   GET STATISTICS
   =========================== */

export const getStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
};

/* ===========================
   TRACK VISITOR
   =========================== */

/**
 * Track visitor - kept for backward compatibility
 * Note: Primary tracking is now handled by backend middleware
 * This function is kept for any frontend code that may call it
 */
export const trackVisitor = async () => {
  try {
    // Visitor tracking is now handled automatically by backend middleware
    // This function is kept for backward compatibility
    // No need to send tracking data - middleware handles it automatically
    
    // Return success for any code that awaits this function
    return { success: true };
  } catch (error) {
    // Silently fail - don't block the user experience
    console.error("Error tracking visitor:", error);
    return { success: false };
  }
};

/* ===========================
   HELPER FUNCTIONS
   =========================== */

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};