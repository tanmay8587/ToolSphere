import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiFolder, FiShare2, FiUser, FiX } from "react-icons/fi";
import { getSharedCollection, buildShareUrl } from "../services/collectionsService";
import { getToolLogoProps } from "../utils/imageOptimization";

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function SharedToolCard({ tool }) {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <img
        {...getToolLogoProps(tool.logo || tool.coverImage, tool.name)}
        onError={(e) => {
          e.currentTarget.src = "/default-logo.png";
        }}
        className="h-10 w-10 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-white group-hover:text-cyan-300 transition">
          {tool.name}
        </h4>
        <p className="truncate text-xs text-slate-400">{tool.category}</p>
      </div>
      <FiArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
    </Link>
  );
}

export default function SharedCollectionPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSharedCollection(shareId);
        if (active) {
          if (data.success) {
            setCollection(data.data);
          } else {
            setError(data.message || "This shared list is not available.");
          }
        }
      } catch (err) {
        if (active) setError("Failed to load this shared list.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-800/50" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
            <FiX className="h-8 w-8 text-cyan-300" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">List not found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            {error || "This shared list may be private or no longer exists."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const tools = collection.tools || [];
  const owner = collection.user || {};

  return (
    <motion.div
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="mx-auto max-w-3xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={cardVariants} className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10"
          >
            <FiArrowRight className="h-4 w-4 rotate-180 text-cyan-300" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <a
            href={buildShareUrl(collection.shareId)}
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white"
          >
            <FiShare2 className="h-4 w-4 text-cyan-300" />
            <span className="hidden sm:inline">Public list</span>
          </a>
        </motion.div>

        <motion.div variants={cardVariants} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
              <FiFolder className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-white">{collection.name}</h1>
              <p className="mt-1 text-sm text-slate-400">
                {tools.length} tool{tools.length === 1 ? "" : "s"}
                {owner.name ? (
                  <span className="inline-flex items-center gap-1.5">
                    {" · "}
                    <FiUser className="h-3.5 w-3.5" />
                    {owner.name}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="space-y-3">
          {tools.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center text-sm text-slate-500">
              This list has no tools yet.
            </p>
          ) : (
            tools.map((tool) => <SharedToolCard key={tool._id} tool={tool} />)
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}