const API_BASE = import.meta.env.VITE_API_URL;

/**
 * GET /api/users/me/personalized-feed
 * - Returns personalized feed for the authenticated user
 * - Sections: tools from followed users, latest reviews, new blogs, trending tools
 */
export async function getPersonalizedFeed() {
  const token = localStorage.getItem("token");

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE}/users/me/personalized-feed`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, message: data?.message || "Failed to fetch feed" };
    }

    return {
      success: data?.success ?? false,
      feed: data?.feed ?? {
        toolsFromFollowed: [],
        latestReviews: [],
        newBlogs: [],
        trendingTools: [],
      },
      meta: data?.meta ?? { hasFollowing: false, totalFollowing: 0 },
    };
  } catch (error) {
    console.error("[feedService] getPersonalizedFeed failed:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch personalized feed",
      feed: {
        toolsFromFollowed: [],
        latestReviews: [],
        newBlogs: [],
        trendingTools: [],
      },
      meta: { hasFollowing: false, totalFollowing: 0 },
    };
  }
}