import Tool from "../models/Tool.js";
import ToolAnalytics from "../models/ToolAnalytics.js";
import Bookmark from "../models/Bookmark.js";
import logger from "../utils/logger.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/* =====================================
   VIEW TRACKING HELPERS
   ===================================== */

// A viewer is counted at most once within this time window (mirrors blog views).
const VIEW_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRAFFIC_CHART_DAYS = 30;

/**
 * Resolves a published, non-deleted tool by slug.
 */
const resolveToolBySlug = async (slug) => {
  return Tool.findOne({ slug, isDeleted: false });
};

/**
 * Records a unique view for a tool using backend-enforced dedup.
 *
 * - Logged-in users are deduped by (toolId + userId) within the last 24h.
 * - Guests are deduped by (toolId + visitorId) within the last 24h.
 *
 * If this viewer already viewed the tool in the window, no counter is
 * incremented (returns counted:false). Otherwise a ToolAnalytics 'view' event
 * is created and Tool.views is atomically incremented.
 *
 * @returns {{ counted: boolean, views: number }}
 */
const recordUniqueView = async (tool, userId, visitorId) => {
  const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
  const query = {
    tool: tool._id,
    action: "view",
    createdAt: { $gte: since },
  };

  if (userId) {
    query.user = userId;
    query.visitorId = null;
  } else if (visitorId) {
    query.user = null;
    query.visitorId = visitorId;
  } else {
    query.user = null;
    query.visitorId = null;
  }

  // 1) Check whether this viewer already viewed the tool in the last 24h.
  const existing = await ToolAnalytics.findOne(query);
  if (existing) {
    return { counted: false, views: tool.views || 0 };
  }

  // 2) Create the view event. If a concurrent request already inserted one,
  //    treat it as a duplicate (no increment).
  try {
    await ToolAnalytics.create({
      tool: tool._id,
      action: "view",
      user: userId || null,
      visitorId: visitorId || null,
    });
  } catch (err) {
    if (err && err.code !== 11000) {
      logger.error("[recordUniqueView] Failed to record tool view:", err);
    }
    return { counted: false, views: tool.views || 0 };
  }

  // 3) Genuinely new unique view -> increment the tool's counter atomically.
  const updated = await Tool.findByIdAndUpdate(
    tool._id,
    { $inc: { views: 1 } },
    { new: true }
  );

  return {
    counted: true,
    views: updated ? updated.views : (tool.views || 0) + 1,
  };
};

/**
 * Builds a date map for the last `days` days (default 30) used to backfill
 * days with zero events so the traffic chart renders a continuous axis.
 *
 * @returns {Array<{date: string, views: number, clicks: number, likes: number, saves: number}>}
 */
const buildEmptyDateMap = (days = TRAFFIC_CHART_DAYS) => {
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, views: 0, clicks: 0, likes: 0, saves: 0 };
  }
  return map;
};

/**
 * Aggregates ToolAnalytics (view/click/like) + Bookmark (save) events for the
 * given tools (or all tools when toolIds is null) into a 30-day time series.
 *
 * @param {Array|null} toolIds - Restrict to these tool ids, or null for all.
 * @returns {Promise<Array<{date, views, clicks, likes, saves}>>}
 */
const buildTrafficChart = async (toolIds = null, days = TRAFFIC_CHART_DAYS) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const dateMap = buildEmptyDateMap(days);

  const match = {
    createdAt: { $gte: since },
    action: { $in: ["view", "click", "like"] },
  };
  if (toolIds && toolIds.length) {
    match.tool = { $in: toolIds };
  }

  // Aggregate view / click / like events from the analytics event log.
  const eventResults = await ToolAnalytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          action: "$action",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  eventResults.forEach((r) => {
    const key = r._id.date;
    if (dateMap[key] && r._id.action in dateMap[key]) {
      dateMap[key][r._id.action] = r.count;
    }
  });

  // Aggregate save events from the Bookmark model (each bookmark creation = 1 save).
  const bookmarkMatch = { createdAt: { $gte: since } };
  if (toolIds && toolIds.length) {
    bookmarkMatch.tool = { $in: toolIds };
  }

  const saveResults = await Bookmark.aggregate([
    { $match: bookmarkMatch },
    {
      $group: {
        _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
        count: { $sum: 1 },
      },
    },
  ]);

  saveResults.forEach((r) => {
    const key = r._id.date;
    if (dateMap[key]) {
      dateMap[key].saves = r.count;
    }
  });

  return Object.values(dateMap);
};

/* =====================================
   PUBLIC - POST /api/tool-analytics/:slug/view
   Records a unique tool view (backend-enforced dedup, like blog views).
   ===================================== */

export const viewTool = async (req, res) => {
  try {
    const tool = await resolveToolBySlug(req.params.slug);
    if (!tool) {
      return sendErrorResponse(res, 404, "Tool not found");
    }

    const userId = req.user?.id || null;
    const visitorId = req.headers["x-visitor-id"] || null;

    const { counted, views } = await recordUniqueView(tool, userId, visitorId);

    return res.json({
      success: true,
      counted,
      views,
    });
  } catch (err) {
    logger.error("[viewTool] Error recording tool view:", err);
    return sendErrorResponse(res, 500, "Failed to record tool view");
  }
};

