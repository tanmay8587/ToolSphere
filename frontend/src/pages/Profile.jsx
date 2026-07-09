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
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle gradient glow effects */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"></div>

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
            {/* Identity column */}
            <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              {/* Large circular gradient avatar */}
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-[3px] shadow-lg shadow-cyan-500/30">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {profile?.name?.[0] || "U"}
                      </span>
                    )}
                  </div>
                </div>
                {/* Verified badge on avatar */}
                <span
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-white shadow-md"
                  title="Verified User"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 1 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-white">{profile?.name}</h1>
                <p className="mt-1 text-slate-300">{profile?.email}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Joined{" "}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  Verified User
                </span>
              </div>
            </div>

            {/* Summary panel */}
            <div className="w-full max-w-xl lg:flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Summary</h2>
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
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <p className="text-sm text-slate-400">Bookmarks</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{bookmarks.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
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
