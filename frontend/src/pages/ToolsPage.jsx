import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { getTools, getCategories } from "../services/toolsService";
import { Link } from "react-router-dom";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import ToggleSwitch from "../components/common/ToggleSwitch";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">

      {/* SEARCH */}
      <div className="relative mb-6">
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
      <div className="mb-8 flex gap-4 flex-wrap">

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

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-red-200 flex items-center justify-between">
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

        ) : tools.length === 0 && !error ? (

          <div className="col-span-full">
            <EmptyState 
              type="search"
              title="No tools found"
              description="Try adjusting your search or filter criteria to find what you're looking for."
            />
          </div>

        ) : (

          tools.map((tool) => (
            <Link
              key={tool._id}
              to={`/tools/${tool.slug}`}
              className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
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
          ))
        )}

      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={handlePageChange}
      />

    </div>
  );
}