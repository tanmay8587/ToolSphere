import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getProfile, updateNewsletterPreference, getLikedBlogs } from "../services/userApi";
import { getSavedBlogs, removeBookmark, saveBlog, unlikeBlog } from "../services/blogInteractionService";
import { getUser, logout } from "../utils/auth";
import { useToast, ToastContainer } from "../components/common/Toast";
import ToggleSwitch from "../components/common/ToggleSwitch";

// Confirmation Dialog Component
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-red-400">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Edit Review Modal Component
function EditReviewModal({ isOpen, review, onSave, onCancel }) {
  const [rating, setRating] = useState(review?.rating || 5);
  const [comment, setComment] = useState(review?.comment || "");

  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment || "");
    }
  }, [review]);

  if (!isOpen || !review) return null;

  const handleSave = () => {
    onSave(review._id, { rating, comment });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Edit Review</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tool</label>
            <p className="text-white">{review.tool?.name || 'Unknown Tool'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={star <= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    className={`h-8 w-8 ${
                      star <= rating ? "text-amber-400" : "text-slate-600"
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Write your review..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.02 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const liftSpring = { type: "spring", stiffness: 400, damping: 25 };

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" }
};

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
  const [editingReview, setEditingReview] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [displayCount, setDisplayCount] = useState(6);
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

  const handleRemoveBookmark = async (toolId) => {
    try {
      await removeBookmark(toolId);
      // Remove the tool from the bookmarks state
      setBookmarks((prev) => prev.filter((tool) => tool._id !== toolId));
      addToast("Bookmark removed successfully.", "success");
    } catch (err) {
      addToast(err.message || "Failed to remove bookmark.", "error");
    }
  };

  const handleRemoveSavedBlog = async (blogId) => {
    try {
      await saveBlog(blogId); // Toggle off the save
      // Remove the blog from the saved blogs state
      setSavedBlogs((prev) => prev.filter((blog) => blog._id !== blogId));
      addToast("Blog removed from saved list.", "success");
    } catch (err) {
      addToast(err.message || "Failed to remove saved blog.", "error");
    }
  };

  const handleUnlikeBlog = async (blogId) => {
    try {
      await unlikeBlog(blogId);
      // Remove the blog from the liked blogs state
      setLikedBlogs((prev) => prev.filter((blog) => blog._id !== blogId));
      addToast("Blog unliked successfully.", "success");
    } catch (err) {
      addToast(err.message || "Failed to unlike blog.", "error");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  const handleSaveReview = async (reviewId, updatedData) => {
    try {
      // TODO: Add API call to update review
      // For now, update local state
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? { ...review, rating: updatedData.rating, comment: updatedData.comment }
            : review
        )
      );
      setIsEditModalOpen(false);
      setEditingReview(null);
      addToast("Review updated successfully.", "success");
    } catch (err) {
      addToast(err.message || "Failed to update review.", "error");
    }
  };

  const handleDeleteReview = (review) => {
    setDeletingReview(review);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!deletingReview) return;

    try {
      // TODO: Add API call to delete review
      // For now, update local state
      setReviews((prev) => prev.filter((review) => review._id !== deletingReview._id));
      setIsDeleteDialogOpen(false);
      setDeletingReview(null);
      addToast("Review deleted successfully.", "success");
    } catch (err) {
      addToast(err.message || "Failed to delete review.", "error");
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

  // Filtered and sorted data for each tab
  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tool => 
        tool.name?.toLowerCase().includes(query) ||
        tool.category?.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    
    return result;
  }, [bookmarks, searchQuery, sortBy]);

  const filteredSavedBlogs = useMemo(() => {
    let result = [...savedBlogs];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(blog => 
        blog.title?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt));
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    
    return result;
  }, [savedBlogs, searchQuery, sortBy]);

  const filteredLikedBlogs = useMemo(() => {
    let result = [...likedBlogs];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(blog => 
        blog.title?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    
    return result;
  }, [likedBlogs, searchQuery, sortBy]);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(review => 
        review.tool?.name?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => (review.tool?.name || "").localeCompare(b.tool?.name || ""));
    }
    
    return result;
  }, [reviews, searchQuery, sortBy]);

  // Paginated data
  const displayedBookmarks = filteredBookmarks.slice(0, displayCount);
  const displayedSavedBlogs = filteredSavedBlogs.slice(0, displayCount);
  const displayedLikedBlogs = filteredLikedBlogs.slice(0, displayCount);
  const displayedReviews = filteredReviews.slice(0, displayCount);

  const hasMoreBookmarks = filteredBookmarks.length > displayCount;
  const hasMoreSavedBlogs = filteredSavedBlogs.length > displayCount;
  const hasMoreLikedBlogs = filteredLikedBlogs.length > displayCount;
  const hasMoreReviews = filteredReviews.length > displayCount;

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
                      <img 
                        src={profile.avatar} 
                        alt={profile.name} 
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full rounded-full object-cover" 
                      />
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab("bookmarks");
                  }
                }}
                role="tab"
                aria-selected={activeTab === "bookmarks"}
                aria-controls="tab-panel"
                tabIndex={activeTab === "bookmarks" ? 0 : -1}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-t-lg ${
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab("saved-blogs");
                  }
                }}
                role="tab"
                aria-selected={activeTab === "saved-blogs"}
                aria-controls="tab-panel"
                tabIndex={activeTab === "saved-blogs" ? 0 : -1}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-t-lg ${
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab("liked-blogs");
                  }
                }}
                role="tab"
                aria-selected={activeTab === "liked-blogs"}
                aria-controls="tab-panel"
                tabIndex={activeTab === "liked-blogs" ? 0 : -1}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-t-lg ${
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab("reviews");
                  }
                }}
                role="tab"
                aria-selected={activeTab === "reviews"}
                aria-controls="tab-panel"
                tabIndex={activeTab === "reviews" ? 0 : -1}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-t-lg ${
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
            {/* Search and Sort Controls */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "bookmarks" ? "tools" : activeTab === "saved-blogs" || activeTab === "liked-blogs" ? "blogs" : "reviews"}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayCount(6); // Reset pagination on new search
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-slate-400">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-3 pr-8 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "bookmarks" && (
                <motion.div
                  key="bookmarks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {displayedBookmarks.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {displayedBookmarks.map((tool) => (
                        <motion.div
                          key={tool._id}
                          whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.25)" }}
                          transition={liftSpring}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg transition-colors hover:border-cyan-500/30"
                        >
                          {/* Card Header with Logo and Remove Button */}
                          <div className="relative flex items-start gap-4 p-5 pb-4">
                            {/* Logo */}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden">
                              {tool.logo ? (
                                <img
                                  src={tool.logo}
                                  alt={tool.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-contain p-1.5"
                                />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-slate-500">
                                  <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                                </svg>
                              )}
                            </div>

                            {/* Remove Bookmark Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBookmark(tool._id);
                              }}
                              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                              title="Remove bookmark"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Card Content */}
                          <div
                            className="flex flex-1 flex-col gap-2 px-5 pb-5 cursor-pointer"
                            onClick={() => navigate(`/tools/${tool.slug}`)}
                          >
                            <div className="flex-1">
                              <h3 className="line-clamp-1 font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                {tool.name}
                              </h3>
                              {tool.category && (
                                <span className="mt-1.5 inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                                  {tool.category}
                                </span>
                              )}
                              {tool.description && (
                                <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                                  {tool.description}
                                </p>
                              )}
                            </div>

                            {/* Bookmark Date */}
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75A2.25 2.25 0 0 1 21 6.75v12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-12A2.25 2.25 0 0 1 5.25 4.5H6V3a.75.75 0 0 1 .75-.75Zm-3 9a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Zm0 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" clipRule="evenodd" />
                              </svg>
                              <span>
                                Bookmarked {tool.createdAt ? new Date(tool.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "recently"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="bookmark"
                      title="You haven't bookmarked any tools yet."
                      description="Save your favorite AI tools to keep them handy in one place."
                      buttonText="Browse AI Tools"
                      onClick={() => navigate("/tools")}
                    />
                  )}
                  
                  {/* Load More Button */}
                  {hasMoreBookmarks && (
                    <div className="mt-8 flex justify-center">
                      <motion.button
                        whileHover={{ y: -2, boxShadow: "0 8px 20px -6px rgba(34,211,238,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDisplayCount((prev) => prev + 6)}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors duration-300 hover:bg-cyan-500/20 hover:border-cyan-400/50"
                      >
                        Load More ({filteredBookmarks.length - displayCount} remaining)
                      </motion.button>
                    </div>
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
                  ) : displayedSavedBlogs.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {displayedSavedBlogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.25)" }}
                          transition={liftSpring}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-lg transition-colors hover:border-cyan-500/30"
                        >
                          {/* Cover Image with Remove Button */}
                          <div className="relative h-40 w-full overflow-hidden bg-slate-800">
                              {blog.coverImage ? (
                                <img
                                  src={blog.coverImage}
                                  alt={blog.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-slate-600">
                                  <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.133 2.75.382a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                                </svg>
                              </div>
                            )}
                            
                            {/* Remove Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSavedBlog(blog._id);
                              }}
                              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                              title="Remove from saved"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Card Content */}
                          <div
                            className="flex flex-1 flex-col gap-2 p-4 cursor-pointer"
                            onClick={() => navigate(`/blog/${blog.slug}`)}
                          >
                            <div className="flex-1">
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
                                {blog.publishedAt && (
                                  <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75A2.25 2.25 0 0 1 21 6.75v12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-12A2.25 2.25 0 0 1 5.25 4.5H6V3a.75.75 0 0 1 .75-.75Zm-3 9a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Zm0 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" clipRule="evenodd" />
                                    </svg>
                                    {new Date(blog.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                              </div>
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
                  
                  {/* Load More Button */}
                  {hasMoreSavedBlogs && (
                    <div className="mt-8 flex justify-center">
                      <motion.button
                        whileHover={{ y: -2, boxShadow: "0 8px 20px -6px rgba(34,211,238,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDisplayCount((prev) => prev + 6)}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors duration-300 hover:bg-cyan-500/20 hover:border-cyan-400/50"
                      >
                        Load More ({filteredSavedBlogs.length - displayCount} remaining)
                      </motion.button>
                    </div>
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
                  ) : displayedLikedBlogs.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {displayedLikedBlogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.25)" }}
                          transition={liftSpring}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 shadow-lg transition-colors hover:border-pink-500/30"
                        >
                          {/* Cover Image with Unlike Button */}
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
                            
                            {/* Unlike Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlikeBlog(blog._id);
                              }}
                              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                              title="Remove like"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Card Content */}
                          <div
                            className="flex flex-1 flex-col gap-2 p-4 cursor-pointer"
                            onClick={() => navigate(`/blog/${blog.slug}`)}
                          >
                            <div className="flex-1">
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
                              
                              {/* Like Date */}
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                  <path d="M11.645 20.91l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0l-.007-.003-.022-.012a5.309 5.309 0 0 1-.028-.02 5.335 5.335 0 0 1-.81-.993 5.185 5.185 0 0 1-.351-1.338 5.278 5.278 0 0 1 .073-1.857.75.75 0 0 1 1.488-.186 3.809 3.809 0 0 0 .514 1.88l.022.038.022.038a3.778 3.778 0 0 0 .617.781 3.756 3.756 0 0 0 1.256.867 3.832 3.832 0 0 0 1.488.3 3.756 3.756 0 0 0 1.488-.3 3.756 3.756 0 0 0 1.256-.867 3.778 3.778 0 0 0 .617-.781l.022-.038.022-.038a3.809 3.809 0 0 0 .514-1.88.75.75 0 1 1 1.488.186 5.278 5.278 0 0 1 .073 1.857 5.185 5.185 0 0 1-.351 1.338 5.335 5.335 0 0 1-.81.993 5.309 5.309 0 0 1-.028.02l-.022.012-.007.003-.007.003a.75.75 0 0 1-.704 0Z" clipRule="evenodd" />
                                </svg>
                                <span>
                                  Liked {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "recently"}
                                </span>
                              </div>
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
                  
                  {/* Load More Button */}
                  {hasMoreLikedBlogs && (
                    <div className="mt-8 flex justify-center">
                      <motion.button
                        whileHover={{ y: -2, boxShadow: "0 8px 20px -6px rgba(34,211,238,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDisplayCount((prev) => prev + 6)}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors duration-300 hover:bg-cyan-500/20 hover:border-cyan-400/50"
                      >
                        Load More ({filteredLikedBlogs.length - displayCount} remaining)
                      </motion.button>
                    </div>
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
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => navigate(`/tools/${review.tool?.slug}`)}
                            >
                              <h3 className="font-semibold text-white truncate hover:text-amber-300 transition-colors">
                                {review.tool?.name || 'Tool review'}
                              </h3>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                                  {review.rating}★
                                </span>
                                <span className="text-xs text-slate-500">
                                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-cyan-500/20 hover:text-cyan-400"
                                title="Edit review"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.2l-3.712-3.712-8.106 8.106-1.157 1.157 3.712 3.712 1.157-1.157 2.047-2.047ZM3.75 21.75h16.5a.75.75 0 0 0 0-1.5H3.75a.75.75 0 0 0 0 1.5Zm16.5-13.5a.75.75 0 0 0 0-1.5H3.75a.75.75 0 0 0 0 1.5h16.5Z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                                title="Delete review"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 text-slate-300">{review.comment || 'No comment provided.'}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="review"
                      title="You haven't written any reviews yet."
                      description="Share your experience with the tools you've tried to help others."
                      buttonText="Browse AI Tools"
                      onClick={() => navigate("/tools")}
                    />
                  )}
                  
                  {/* Load More Button */}
                  {hasMoreReviews && (
                    <div className="mt-8 flex justify-center">
                      <motion.button
                        whileHover={{ y: -2, boxShadow: "0 8px 20px -6px rgba(34,211,238,0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDisplayCount((prev) => prev + 6)}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors duration-300 hover:bg-cyan-500/20 hover:border-cyan-400/50"
                      >
                        Load More ({filteredReviews.length - displayCount} remaining)
                      </motion.button>
                    </div>
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

      {/* Modals */}
      <EditReviewModal
        isOpen={isEditModalOpen}
        review={editingReview}
        onSave={handleSaveReview}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingReview(null);
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onConfirm={confirmDeleteReview}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeletingReview(null);
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}
