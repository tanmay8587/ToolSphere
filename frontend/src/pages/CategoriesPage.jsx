import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCategories } from "../services/toolsService";
import EmptyState from "../components/common/EmptyState";
import { getCategoryIcon } from "../utils/categoryIcons";

// Per-category gradient badge palette — each category gets its own colorful gradient.
const GRADIENTS = [
  "from-teal-400 to-cyan-500",
  "from-cyan-400 to-blue-500",
  "from-blue-400 to-indigo-500",
  "from-indigo-400 to-violet-500",
  "from-violet-400 to-fuchsia-500",
  "from-fuchsia-400 to-pink-500",
  "from-pink-400 to-rose-500",
  "from-rose-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-cyan-500",
  "from-purple-400 to-indigo-500",
];

// Stable gradient selection based on the category id/name.
function getGradient(key = "") {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        const data = await getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* GRID */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <div className="col-span-full grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="h-[68px] w-[68px] rounded-2xl bg-slate-800" />
                  <div className="h-7 w-20 rounded-full bg-slate-800" />
                </div>
                <div className="mt-6 h-7 w-3/4 rounded-lg bg-slate-800" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-800" />
                  <div className="h-4 w-2/3 rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              type="folder"
              title="No categories found"
              description="Categories will appear here once tools are added to the directory."
            />
          </div>
        ) : (
          categories.map((category) => {
            const isActive = activeCategory === category._id;
            const IconComponent = getCategoryIcon(category.name || category._id);
            const gradient = getGradient(category._id || category.name);

            return (
              <Link
                key={category._id}
                to={`/tools?category=${encodeURIComponent(category._id)}`}
                className={`group relative flex h-full flex-col rounded-[24px] border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${
                  isActive
                    ? "border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.07] to-transparent"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                {/* Top: Gradient icon badge + count */}
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-black/20`}
                  >
                    {category.icon && category.icon.startsWith("http") ? (
                      <img
                        src={category.icon}
                        alt={category.name || category._id}
                        className="h-9 w-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <IconComponent className="h-8 w-8 text-white" />
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-200 group-hover:border-cyan-500/20 group-hover:text-cyan-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {category.count} tools
                  </span>
                </div>

                {/* Title */}
                <h2 className="mt-6 text-2xl font-bold text-white transition-colors duration-200 group-hover:text-cyan-300">
                  {category._id}
                </h2>

                {/* Description */}
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
                  {category.description || "Discover AI tools in this category."}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}