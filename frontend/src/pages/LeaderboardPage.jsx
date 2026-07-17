import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiStar, FiActivity, FiHeart, FiCalendar, FiTrendingUp, FiUsers, FiThumbsUp, FiAward } from "react-icons/fi";
import {
  getTopReviewers,
  getMostActiveUsers,
  getMostLikedReviews,
  getMonthlyLeaderboard,
  toggleReviewLike,
} from "../services/leaderboardService";
import { useToast, ToastContainer } from "../components/common/Toast";
import { isLoggedIn } from "../utils/auth";

const TABS = [
  { key: "reviewers", label: "Top Reviewers", icon: FiStar },
  { key: "active", label: "Most Active", icon: FiActivity },
  { key: "liked", label: "Most Liked Reviews", icon: FiHeart },
  { key: "monthly", label: "Monthly", icon: FiCalendar },
];

const RANK_STYLES = [
  "from-yellow-400/30 to-amber-500/10 text-yellow-300 border-yellow-400/40",
  "from-slate-300/30 to-slate-400/10 text-slate-200 border-slate-300/40",
  "from-amber-700/30 to-orange-800/10 text-amber-400 border-amber-700/40",
];

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function Avatar({ name, avatar, size = "h-10 w-10" }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${size} rounded-full object-cover border border-white/10`}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  const initials = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 text-sm font-semibold text-white border border-white/10`}>
      {initials}
    </div>
  );
}

function RankBadge({ rank }) {
  const style = RANK_STYLES[rank - 1] || "from-slate-700/30 to-slate-800/10 text-slate-300 border-white/10";
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br ${style} text-sm font-bold`}>
      {rank}
    </div>
  );
}

function UserRow({ entry, rank }) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.06]"
    >
      <RankBadge rank={rank} />
      <Link to={`/users/${entry.id}`} className="shrink-0">
        <Avatar name={entry.name} avatar={entry.avatar} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/users/${entry.id}`}
          className="block truncate font-semibold text-white transition-colors hover:text-cyan-300"
        >
          {entry.name}
        </Link>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {entry.reviewCount != null && (
            <span className="flex items-center gap-1"><FiStar className="h-3.5 w-3.5 text-cyan-400" /> {entry.reviewCount} reviews</span>
          )}
          {entry.avgRating != null && (
            <span>Avg {entry.avgRating}★</span>
          )}
          {entry.reviews != null && (
            <span className="flex items-center gap-1"><FiStar className="h-3.5 w-3.5 text-cyan-400" /> {entry.reviews} reviews</span>
          )}
          {entry.collections != null && (
            <span className="flex items-center gap-1"><FiUsers className="h-3.5 w-3.5 text-fuchsia-400" /> {entry.collections} lists</span>
          )}
          {entry.followers != null && (
            <span className="flex items-center gap-1"><FiUsers className="h-3.5 w-3.5 text-emerald-400" /> {entry.followers} followers</span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg font-bold text-cyan-300">{entry.score}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">points</div>
      </div>
    </motion.div>
  );
}

function ReviewRow({ review, rank }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const loggedIn = isLoggedIn();

  const handleLike = async () => {
    if (!loggedIn || liking) return;
    setLiking(true);
    const res = await toggleReviewLike(review._id);
    setLiking(false);
    if (res.success) {
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.06]"
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/users/${review.author?._id}`} className="shrink-0">
            <Avatar name={review.author?.name} avatar={review.author?.avatar} size="h-7 w-7" />
          </Link>
          <Link
            to={`/users/${review.author?._id}`}
            className="truncate text-sm font-semibold text-white transition-colors hover:text-cyan-300"
          >
            {review.author?.name}
          </Link>
          <span className="text-xs text-slate-500">reviewed</span>
          {review.tool?.slug ? (
            <Link
              to={`/tools/${review.tool.slug}`}
              className="truncate text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              {review.tool.name}
            </Link>
          ) : (
            <span className="truncate text-sm text-slate-400">{review.tool?.name}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-yellow-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < review.rating ? "text-yellow-400" : "text-slate-600"}>★</span>
          ))}
        </div>
        {review.comment && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-300">{review.comment}</p>
        )}
      </div>
      <button
        onClick={handleLike}
        disabled={!loggedIn || liking}
        className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-sm transition-colors ${
          liked
            ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-rose-400/30 hover:text-rose-300"
        } ${!loggedIn ? "cursor-not-allowed opacity-60" : ""}`}
        aria-label={liked ? "Unlike review" : "Like review"}
      >
        <FiThumbsUp className="h-4 w-4" />
        <span className="mt-1 font-semibold">{likeCount}</span>
      </button>
    </motion.div>
  );
}

function SectionLoader() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
      <FiAward className="h-10 w-10 text-slate-600" />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("reviewers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [month, setMonth] = useState("");
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (activeTab === "reviewers") res = await getTopReviewers(10);
      else if (activeTab === "active") res = await getMostActiveUsers(10);
      else if (activeTab === "liked") res = await getMostLikedReviews(10);
      else res = await getMonthlyLeaderboard(10, month || undefined);

      if (res.success) {
        setData(res.data || []);
        if (res.month) setMonth(res.month);
      } else {
        setError(res.message || "Failed to load leaderboard.");
        setData([]);
      }
    } catch (err) {
      setError("Something went wrong while loading the leaderboard.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20">
          <FiTrendingUp className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Community Leaderboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Celebrating the most engaged reviewers and contributors in our community.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Month picker for monthly tab */}
      {activeTab === "monthly" && (
        <div className="mb-6 flex justify-center">
          <input
            type="month"
            value={month}
            onChange={handleMonthChange}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/40"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <SectionLoader />
      ) : data.length === 0 ? (
        <EmptyState
          message={
            activeTab === "liked"
              ? "No reviews have been liked yet. Be the first to like a review!"
              : activeTab === "monthly"
              ? "No reviewers yet for this month."
              : "No data available yet. Start reviewing and contributing to climb the leaderboard!"
          }
        />
      ) : (
        <motion.div
          key={activeTab + month}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {activeTab === "liked"
            ? data.map((review, i) => (
                <ReviewRow key={review._id} review={review} rank={i + 1} />
              ))
            : data.map((entry, i) => (
                <UserRow key={entry.id} entry={entry} rank={i + 1} />
              ))}
        </motion.div>
      )}

      <ToastContainer />
    </motion.div>
  );
}