import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../../layout/AdminLayout";
import AnalyticsChart from "../../components/common/AnalyticsChart";
import { getAllToolsAnalytics } from "../../services/toolAnalyticsService";
import {
  FiEye,
  FiMousePointer,
  FiHeart,
  FiBookmark,
  FiBarChart2,
  FiLoader,
  FiTool,
} from "react-icons/fi";

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
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

export default function ToolAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAllToolsAnalytics();
        if (cancelled) return;
        if (res?.success) {
          setData(res);
        } else {
          setError(res?.message || "Unable to load tool analytics.");
        }
      } catch (err) {
        if (!cancelled)
          setError(err.response?.data?.message || "Unable to load tool analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatNum = (n) => (Number(n) || 0).toLocaleString();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading tool analytics...
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <FiBarChart2 className="mx-auto mb-4 h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-semibold text-white">No analytics available</h1>
          <p className="mt-2 text-sm text-slate-400">
            {error || "No tool analytics data has been recorded yet."}
          </p>
        </div>
      </AdminLayout>
    );
  }

    const { totals, traffic, tools } = data;

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <header>
          <h1 className="text-3xl font-bold text-white">Tool Analytics</h1>
          <p className="mt-2 text-slate-400">
            Engagement metrics and traffic trends across all tools.
          </p>
        </header>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={FiEye}
            label="Total Views"
            value={formatNum(totals.views)}
            accent="bg-emerald-500/15 text-emerald-400"
          />
          <MetricCard
            icon={FiMousePointer}
            label="Total Clicks"
            value={formatNum(totals.clicks)}
            accent="bg-cyan-500/15 text-cyan-400"
          />
          <MetricCard
            icon={FiBookmark}
            label="Total Saves"
            value={formatNum(totals.saves)}
            accent="bg-rose-500/15 text-rose-400"
          />
          <MetricCard
            icon={FiHeart}
            label="Total Likes"
            value={formatNum(totals.likes)}
            accent="bg-amber-500/15 text-amber-400"
          />
        </div>

        {/* Traffic chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiBarChart2 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Traffic (last 30 days)</h2>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Views, clicks, likes and saves recorded each day.
          </p>
          <AnalyticsChart data={traffic || []} height={260} />
        </div>

        {/* Top tools table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Top Tools by Engagement</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/60">
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Tool</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold text-emerald-400">Views</th>
                  <th className="px-5 py-3 font-semibold text-cyan-400">Clicks</th>
                  <th className="px-5 py-3 font-semibold text-rose-400">Saves</th>
                  <th className="px-5 py-3 font-semibold text-amber-400">Likes</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tools
                  .slice()
                  .sort(
                    (a, b) =>
                      (b.views || 0) +
                      (b.clicks || 0) +
                      (b.saves || 0) +
                      (b.likes || 0) -
                      ((a.views || 0) +
                        (a.clicks || 0) +
                        (a.saves || 0) +
                        (a.likes || 0))
                  )
                  .slice(0, 20)
                  .map((tool) => (
                    <tr key={tool._id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
                            {tool.logo ? (
                              <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-slate-400">
                                <FiTool className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{tool.name}</p>
                            <p className="text-xs text-slate-500">#{tool.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{tool.category}</td>
                      <td className="px-5 py-4 text-emerald-400">{formatNum(tool.views)}</td>
                      <td className="px-5 py-4 text-cyan-400">{formatNum(tool.clicks)}</td>
                      <td className="px-5 py-4 text-rose-400">{formatNum(tool.saves)}</td>
                      <td className="px-5 py-4 text-amber-400">{formatNum(tool.likes)}</td>
                      <td className="px-5 py-4 text-slate-300">{tool.rating} / 5</td>
                    </tr>
                  ))}
                {tools.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                      No tools found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}

