import User from "../models/User.js";
import Tool from "../models/Tool.js";
import Review from "../models/Review.js";
import Blog from "../models/Blog.js";
import logger from "../utils/logger.js";

/**
 * GET /api/users/me/personalized-feed
 * - Requires authentication
 * - Returns four sections:
 *   1. Tools from followed users (tools reviewed/bookmarked by followed users)
 *   2. Latest approved reviews
 *   3. Newly published blogs
 *   4. Trending tools (highest views/rating)
 */
export const getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the current user to get their following list
    const currentUser = await User.findById(userId).select("following");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const followingIds = currentUser.following || [];

    /* =============================================
       1. TOOLS FROM FOLLOWED USERS
          - Find tools that followed users have reviewed (approved)
          - Also find tools that followed users have bookmarked
       ============================================= */
    let toolsFromFollowed = [];

    if (followingIds.length > 0) {
      // Get tools reviewed by followed users (approved reviews)
      const reviewsByFollowed = await Review.find({
        user: { $in: followingIds },
        status: "approved",
      })
        .populate({
          path: "tool",
          match: { approved: true, isDeleted: false, status: "active" },
          select: "name slug category description pricing rating logo coverImage createdAt",
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Extract unique tools from reviews
      const toolMap = new Map();
      for (const review of reviewsByFollowed) {
        if (review.tool && !toolMap.has(review.tool._id.toString())) {
          toolMap.set(review.tool._id.toString(), {
            ...review.tool,
            reviewedBy: review.user,
            reviewedAt: review.createdAt,
          });
        }
      }

      toolsFromFollowed = Array.from(toolMap.values()).slice(0, 12);
    }

    /* =============================================
       2. LATEST REVIEWS
          - Most recent approved reviews with tool info
       ============================================= */
    const latestReviews = await Review.find({ status: "approved" })
      .populate({
        path: "tool",
        match: { approved: true, isDeleted: false, status: "active" },
        select: "name slug category description pricing rating logo coverImage",
      })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Filter out reviews whose tool was null (deleted/unapproved)
    const filteredReviews = latestReviews.filter((r) => r.tool != null);

    /* =============================================
       3. NEW BLOGS
          - Most recently published blogs
       ============================================= */
    const newBlogs = await Blog.find({
      isDeleted: false,
      status: "published",
    })
      .select("title slug coverImage category excerpt readingTime publishedAt createdAt views")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(8)
      .lean();

    /* =============================================
       4. TRENDING TOOLS
          - Tools with highest views or rating, created recently
       ============================================= */
    const trendingTools = await Tool.find({
      approved: true,
      isDeleted: false,
      status: "active",
    })
      .sort({ views: -1, rating: -1, createdAt: -1 })
      .limit(12)
      .select("name slug category description pricing rating logo coverImage views reviewCount")
      .lean();

    res.json({
      success: true,
      feed: {
        toolsFromFollowed,
        latestReviews: filteredReviews,
        newBlogs,
        trendingTools,
      },
      meta: {
        hasFollowing: followingIds.length > 0,
        totalFollowing: followingIds.length,
      },
    });
  } catch (err) {
    logger.error("[getPersonalizedFeed] Error fetching personalized feed:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch personalized feed.",
    });
  }
};