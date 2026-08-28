import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiMousePointer,
  FiStar,
  FiMessageSquare,
  FiBookmark,
  FiLoader,
  FiBarChart2,
} from "react-icons/fi";
import { getCompanyAnalytics } from "../../services/companyApi";

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getCompanyAnalytics();
        if (cancelled) return;
        if (res.data?.success) setData(res.data.data);
        else setError(res.data?.message || "Unable to load analytics.");
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load analytics.");
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
        <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <FiBarChart2 className="mx-auto mb-4 h-10 w-10 text-amber-400" />
        <h1 className="text-xl font-semibold text-white">No analytics available</h1>
        <p className="mt-2 text-sm text-slate-400">
          {error || "You don't have any verified tools with analytics yet."}
        </p>
        <Link
          to="/company/tools"
          className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
        >
          View my tools
        </Link>
      </div>
    );
  }

  const { totals, tools } = data;
  const maxViews = tools.length ? Math.max(...tools.map((t) => t.views), 1) : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-2 text-slate-400">
          Performance overview across all of your verified tools.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={FiEye} label="Total Views" value={totals.views.toLocaleString()} accent="bg-emerald-500/15 text-emerald-400" />
        <MetricCard icon={FiMousePointer} label="Clicks" value={totals.clicks.toLocaleString()} accent="bg-cyan-500/15 text-cyan-400" />
        <MetricCard icon={FiStar} label="Avg Rating" value={`${totals.avgRating} / 5`} accent="bg-amber-500/15 text-amber-400" />
        <MetricCard icon={FiMessageSquare} label="Reviews" value={totals.reviews.toLocaleString()} accent="bg-violet-500/15 text-violet-400" />
        <MetricCard icon={FiBookmark} label="Bookmarks" value={totals.bookmarks.toLocaleString()} accent="bg-rose-500/15 text-rose-400" />
      </div>

      {tools.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">
            No verified tools yet. Analytics will appear once your claims are approved.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Tool</th>
                <th className="px-5 py-3 font-semibold">Views</th>
                <th className="px-5 py-3 font-semibold">Clicks</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
                <th className="px-5 py-3 font-semibold">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tools.map((tool) => (
                <tr key={tool._id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">{tool.name?.[0] || "T"}</span>
                        )}
                      </div>
                      <div>
                        <Link to={`/tool/${tool.slug}`} className="font-medium text-white hover:text-cyan-300">
                          {tool.name}
                        </Link>
                        <p className="text-xs text-slate-500">{tool.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-40">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{tool.views.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-500"
                          style={{ width: `${Math.round((tool.views / maxViews) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{tool.clicks.toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-300">{tool.rating} / 5</td>
                  <td className="px-5 py-4 text-slate-300">{tool.reviewCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}