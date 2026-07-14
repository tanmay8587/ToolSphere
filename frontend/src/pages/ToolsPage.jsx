import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { getTools, getCategories } from "../services/toolsService";
import { getStatistics } from "../services/statisticsService";
import { Link } from "react-router-dom";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import ToggleSwitch from "../components/common/ToggleSwitch";
import { useComparison } from "../context/ComparisonContext";
import { useToast } from "../components/common/Toast";
import { FiColumns, FiCheck, FiGrid, FiLayers, FiUsers, FiActivity, FiTool } from "react-icons/fi";

function HeroStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <Icon className="h-5 w-5 text-cyan-300" />
      <div className="mt-3 text-2xl font-semibold text-white">
        {value?.toLocaleString() ?? "—"}
      </div>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tools, setTools] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );

  const [pricing, setPricing] = useState(
    searchParams.get("pricing") || "all"
  );

  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true"
  );
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const { isComparing, toggleCompare, maxCompare } = useComparison();
  const { addToast } = useToast();

  const handleCompareToggle = (tool, e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(tool);
    if (result === "max") {
      addToast(`You can compare up to ${maxCompare} tools.`, "error");
    } else if (result === "added") {
      addToast(`Added "${tool.name}" to comparison.`, "success");
    } else if (result === "removed") {
      addToast(`Removed "${tool.name}" from comparison.`, "info");
    }
  };

  // Load categories dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await getCategories();
        const cats = (data.categories || [])
          .map(c => c.name || c._id)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setCategories(cats);
      } catch (err) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Load site statistics for the hero section (non-blocking, display only)
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getStatistics();
        if (active && data?.success && data?.statistics) {
          setStats(data.statistics);
        }
      } catch (err) {
        // Hero stats are decorative; ignore failures
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const debouncedSearch = useDebounce(search, 400);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);

    const params = {
      search: debouncedSearch,
      page: searchParams.get("page") || 1,
      ...(category !== "all" ? { category } : {}),
      ...(pricing !== "all" ? { pricing } : {}),
      ...(featured ? { featured: "true" } : {}),
    };

    try {
      const result = await getTools(params);
      setTools(result?.tools || []);
      setPagination(result?.pagination || { total: 0, page: 1, pages: 0 });
    } catch (err) {
      setError("Failed to load tools. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [debouncedSearch, category, pricing, featured, searchParams]);

  useEffect(() => {
    const params = {};

    if (debouncedSearch) params.search = debouncedSearch;
    if (category !== "all") params.category = category;
    if (pricing !== "all") params.pricing = pricing;
    if (featured) params.featured = "true";
    const page = searchParams.get("page");
    if (page && page !== "1") params.page = page;

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, category, pricing, featured]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  // Apply the "Featured Only" filter client-side alongside the backend
  // (search / category / pricing) filters. When OFF, all tools are shown.
  const displayedTools = useMemo(() => {
    if (!featured) return tools;
    return tools.filter((tool) => tool.featured === true);
  }, [tools, featured]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">

      {/* HERO */}
      <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-10 lg:p-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            <FiGrid className="h-4 w-4" />
            Explore the directory
          </div>

          <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            Discover AI tools for every workflow
          </h1>

          <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
            Search, filter, and compare the best AI tools across writing, coding, design, marketing, and more — all in one place.
          </p>
        </div>

        {/* SMALL STATISTICS */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statsLoading || !stats ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 animate-pulse"
              >
                <div className="h-5 w-5 rounded bg-slate-800" />
                <div className="mt-3 h-7 w-16 rounded bg-slate-800" />
                <div className="mt-2 h-3 w-20 rounded bg-slate-800" />
              </div>
            ))
          ) : (
            <>
              <HeroStat icon={FiTool} value={stats.totalTools} label="AI Tools" />
              <HeroStat icon={FiLayers} value={stats.totalCategories} label="Categories" />
              <HeroStat icon={FiUsers} value={stats.monthlyVisitors} label="Monthly Visitors" />
              <HeroStat icon={FiActivity} value={stats.totalSubscribers} label="Subscribers" />
            </>
          )}
        </div>
      </section>

      {/* CONTROLS */}
      <div className="space-y-6">

      {/* SEARCH */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AI tools..."
          className="w-full rounded-2xl bg-slate-900 px-5 py-4 pl-12 text-white border border-slate-700 outline-none focus:border-cyan-500 transition"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 flex-wrap">

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
        >
          <option value="all">All Categories</option>
          {categoriesLoading ? (
            <option value="" disabled>Loading...</option>
          ) : categories.length === 0 ? (
            <option value="" disabled>No categories</option>
          ) : (
            categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))
          )}
        </select>

        <select
          value={pricing}
          onChange={(e) => setPricing(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
        >
          <option value="all">All Pricing</option>
          <option value="Free">Free</option>
          <option value="Freemium">Freemium</option>
          <option value="Paid">Paid</option>
        </select>

        <label className="flex items-center gap-2 text-white text-sm">
          <ToggleSwitch
            checked={featured}
            onChange={setFeatured}
            aria-label="Featured Only"
          />
          <span className="select-none">⭐ Featured Only</span>
        </label>

      </div>

      </div>

      {/* RESULTS */}
      <section className="space-y-6">

      {/* RESULTS HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Browse
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            All AI tools
          </h2>
        </div>
        <span className="text-sm text-slate-400">
          {pagination.total} {pagination.total === 1 ? "result" : "results"}
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchTools}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* RESULTS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {loading ? (
          <div className="col-span-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-800" />
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-800 rounded" />
                <div className="h-4 w-2/3 bg-slate-800 rounded" />
              </div>
            ))}
          </div>

        ) : displayedTools.length === 0 && !error ? (

          <div className="col-span-full">
            <EmptyState 
              type="search"
              title="No tools found"
              description="Try adjusting your search or filter criteria to find what you're looking for."
            />
          </div>

        ) : (

          displayedTools.map((tool) => {
            const comparing = isComparing(tool._id);
            return (
              <div
                key={tool._id}
                className="group relative rounded-2xl border border-white/10 bg-slate-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <button
                  type="button"
                  onClick={(e) => handleCompareToggle(tool, e)}
                  aria-pressed={comparing}
                  aria-label={comparing ? `Remove ${tool.name} from comparison` : `Add ${tool.name} to comparison`}
                  title={comparing ? "Remove from comparison" : "Add to comparison"}
                  className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    comparing
                      ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                      : "border-white/10 bg-slate-800/80 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200"
                  }`}
                >
                  {comparing ? <FiCheck size={13} /> : <FiColumns size={13} />}
                  {comparing ? "Comparing" : "Compare"}
                </button>

                <Link
                  to={`/tools/${tool.slug}`}
                  className="block rounded-2xl p-5"
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">
                      <img
                        src={tool.logo || tool.coverImage || "/default-logo.png"}
                        alt={tool.name}
                        className="h-12 w-12 rounded-xl object-cover border border-white/10 bg-white/5"
                        onError={(e) => {
                          e.currentTarget.src = "/default-logo.png";
                        }}
                        loading="lazy"
                      />

                      <span className="text-xs text-slate-400">
                        {tool.category}
                      </span>
                    </div>

                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                      {tool.pricing}
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-300 transition">
                    {tool.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      ⭐ {tool.rating || 4.5}
                    </span>

                    <span className="text-xs text-cyan-400 group-hover:underline">
                      View Tool →
                    </span>
                  </div>

                </Link>
              </div>
            );
          })
        )}

      </div>

      </section>

      {/* PAGINATION */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={handlePageChange}
      />

    </div>
  );
}