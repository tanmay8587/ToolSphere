import Tool from "../models/Tool.js";
import Category from "../models/Category.js";
import Newsletter from "../models/Newsletter.js";
import Visitor from "../models/Visitor.js";
import logger from "../utils/logger.js";

/* =====================================
   GET STATISTICS
   ===================================== */

export const getStatistics = async (req, res) => {
  try {
    // Get total active tools
    const totalTools = await Tool.countDocuments({
      approved: true,
      isDeleted: false,
      status: "active",
    });

    // Get total categories
    const totalCategories = await Category.countDocuments({ isActive: true });

    // Get total active newsletter subscribers
    const totalSubscribers = await Newsletter.countDocuments({ status: "active" });

    // Get current month's unique visitors
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();

    const monthlyVisitors = await Visitor.countDocuments({
      visitMonth: currentMonth,
      visitYear: currentYear,
      isUnique: true,
    });

    res.json({
      success: true,
      statistics: {
        totalTools,
        totalCategories,
        monthlyVisitors,
        totalSubscribers,
      },
    });
  } catch (err) {
    logger.error("Error fetching statistics:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

/* =====================================
   TRACK VISITOR (Legacy endpoint)
   ===================================== */

/**
 * Legacy track visitor endpoint - kept for backward compatibility
 * Note: Primary tracking is now handled by middleware
 * This endpoint is kept for frontend compatibility
 */
export const trackVisitor = async (req, res) => {
  try {
    // Visitor tracking is now handled by middleware
    // This endpoint is kept for backward compatibility with frontend
    // The middleware already tracks the visitor before this is called
    
    res.json({
      success: true,
      message: "Visitor tracking handled by middleware",
    });
  } catch (err) {
    logger.error("Error tracking visitor:", err);
    res.status(500).json({
      success: false,
      message: "Failed to track visitor",
    });
  }
};
