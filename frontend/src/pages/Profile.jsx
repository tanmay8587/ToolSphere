import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/userApi";
import { getUser, logout } from "../utils/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getProfile();
        if (data.success) {
          setProfile(data.user);
          setBookmarks(data.bookmarks || []);
          setReviews(data.reviews || []);
        } else {
          setError(data.message || "Unable to load profile.");
        }
      } catch (err) {
        // If 403, user is unverified - they will be logged out by the interceptor
        if (err.response?.status === 403) {
          setError("Please verify your email to access your profile.");
        } else {
          setError(err.response?.data?.message || "Unable to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const localUser = getUser();

  if (!localUser && !loading) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-10 shadow-xl">
          <p className="text-center text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          <p className="mt-4 text-sm text-red-300">{error}</p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-600"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-950/40 p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-800">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-300">
                      {profile?.name?.[0] || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold">{profile?.name}</h1>
                  <p className="text-slate-400">{profile?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                  <h2 className="text-lg font-semibold text-white">About</h2>
                  <p className="mt-3 text-slate-400">Welcome back, {profile?.name}. Manage bookmarks and reviews from the tools directory.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                  <h2 className="text-lg font-semibold text-white">Account</h2>
                  <p className="mt-3 text-slate-400">User ID: {profile?._id}</p>
                  <p className="mt-2 text-slate-400">Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950/40 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Summary</h2>
                  <p className="mt-2 text-sm text-slate-400">Quick access to your saved tools and reviews.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Bookmarks</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{bookmarks.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Reviews</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Bookmarks</h2>
            <p className="mt-2 text-sm text-slate-400">Saved tools you can revisit anytime.</p>
            <div className="mt-6 space-y-4">
              {bookmarks.length ? (
                bookmarks.map((tool) => (
                  <div key={tool._id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    <p className="mt-1 text-slate-400">{tool.category || "Tool"}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400">
                  <p className="text-sm">No bookmarks yet. Save tools from the detail page to see them here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Reviews</h2>
            <p className="mt-2 text-sm text-slate-400">Your submitted ratings and comments.</p>
            <div className="mt-6 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <div key={review._id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{review.tool?.name || 'Tool review'}</h3>
                        <p className="mt-1 text-sm text-slate-400">Rating: {review.rating} / 5</p>
                      </div>
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
                        {review.rating}★
                      </span>
                    </div>
                    <p className="mt-4 text-slate-300">{review.comment || 'No comment provided.'}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400">
                  <p className="text-sm">No reviews yet. Submit feedback for tools you use in the directory.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