/* =====================================
   PUBLIC - POST /api/tool-analytics/:slug/click
   Increments the tool's click counter (Visit Website) and logs a 'click'
   event for traffic-chart aggregation.
   ===================================== */

export const clickTool = async (req, res) => {
  try {
    const tool = await resolveToolBySlug(req.params.slug);
    if (!tool) {
      return sendErrorResponse(res, 404, "Tool not found");
    }

    const updated = await Tool.findByIdAndUpdate(
      tool._id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    // Log the click event for time-series aggregation (non-blocking).
    const userId = req.user?.id || null;
    const visitorId = req.headers["x-visitor-id"] || null;
    ToolAnalytics.create({
      tool: tool._id,
      action: "click",
      user: userId,
      visitorId: visitorId,
    }).catch((err) => {
      logger.error("[clickTool] Failed to log click event:", err);
    });

    return res.json({
      success: true,
      clicks: updated ? updated.clicks : (tool.clicks || 0) + 1,
    });
  } catch (err) {
    logger.error("[clickTool] Error recording click:", err);
    return sendErrorResponse(res, 500, "Failed to record click");
  }
};

/* =====================================
   USER - POST /api/tool-analytics/:slug/like
   Toggles the current user's like for a tool (idempotent). A 'like' event is
   logged only when a like is added (used for the likes traffic chart).
   ===================================== */

export const toggleToolLike = async (req, res) => {
  try {
    const tool = await resolveToolBySlug(req.params.slug);
    if (!tool) {
      return sendErrorResponse(res, 404, "Tool not found");
    }

    const userId = req.user.id.toString();
    const alreadyLiked = tool.likedBy?.some((uid) => uid.toString() === userId);

    let liked;
    if (alreadyLiked) {
      // Toggle OFF
      tool.likedBy = tool.likedBy.filter((uid) => uid.toString() !== userId);
      tool.likes = Math.max(0, (tool.likes || 0) - 1);
      liked = false;
    } else {
      // Toggle ON (guard prevents duplicate likes)
      tool.likedBy.push(userId);
      tool.likes = (tool.likes || 0) + 1;
      liked = true;
    }

    await tool.save();

    if (liked) {
      // Log a 'like' event for time-series aggregation (non-blocking).
      ToolAnalytics.create({
        tool: tool._id,
        action: "like",
        user: userId,
        visitorId: null,
      }).catch((err) => {
        logger.error("[toggleToolLike] Failed to log like event:", err);
      });
    }

    logger.info(`[toggleToolLike] User ${userId} ${liked ? "liked" : "unliked"} tool ${req.params.slug}`);

    return res.json({
      success: true,
      liked,
      totalLikes: tool.likes || 0,
    });
  } catch (err) {
    logger.error("[toggleToolLike] Error toggling like:", err);
    return sendErrorResponse(res, 500, "Failed to toggle like");
  }
};

/* =====================================
   ADMIN - GET /api/tool-analytics/admin/analytics
   Returns every tool with its engagement metrics (Views, Clicks, Saves,
   Likes) plus an aggregate 30-day traffic chart across all tools.
   ===================================== */

export const getAllToolsAnalytics = async (req, res) => {
  try {
    const tools = await Tool.find({ isDeleted: false })
      .select(
        "name slug logo category pricing featured views clicks bookmarkCount likes rating createdAt"
      )
      .lean();

    const totals = tools.reduce(
      (acc, t) => {
        acc.views += t.views || 0;
        acc.clicks += t.clicks || 0;
        acc.saves += t.bookmarkCount || 0;
        acc.likes += t.likes || 0;
        return acc;
      },
      { views: 0, clicks: 0, saves: 0, likes: 0 }
    );

    // Aggregate traffic chart across ALL tools.
    const traffic = await buildTrafficChart(null, TRAFFIC_CHART_DAYS);

    return res.json({
      success: true,
      totals,
      traffic,
      tools: tools.map((t) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        logo: t.logo || "",
        category: t.category,
        pricing: t.pricing,
        featured: t.featured,
        views: t.views || 0,
        clicks: t.clicks || 0,
        saves: t.bookmarkCount || 0,
        likes: t.likes || 0,
        rating: t.rating || 0,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    logger.error("[getAllToolsAnalytics] Error:", err);
    return sendErrorResponse(res, 500, "Failed to fetch tools analytics");
  }
};

/* =====================================
   ADMIN - GET /api/tool-analytics/admin/:slug/analytics
   Returns a single tool's engagement metrics plus a 30-day traffic chart.
   ===================================== */

export const getToolAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;
    const tool = await resolveToolBySlug(slug);

    if (!tool) {
      return sendErrorResponse(res, 404, "Tool not found");
    }

    const summary = {
      views: tool.views || 0,
      clicks: tool.clicks || 0,
      saves: tool.bookmarkCount || 0,
      likes: tool.likes || 0,
    };

    const traffic = await buildTrafficChart([tool._id], TRAFFIC_CHART_DAYS);

    return res.json({
      success: true,
      tool: {
        _id: tool._id,
        name: tool.name,
        slug: tool.slug,
        logo: tool.logo || "",
        category: tool.category,
        pricing: tool.pricing,
        featured: tool.featured,
      },
      summary,
      traffic,
    });
  } catch (err) {
    logger.error("[getToolAnalytics] Error:", err);
    return sendErrorResponse(res, 500, "Failed to fetch tool analytics");
  }
};



