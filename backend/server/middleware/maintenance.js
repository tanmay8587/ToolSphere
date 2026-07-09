import MaintenanceSetting from "../models/MaintenanceSetting.js";
import logger from "../utils/logger.js";

/* ==========================================
   MAINTENANCE MODE MIDDLEWARE
   - Checks if maintenance mode is enabled
   - Allows admin routes and login to pass through
   - Returns maintenance response for other requests
========================================== */
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes and auth routes
    const isExcludedPath = 
      req.path.startsWith("/api/admin") ||
      req.path.startsWith("/api/auth") ||
      req.path === "/api/health" ||
      req.path === "/api/maintenance/status" ||
      req.path.startsWith("/api/maintenance");

    if (isExcludedPath) {
      return next();
    }

    // Check for admin token in headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // If there's a valid admin token, allow access
      return next();
    }

    // Get maintenance setting
    const setting = await MaintenanceSetting.findOne({ key: "maintenance_mode" });

    if (setting && setting.isEnabled) {
      // Return JSON response for maintenance mode
      return res.status(503).json({
        success: false,
        message: "Website is under maintenance",
        maintenance: {
          isEnabled: true,
          message: setting.message,
          estimatedTime: setting.estimatedTime,
        },
      });
    }

    next();
  } catch (err) {
    // Log the error
    logger.error("Maintenance mode check failed:", err);
    
    // Fail closed: Default to maintenance mode if check fails
    // This is safer than allowing access when the check fails
    return res.status(503).json({
      success: false,
      message: "Website is under maintenance",
      maintenance: {
        isEnabled: true,
        message: "Maintenance mode check failed. Please try again later.",
        estimatedTime: null,
      },
    });
  }
};

export default checkMaintenanceMode;
