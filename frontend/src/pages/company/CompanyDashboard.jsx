import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiTool,
  FiClock,
  FiUsers,
  FiEye,
  FiMousePointer,
  FiStar,
  FiMessageSquare,
  FiBookmark,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { getCompanyOverview } from "../../services/companyApi";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

export default function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getCompanyOverview();
        if (cancelled) return;
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || "Unable to load your dashboard.");
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-400" />
        <h1 className="text-xl font-semibold text-white">No company account</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/submit-tool"
            className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Submit a tool
          </Link>
          <Link
            to="/tools"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Browse tools to claim
          </Link>
        </div>
      </div>
    );
  }

  const { info, stats, analytics } = data;

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Company Overview</h1>
        <p className="mt-2 text-slate-400">
          {info?.companyName
            ? `Manage ${info.companyName}'s claimed tools and team.`
            : "Manage your claimed tools and team."}
        </p>
        {info?.companyWebsite && (
          <a
            href={info.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
          >
            {info.companyWebsite} <FiArrowRight className="h-3.5 w-3.5" />
          </a>
        )}
      </header>

      <motion.div variants={cardVariants} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiTool} label="Claimed Tools" value={stats.totalTools} accent="bg-cyan-500/15 text-cyan-400" />
        <StatCard icon={FiClock} label="Pending Claims" value={stats.pendingClaims} accent="bg-amber-500/15 text-amber-400" />
        <StatCard icon={FiUsers} label="Team Members" value={stats.teamMembers} accent="bg-violet-500/15 text-violet-400" />
        <StatCard icon={FiEye} label="Total Views" value={analytics.views.toLocaleString()} accent="bg-emerald-500/15 text-emerald-400" />
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Analytics Snapshot</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <FiMousePointer className="h-3.5 w-3.5" /> Clicks
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{analytics.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <FiStar className="h-3.5 w-3.5" /> Avg Rating
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{analytics.avgRating} / 5</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <FiMessageSquare className="h-3.5 w-3.5" /> Reviews
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{analytics.reviews.toLocaleString()}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <FiBookmark className="h-3.5 w-3.5" /> Bookmarks
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{analytics.bookmarks.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/company/tools"
            className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Manage tools
          </Link>
          <Link
            to="/company/analytics"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            View analytics
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}