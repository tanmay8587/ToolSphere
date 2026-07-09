import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/userApi";
import { subscribeToNewsletter, unsubscribeFromNewsletter } from "../services/newsletterService";
import { getUser, logout } from "../utils/auth";
import { useToast, ToastContainer } from "../components/common/Toast";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const liftSpring = { type: "spring", stiffness: 300, damping: 22 };

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [savingPref, setSavingPref] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Loads the newsletter checkbox state from the Newsletter subscription
  // status exposed by the newsletter API (resolved from the auth token).
  const loadNewsletterStatus = async () => {
    try {
      const token = localStorage.getItem("userAuthToken");
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/newsletter/status`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setNewsletterEnabled(data.subscribed === true);
      }
    } catch (err) {
      // If the subscription status can't be determined, leave the default unchecked.
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getProfile();
        if (data.success) {
          setProfile(data.user);
          setBookmarks(data.bookmarks || []);
          setReviews(data.reviews || []);
          await loadNewsletterStatus();
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

  const handleNewsletterToggle = async (checked) => {
    setNewsletterEnabled(checked);
    setSavingPref(true);
    try {
      if (checked) {
        await subscribeToNewsletter();
      } else {
        await unsubscribeFromNewsletter(profile?.email);
      }
    } catch (err) {
      // Revert on failure
      setNewsletterEnabled(!checked);
    } finally {
      setSavingPref(false);
    }
  };

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      await unsubscribeFromNewsletter(profile?.email);
      setNewsletterEnabled(false);
      addToast("You have been unsubscribed from the newsletter.", "success");
    } catch (err) {
      addToast(err.message || "Failed to unsubscribe. Please try again.", "error");
    } finally {
      setUnsubscribing(false);
    }
  };

  const localUser = getUser();

  const recentActivity = [
    ...bookmarks.map((b) => ({
      id: b._id,
      type: "bookmark",
      title: b.name,
      subtitle: b.category || "Tool",
      date: b.createdAt,
    })),
    ...reviews.map((r) => ({
      id: r._id,
      type: "review",
      title: r.tool?.name || "Tool review",
      subtitle: `Rating: ${r.rating} / 5`,
      date: r.createdAt,
    })),
  ]
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

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
            className="mt-6 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="mx-auto max-w-5xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={sectionVariants}
          whileHover={{ y: -6, boxShadow: "0 30px 60px -20px rgba(34,211,238,0.25)" }}
          transition={liftSpring}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-10 shadow-2xl backdrop-blur-xl"
        >
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
                  className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* Bookmarks */}
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 22px 45px -12px rgba(34,211,238,0.3)" }}
                  transition={liftSpring}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{bookmarks.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Bookmarks</p>
                </motion.div>

                {/* Reviews */}
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 22px 45px -12px rgba(251,191,36,0.3)" }}
                  transition={liftSpring}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-amber-400/40 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{reviews.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Reviews</p>
                </motion.div>

                {/* Favorite Categories */}
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 22px 45px -12px rgba(99,102,241,0.3)" }}
                  transition={liftSpring}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-indigo-400/40 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3H5.25Zm0 9a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3H5.25Zm9-9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V5.25Zm0 9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">
                    {new Set(bookmarks.map((b) => b.category).filter(Boolean)).size}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Favorite Categories</p>
                </motion.div>

                {/* Member Since */}
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 22px 45px -12px rgba(168,85,247,0.3)" }}
                  transition={liftSpring}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-purple-400/40 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75A2.25 2.25 0 0 1 21 6.75v12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-12A2.25 2.25 0 0 1 5.25 4.5H6V3a.75.75 0 0 1 .75-.75Zm-3 9a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Zm0 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="mt-4 text-xl font-semibold text-white">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })
                      : "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Member Since</p>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-slate-400">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <motion.button
                    onClick={() => navigate("/tools")}
                    whileHover={{ y: -4, boxShadow: "0 14px 30px -10px rgba(34,211,238,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={liftSpring}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-cyan-300">
                      <path d="M15.75 8.25a.75.75 0 0 1 .82.66l.54 5.42a.75.75 0 0 1-.84.82l-5.42-.54a.75.75 0 0 1-.66-.82l.54-5.42a.75.75 0 0 1 .82-.66Z" />
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9.75-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-15 0a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm12.53 5.03a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.19-9.19a.75.75 0 0 1-1.06 0L4.22 7.78a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm9.19-1.06a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.53 16.28a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                    Explore AI Tools
                  </motion.button>

                  <motion.button
                    onClick={() => navigate("/categories")}
                    whileHover={{ y: -4, boxShadow: "0 14px 30px -10px rgba(99,102,241,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={liftSpring}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-indigo-400/40 hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-indigo-300">
                      <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3H5.25Zm0 9a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3H5.25Zm9-9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V5.25Zm0 9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4Z" clipRule="evenodd" />
                    </svg>
                    Browse Categories
                  </motion.button>

                  <motion.button
                    onClick={() => navigate("/profile")}
                    whileHover={{ y: -4, boxShadow: "0 14px 30px -10px rgba(168,85,247,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={liftSpring}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-purple-400/40 hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-purple-300">
                      <path d="M21.73 3.27a2.25 2.25 0 0 0-3.18 0l-1.27 1.27 3.18 3.18 1.27-1.27a2.25 2.25 0 0 0 0-3.18ZM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" />
                    </svg>
                    Edit Profile
                  </motion.button>

                  <motion.button
                    onClick={() => navigate("/contact")}
                    whileHover={{ y: -4, boxShadow: "0 14px 30px -10px rgba(16,185,129,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={liftSpring}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-emerald-400/40 hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-emerald-300">
                      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.93 5.43a3 3 0 0 1-3.14 0L1.5 8.67Z" />
                      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.912a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                    </svg>
                    Contact Support
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={sectionVariants} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
          <p className="mt-2 text-sm text-slate-400">Your latest bookmarks and reviews across the directory.</p>

          {recentActivity.length ? (
            <div className="mt-6 space-y-3">
              {recentActivity.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2, boxShadow: "0 12px 28px -12px rgba(148,163,184,0.25)" }}
                  transition={liftSpring}
                  className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg transition-colors hover:border-slate-700"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      item.type === "review"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-cyan-500/15 text-cyan-300"
                    }`}
                  >
                    {item.type === "review" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{item.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.2)" }}
              transition={liftSpring}
              className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center shadow-lg"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-cyan-300">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">No recent activity yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Start exploring the directory and bookmarking your favorite AI tools to see your activity here.
              </p>
              <button
                onClick={() => navigate("/tools")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M15.75 8.25a.75.75 0 0 1 .82.66l.54 5.42a.75.75 0 0 1-.84.82l-5.42-.54a.75.75 0 0 1-.66-.82l.54-5.42a.75.75 0 0 1 .82-.66Z" />
                  <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9.75-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-15 0a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm12.53 5.03a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.19-9.19a.75.75 0 0 1-1.06 0L4.22 7.78a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm9.19-1.06a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.53 16.28a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
                Explore AI Tools
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={sectionVariants} className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Bookmarks</h2>
            <p className="mt-2 text-sm text-slate-400">Saved tools you can revisit anytime.</p>
            <div className="mt-6 space-y-4">
              {bookmarks.length ? (
                bookmarks.map((tool) => (
                  <motion.div
                    key={tool._id}
                    whileHover={{ y: -3, boxShadow: "0 14px 30px -12px rgba(34,211,238,0.2)" }}
                    transition={liftSpring}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg"
                  >
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    <p className="mt-1 text-slate-400">{tool.category || "Tool"}</p>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.2)" }}
                  transition={liftSpring}
                  className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center shadow-lg"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-cyan-500/20 blur-xl"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="relative h-8 w-8 text-cyan-300">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">No bookmarks yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">Save your favorite AI tools to keep them handy in one place.</p>
                  <button
                    onClick={() => navigate("/tools")}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M15.75 8.25a.75.75 0 0 1 .82.66l.54 5.42a.75.75 0 0 1-.84.82l-5.42-.54a.75.75 0 0 1-.66-.82l.54-5.42a.75.75 0 0 1 .82-.66Z" />
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9.75-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-15 0a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm12.53 5.03a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.19-9.19a.75.75 0 0 1-1.06 0L4.22 7.78a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm9.19-1.06a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.53 16.28a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                    Browse AI Tools
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Reviews</h2>
            <p className="mt-2 text-sm text-slate-400">Your submitted ratings and comments.</p>
            <div className="mt-6 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <motion.div
                    key={review._id}
                    whileHover={{ y: -3, boxShadow: "0 14px 30px -12px rgba(251,191,36,0.2)" }}
                    transition={liftSpring}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg"
                  >
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
                  </motion.div>
                ))
              ) : (
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(251,191,36,0.2)" }}
                  transition={liftSpring}
                  className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center shadow-lg"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 via-orange-500/20 to-pink-600/20 ring-1 ring-white/10">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-amber-500/20 blur-xl"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="relative h-8 w-8 text-amber-300">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">No reviews yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">Share your experience with the tools you've tried to help others.</p>
                  <button
                    onClick={() => navigate("/tools")}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M15.75 8.25a.75.75 0 0 1 .82.66l.54 5.42a.75.75 0 0 1-.84.82l-5.42-.54a.75.75 0 0 1-.66-.82l.54-5.42a.75.75 0 0 1 .82-.66Z" />
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9.75-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-15 0a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm12.53 5.03a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.19-9.19a.75.75 0 0 1-1.06 0L4.22 7.78a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm9.19-1.06a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.53 16.28a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                    Browse AI Tools
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Email Preferences */}
        <motion.div variants={sectionVariants} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-white">Email Preferences</h2>
          <p className="mt-2 text-sm text-slate-400">Manage the emails you'd like to receive from us.</p>
          <label className="mt-6 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={newsletterEnabled}
              disabled={savingPref}
              onChange={(e) => handleNewsletterToggle(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-white">Receive Weekly AI Newsletter</span>
          </label>
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={unsubscribing || !newsletterEnabled}
            className="mt-4 rounded-2xl border border-slate-700 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:border-red-400/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {unsubscribing ? "Unsubscribing..." : "Unsubscribe from Newsletter"}
          </button>
        </motion.div>
      </motion.div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}
