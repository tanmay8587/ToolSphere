import User from "../models/User.js";
import Review from "../models/Review.js";
import Collection from "../models/Collection.js";
import UserToolList from "../models/UserToolList.js";
import logger from "../utils/logger.js";

/**
 * Shared helper: build a leaderboard entry from an aggregated user doc.
 */
const formatUserEntry = (doc, score, extra = {}) => ({
  id: doc._id,
  name: doc.name,
  avatar: doc.avatar || "",
  score,
  ...extra,
});

/**
 * GET /api/leaderboard/top-reviewers
 * - Top reviewers ranked by number of approved reviews they've written.
 */
export const getTopReviewers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const pipeline = [
      { $match: { status: "approved" } },
      { $group: { _id: "$user", reviewCount: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
      { $sort: { reviewCount: -1, avgRating: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          name: "$user.name",
          avatar: "$user.avatar",
          reviewCount: 1,
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
    ];

    const results = await Review.aggregate(pipeline);

    res.json({
      success: true,
      data: results.map((r) => formatUserEntry(r, r.reviewCount, {
        reviewCount: r.reviewCount,
        avgRating: r.avgRating,
      })),
    });
  } catch (err) {
    logger.error("[getTopReviewers] Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch top reviewers." });
  }
};

/**
 * GET /api/leaderboard/most-active
 * - Most active users ranked by a composite activity score:
 *   reviews + collections + tool lists + followers.
 */
export const getMostActiveUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const [reviewAgg, collectionAgg, listAgg] = await Promise.all([
      Review.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      Collection.aggregate([
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      UserToolList.aggregate([
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
    ]);

    const scoreMap = new Map();
    const add = (arr, key, weight) => {
      for (const item of arr) {
        const id = item._id.toString();
        const cur = scoreMap.get(id) || { id: item._id, reviews: 0, collections: 0, lists: 0, followers: 0 };
        cur[key] = item.count;
        cur.score = (cur.reviews * 3) + (cur.collections * 2) + (cur.lists * 2) + cur.followers;
        scoreMap.set(id, cur);
      }
    };
    add(reviewAgg, "reviews", 3);
    add(collectionAgg, "collections", 2);
    add(listAgg, "lists", 2);

    // Fetch follower counts for the candidate users
    const candidateIds = [...scoreMap.values()].map((v) => v.id);
    const users = await User.find({ _id: { $in: candidateIds } })
      .select("name avatar followers")
      .lean();

    for (const u of users) {
      const entry = scoreMap.get(u._id.toString());
      if (entry) {
        entry.followers = (u.followers || []).length;
        entry.score = (entry.reviews * 3) + (entry.collections * 2) + (entry.lists * 2) + entry.followers;
        entry.name = u.name;
        entry.avatar = u.avatar || "";
      }
    }

    const ranked = [...scoreMap.values()]
      .filter((v) => v.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((v) => formatUserEntry(
        { _id: v.id, name: v.name, avatar: v.avatar },
        v.score,
        { reviews: v.reviews, collections: v.collections, lists: v.lists, followers: v.followers }
      ));

    res.json({ success: true, data: ranked });
  } catch (err) {
    logger.error("[getMostActiveUsers] Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch most active users." });
  }
};

/**
 * GET /api/leaderboard/most-liked-reviews
 * - Reviews ranked by number of likes they've received.
 */
export const getMostLikedReviews = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const pipeline = [
      { $match: { status: "approved" } },
      { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likeCount: -1, rating: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "tools",
          localField: "tool",
          foreignField: "_id",
          as: "tool",
        },
      },
      { $unwind: { path: "$tool", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          likeCount: 1,
          author: { _id: "$author._id", name: "$author.name", avatar: "$author.avatar" },
          tool: { _id: "$tool._id", name: "$tool.name", slug: "$tool.slug" },
        },
      },
    ];

    const results = await Review.aggregate(pipeline);

    res.json({ success: true, data: results });
  } catch (err) {
    logger.error("[getMostLikedReviews] Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch most liked reviews." });
  }
};

/**
 * GET /api/leaderboard/monthly
 * - Monthly leaderboard: top reviewers for the current calendar month.
 * - Optional ?month=YYYY-MM query to fetch a specific month.
 */
export const getMonthlyLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    // Determine target month (defaults to current month)
    let year, month;
    if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
      [year, month] = req.query.month.split("-").map(Number);
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const pipeline = [
      {
        $match: {
          status: "approved",
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: "$user", reviewCount: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
      { $sort: { reviewCount: -1, avgRating: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          name: "$user.name",
          avatar: "$user.avatar",
          reviewCount: 1,
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
    ];

    const results = await Review.aggregate(pipeline);

    res.json({
      success: true,
      month: `${year}-${String(month).padStart(2, "0")}`,
      data: results.map((r) => formatUserEntry(r, r.reviewCount, {
        reviewCount: r.reviewCount,
        avgRating: r.avgRating,
      })),
    });
  } catch (err) {
    logger.error("[getMonthlyLeaderboard] Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch monthly leaderboard." });
  }
};