import ActivityLog from "../models/ActivityLog.js";
import logger from "../utils/logger.js";

/* =====================================
   ADMIN - GET ACTIVITY LOGS
   GET /admin/activity-logs
   Supports pagination, search, action filter,
   resource filter, and date sorting.
   ===================================== */
export const getActivityLogs = async (req, res) => {
  try {
    const {
      search = "",
      action = "All",
      resource = "All",
      sort = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    const filters = {};

    // Search across adminName, action, resource, and details
    if (typeof search === "string" && search.trim()) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { adminName: { $regex: escapedSearch, $options: "i" } },
        { action: { $regex: escapedSearch, $options: "i" } },
        { resource: { $regex: escapedSearch, $options: "i" } },
        { details: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Action filter
    if (action && action !== "All") {
      filters.action = action;
    }

    // Resource filter
    if (resource && resource !== "All") {
      filters.resource = resource;
    }

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNumber - 1) * limitNumber;

    // Date sorting (createdAt)
    const sortDirection = sort === "asc" ? 1 : -1;

    const [total, logs] = await Promise.all([
      ActivityLog.countDocuments(filters),
      ActivityLog.find(filters)
        .sort({ createdAt: sortDirection })
        .skip(skip)
        .limit(limitNumber),
    ]);

    res.json({
      success: true,
      logs,
      total,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    logger.error("[getActivityLogs] Error fetching activity logs:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};