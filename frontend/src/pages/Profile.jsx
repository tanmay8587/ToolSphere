import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getProfile, updateNewsletterPreference, getLikedBlogs } from "../services/userApi";
import { getSavedBlogs } from "../services/blogInteractionService";
import { getUser, logout } from "../utils/auth";
import { useToast, ToastContainer } from "../components/common/Toast";
import ToggleSwitch from "../components/common/ToggleSwitch";

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

// Custom scrollbar hide style
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

const iconMap = {
  bookmark: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-cyan-300">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
    </svg>
  ),
  blog: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-emerald-300">
      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
    </svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-pink-300">
      <path d="M11.645 20.91l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0Z" clipRule="evenodd" />
    </svg>
  ),
  review: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-amber-300">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
    </svg>
  ),
};

function EmptyState({ icon, title, description, buttonText, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.2)" }}
      transition={liftSpring}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center shadow-lg"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
        {iconMap[icon]}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      <button
        onClick={onClick}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M15.75 8.25a.75.75 0 0 1 .82.66l.54 5.42a.75.75 0 0 1-.84.82l-5.42-.54a.75.75 0 0 1-.66-.82l.54-5.42a.75.75 0 0 1 .82-.66Z" />
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9.75-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-15 0a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm12.53 5.03a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.19-9.19a.75.75 0 0 1-1.06 0L4.22 7.78a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm9.19-1.06a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.53 16.28a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        {buttonText}
      </button>
    </motion.div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedBlogsLoading, setSavedBlogsLoading] = useState(true);
  const [likedBlogsLoading, setLikedBlogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [savingPref, setSavingPref] = useState(false);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getProfile();
        if (data.success) {
          setProfile(data.user);
          setBookmarks(data.bookmarks || []);
          setReviews(data.reviews || []);
          setNewsletterEnabled(data.user.newsletterEnabled === true);
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

    const loadSavedBlogs = async () => {
      try {
        const data = await getSavedBlogs();
        if (data.success) {
          setSavedBlogs(data.savedBlogs || []);
        }
      } catch (err) {
        // Silently fail - saved blogs are optional content
      } finally {
        setSavedBlogsLoading(false);
      }
    };

    loadSavedBlogs();

    const loadLikedBlogs = async () => {
      try {
        const { data } = await getLikedBlogs();
        if (data.success) {
          setLikedBlogs(data.likedBlogs || []);
        }
      } catch (err) {
        // Silently fail - liked blogs are optional content
      } finally {
        setLikedBlogsLoading(false);
      }
    };

    loadLikedBlogs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNewsletterToggle = async (checked) => {
    setNewsletterEnabled(checked);
    setSavingPref(true);
    try {
      const { data } = await updateNewsletterPreference(checked);
      if (!data?.success) {
        throw new Error(data?.message || "Failed to update preference.");
      }
      addToast(
        checked
          ? "You're now subscribed to the weekly AI newsletter."
          : "You've been unsubscribed from the weekly AI newsletter.",
        "success"
      );
    } catch (err) {
      // Revert on failure so the UI reflects the persisted value
      setNewsletterEnabled(!checked);
      addToast(err.message || "Failed to update newsletter preference.", "error");
    } finally {
      setSavingPref(false);
    }
  };

  const localUser = getUser();

  const getRelativeTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }
    if (diffDay < 365) {
      const months = Math.floor(diffDay / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffDay / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  const getActivityMeta = (type) => {
    switch (type) {
      case "bookmark":
        return { icon: "🔖", label: "Saved Tool", color: "bg-cyan-500/15 text-cyan-300" };
      case "blog":
        return { icon: "📖", label: "Saved Blog", color: "bg-emerald-500/15 text-emerald-300" };
      case "review":
        return { icon: "⭐", label: "Review", color: "bg-amber-500/15 text-amber-300" };
      default:
        return { icon: "•", label: "Activity", color: "bg-slate-500/15 text-slate-300" };
    }
  };

  const recentActivity = useMemo(() => {
    const activities = [
      ...bookmarks.map((b) => ({
        id: b._id,
        type: "bookmark",
        title: b.name,
        subtitle: b.category || "Tool",
        date: b.createdAt,
        slug: b.slug,
      })),
      ...savedBlogs.map((blog) => ({
        id: blog._id,
        type: "blog",
        title: blog.title,
        subtitle: blog.category || "Blog",
        date: blog.publishedAt || blog.createdAt,
        slug: blog.slug,
      })),
      ...reviews.map((r) => ({
        id: r._id,
        type: "review",
        title: r.tool?.name || "Tool review",
        subtitle: `Rating: ${r.rating} / 5`,
        date: r.createdAt,
        slug: r.tool?.slug,
      })),
    ];

    return activities
      .filter((a) => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [bookmarks, savedBlogs, reviews]);

  const favoriteCategoriesCount = useMemo(() => {
    return new Set(bookmarks.map((b) => b.category).filter(Boolean)).size;
  }, [bookmarks]);

  if (!localUser && !loading) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Skeleton Home Button */}
          <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-800/50 sm:w-auto" />

          {/* Skeleton Profile Card */}
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
              <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                <div className="h-28 w-28 animate-pulse rounded-full bg-slate-800/50" />
                <div className="space-y-3">
                  <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800/50" />
                  <div className="h-5 w-64 animate-pulse rounded-lg bg-slate-800/50" />
                  <div className="h-4 w-56 animate-pulse rounded-lg bg-slate-800/50" />
                </div>
              </div>
              <div className="w-full max-w-xl lg:flex-1 space-y-6">
                <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-800/50" />
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-800/50" />
                      <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800/50" />
                      <div className="h-4 w-20 animate-pulse rounded-lg bg-slate-800/50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Recent Activity */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg space-y-3">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-800/50" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-800/50" />
            <div className="mt-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-800/50" />
                    <div className="h-3 w-48 animate-pulse rounded-lg bg-slate-800/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Saved Blogs */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg space-y-3">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-800/50" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-800/50" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-lg">
                  <div className="h-40 w-full animate-pulse bg-slate-800/50" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-full animate-pulse rounded-lg bg-slate-800/50" />
                    <div className="h-3 w-3/4 animate-pulse rounded-lg bg-slate-800/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-slate-900 p-8 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-red-400">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 15a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V18a.75.75 0 0 1 .75-.75ZM12 9a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-1.5 0V9.75A.75.75 0 0 1 12 9Z" clipRule="evenodd" />
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Profile Error</h1>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/20 hover:bg-white/10"
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Return to login
            </button>
          </div>
        </motion.div>
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
      <style>{scrollbarHideStyle}</style>
      <motion.div
        className="mx-auto max-w-5xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Home Button */}
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ y: -2, boxShadow: "0 8px 20px -6px rgba(34,211,238,0.3)" }}
          whileTap={{ scale: 0.97 }}
          transition={liftSpring}
          className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-cyan-300">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.69-8.69a1.75 1.75 0 0 0-2.47 0l-8.69 8.69a.75.75 0 1 0 1.06 1.06l8.69-8.69Z" />
            <path d="M12 5.432 8.914 9.28a.75.75 0 0 1-1.06-1.06l5.432-5.432a.75.75 0 0 1 1.314.512V11.25a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h.75v-6.314Z" />
            <path fillRule="evenodd" d="M3 18.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm.75 3.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Home</span>
        </motion.button>
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
                    onClick={() => navigate("/profile/edit")}
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

        {/* Activity Tabs */}
        <motion.div variants={sectionVariants} className="rounded-3xl border border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("bookmarks")}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
                  activeTab === "bookmarks"
                    ? "text-cyan-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                </svg>
                <span>Bookmarked Tools</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "bookmarks"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {bookmarks.length}
                </span>
                {activeTab === "bookmarks" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab("saved-blogs")}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
                  activeTab === "saved-blogs"
                    ? "text-emerald-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                </svg>
                <span>Saved Blogs</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "saved-blogs"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {savedBlogs.length}
                </span>
                {activeTab === "saved-blogs" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab("liked-blogs")}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
                  activeTab === "liked-blogs"
                    ? "text-pink-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0Z" clipRule="evenodd" />
                </svg>
                <span>Liked Blogs</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "liked-blogs"
                    ? "bg-pink-500/20 text-pink-300"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {likedBlogs.length}
                </span>
                {activeTab === "liked-blogs" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab("reviews")}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                </svg>
                <span>My Reviews</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "reviews"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {reviews.length}
                </span>
                {activeTab === "reviews" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "bookmarks" && (
                <motion.div
                  key="bookmarks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {bookmarks.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {bookmarks.map((tool) => (
                        <motion.div
                          key={tool._id}
                          whileHover={{ y: -3, boxShadow: "0 14px 30px -12px rgba(34,211,238,0.2)" }}
                          transition={liftSpring}
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg cursor-pointer"
                          onClick={() => navigate(`/tools/${tool.slug}`)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{tool.name}</h3>
                              <p className="mt-1 text-sm text-slate-400">{tool.category || "Tool"}</p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="bookmark"
                      title="No bookmarks yet"
                      description="Save your favorite AI tools to keep them handy in one place."
                      buttonText="Browse AI Tools"
                      onClick={() => navigate("/tools")}
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "saved-blogs" && (
                <motion.div
                  key="saved-blogs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {savedBlogsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="h-6 w-6 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                      </svg>
                    </div>
                  ) : savedBlogs.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {savedBlogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.25)" }}
                          transition={liftSpring}
                          className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-lg transition-colors hover:border-cyan-500/30"
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-slate-800">
                            {blog.coverImage ? (
                              <img
                                src={blog.coverImage}
                                alt={blog.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-slate-600">
                                  <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-cyan-300 transition-colors">
                              {blog.title}
                            </h3>
                            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              {blog.category && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                                  {blog.category}
                                </span>
                              )}
                              {blog.readingTime > 0 && (
                                <span className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                                  </svg>
                                  {blog.readingTime} min read
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="blog"
                      title="You haven't saved any blogs yet."
                      description="Save interesting blog posts to read them later at your convenience."
                      buttonText="Browse Blogs"
                      onClick={() => navigate("/blog")}
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "liked-blogs" && (
                <motion.div
                  key="liked-blogs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {likedBlogsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="h-6 w-6 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                      </svg>
                    </div>
                  ) : likedBlogs.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {likedBlogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.25)" }}
                          transition={liftSpring}
                          className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-lg transition-colors hover:border-pink-500/30"
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-slate-800">
                            {blog.coverImage ? (
                              <img
                                src={blog.coverImage}
                                alt={blog.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-slate-600">
                                  <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-pink-300 transition-colors">
                              {blog.title}
                            </h3>
                            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              {blog.category && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-pink-300">
                                  {blog.category}
                                </span>
                              )}
                              {blog.readingTime > 0 && (
                                <span className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                                  </svg>
                                  {blog.readingTime} min read
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="heart"
                      title="You haven't liked any blogs yet."
                      description="Like blog posts to save them here and show your appreciation."
                      buttonText="Browse Blogs"
                      onClick={() => navigate("/blog")}
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {reviews.length ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <motion.div
                          key={review._id}
                          whileHover={{ y: -3, boxShadow: "0 14px 30px -12px rgba(251,191,36,0.2)" }}
                          transition={liftSpring}
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{review.tool?.name || 'Tool review'}</h3>
                              <p className="mt-1 text-sm text-slate-400">Rating: {review.rating} / 5</p>
                            </div>
                            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300 shrink-0">
                              {review.rating}★
                            </span>
                          </div>
                          <p className="mt-4 text-slate-300">{review.comment || 'No comment provided.'}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="review"
                      title="No reviews yet"
                      description="Share your experience with the tools you've tried to help others."
                      buttonText="Browse AI Tools"
                      onClick={() => navigate("/tools")}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Email Preferences */}
        <motion.div variants={sectionVariants} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-white">Email Preferences</h2>
          <p className="mt-2 text-sm text-slate-400">Manage the emails you'd like to receive from us.</p>

          <div className="mt-6 flex items-start justify-between gap-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Receive Weekly AI Newsletter</span>
                {savingPref && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                    Saving...
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                Receive weekly updates about new AI tools, features and exclusive recommendations.
              </p>
            </div>

            <div className="mt-0.5 shrink-0">
              <ToggleSwitch
                checked={newsletterEnabled}
                disabled={savingPref}
                onChange={handleNewsletterToggle}
                aria-label="Receive Weekly AI Newsletter"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}
