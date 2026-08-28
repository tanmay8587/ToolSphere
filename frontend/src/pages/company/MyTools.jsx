import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEdit2,
  FiLoader,
  FiStar,
  FiEye,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTool,
} from "react-icons/fi";
import { getCompanyTools } from "../../services/companyApi";

const statusStyles = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  revoked: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function MyTools() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getCompanyTools();
        if (cancelled) return;
        if (res.data?.success) setData(res.data.data);
        else setError(res.data?.message || "Unable to load your tools.");
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load your tools.");
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
        <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading tools...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <FiTool className="mx-auto mb-4 h-10 w-10 text-amber-400" />
        <h1 className="text-xl font-semibold text-white">No tools to manage</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <Link
          to="/tools"
          className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
        >
          Browse tools to claim
        </Link>
      </div>
    );
  }

  const { tools = [], claims = [] } = data;

  const claimForTool = (toolId) =>
    claims.find((c) => c.tool?._id === String(toolId) || c.tool === String(toolId));

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">My Tools</h1>
        <p className="mt-2 text-slate-400">
          Manage the tools your company has claimed and updated.
        </p>
      </header>

      {tools.length === 0 ? (
        <motion.div
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"
        >
          <FiShield className="mx-auto mb-4 h-10 w-10 text-slate-500" />
          <h2 className="text-lg font-semibold text-white">No claimed tools yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Once your tool claim is approved, you'll be able to manage and update it here.
          </p>
          <Link
            to="/tools"
            className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Claim a tool
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {tools.map((tool) => {
            const claim = claimForTool(tool._id);
            const claimStatus = claim?.status || "approved";
            return (
              <motion.div
                key={tool._id}
                variants={item}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                  {tool.logo ? (
                    <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-slate-400">{tool.name?.[0] || "T"}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">{tool.name}</h2>
                    {tool.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                        <FiShield className="h-3 w-3" /> Verified
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        statusStyles[claimStatus] || statusStyles.pending
                      }`}
                    >
                      {claimStatus === "approved" && <FiCheckCircle className="h-3 w-3" />}
                      {claimStatus === "pending" && <FiClock className="h-3 w-3" />}
                      {claimStatus === "rejected" && <FiXCircle className="h-3 w-3" />}
                      {claimStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{tool.category}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiEye className="h-3.5 w-3.5" /> {tool.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <FiStar className="h-3.5 w-3.5" /> {tool.rating || 0} ({tool.reviewCount || 0})
                    </span>
                    <span>{tool.pricing}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/tool/${tool.slug}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    View
                  </Link>
                  <Link
                    to={`/company/tools/${tool._id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                  >
                    <FiEdit2 className="h-4 w-4" /> Edit
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {claims.length > 0 && (
        <motion.div variants={item} className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Claim Requests</h2>
          <p className="mb-4 text-sm text-slate-400">
            Track the status of the tool claims your company has submitted.
          </p>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {claim.tool?.name || "Tool"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {claim.companyName} &middot; {claim.contactEmail}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[claim.status] || statusStyles.pending
                  }`}
                >
                  {claim.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}