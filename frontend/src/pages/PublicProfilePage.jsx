import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPublicUserProfile, followUser, unfollowUser } from "../services/userService";

const API_BASE = import.meta.env.VITE_API_URL;

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const currentUserId = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("authUser") || "null");
      return user?.id || null;
    } catch {
      return null;
    }
  })();

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      const result = await getPublicUserProfile(userId);
      
      if (result.success && result.data) {
        setProfile(result.data);
        setIsFollowing(result.data.isFollowing || false);
        setFollowersCount(result.data.user.followersCount || 0);
        setFollowingCount(result.data.user.followingCount || 0);
      } else {
        setError("User not found or profile is not public.");
      }
      
      setLoading(false);
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const result = await unfollowUser(userId);
        if (result.success) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const result = await followUser(userId);
        if (result.success) {
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      // Silently handle
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "This user profile does not exist or is not public."}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const { user, toolLists, reviews, collections } = profile;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Profile Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-slate-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{user.name}</h1>
                  {user.bio && (
                    <p className="text-slate-300 text-lg mb-4 max-w-2xl">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400">
                    <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                    {toolLists.length > 0 && (
                      <span>• {toolLists.length} public list{toolLists.length !== 1 ? 's' : ''}</span>
                    )}
                    {reviews.length > 0 && (
                      <span>• {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                    )}
                    {collections.length > 0 && (
                      <span>• {collections.length} collection{collections.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Follow Button & Stats */}
                <div className="flex flex-col items-center md:items-end gap-3">
                  {/* Followers / Following counts */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <span className="block text-xl font-bold text-white">{followersCount}</span>
                      <span className="text-slate-400">Followers</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xl font-bold text-white">{followingCount}</span>
                      <span className="text-slate-400">Following</span>
                    </div>
                  </div>

                  {/* Follow / Unfollow button */}
                  {!isOwnProfile && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        isFollowing
                          ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-red-500 hover:text-white hover:border-red-500"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {followLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white"></div>
                          {isFollowing ? "Unfollowing..." : "Following..."}
                        </span>
                      ) : isFollowing ? (
                        "Unfollow"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Public Tool Lists */}
        {toolLists.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Public Tool Lists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolLists.map((list) => (
                <div
                  key={list._id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{list.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {list.tools.length} tool{list.tools.length !== 1 ? 's' : ''}
                  </p>
                  {list.tools.length > 0 && (
                    <div className="space-y-3">
                      {list.tools.slice(0, 5).map((tool) => (
                        <Link
                          key={tool._id}
                          to={`/tools/${tool.slug}`}
                          className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          {tool.logo ? (
                            <img
                              src={tool.logo}
                              alt={tool.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-white font-semibold">
                              {tool.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{tool.name}</p>
                            <p className="text-slate-400 text-xs truncate">{tool.category}</p>
                          </div>
                        </Link>
                      ))}
                      {list.tools.length > 5 && (
                        <p className="text-slate-500 text-sm text-center pt-2">
                          +{list.tools.length - 5} more tool{list.tools.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Public Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-6"
                >
                  {review.tool && (
                    <Link
                      to={`/tools/${review.tool.slug}`}
                      className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
                    >
                      {review.tool.logo ? (
                        <img
                          src={review.tool.logo}
                          alt={review.tool.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-white font-semibold">
                          {review.tool.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold">{review.tool.name}</h3>
                        <p className="text-slate-400 text-sm">{review.tool.category}</p>
                      </div>
                    </Link>
                  )}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-slate-600"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-slate-300">{review.comment}</p>
                  )}
                  <p className="text-slate-500 text-sm mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Public Collections */}
        {collections.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Public Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection._id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{collection.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {collection.tools.length} tool{collection.tools.length !== 1 ? 's' : ''}
                  </p>
                  {collection.tools.length > 0 && (
                    <div className="space-y-3">
                      {collection.tools.slice(0, 5).map((tool) => (
                        <Link
                          key={tool._id}
                          to={`/tools/${tool.slug}`}
                          className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          {tool.logo ? (
                            <img
                              src={tool.logo}
                              alt={tool.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-white font-semibold">
                              {tool.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{tool.name}</p>
                            <p className="text-slate-400 text-xs truncate">{tool.category}</p>
                          </div>
                        </Link>
                      ))}
                      {collection.tools.length > 5 && (
                        <p className="text-slate-500 text-sm text-center pt-2">
                          +{collection.tools.length - 5} more tool{collection.tools.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {toolLists.length === 0 && reviews.length === 0 && collections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Public Content Yet</h3>
            <p className="text-slate-400">
              This user hasn't shared any public tool lists, reviews, or collections yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfilePage;