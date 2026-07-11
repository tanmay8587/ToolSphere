import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiSearch, FiClock, FiEye, FiStar, FiCalendar } from "react-icons/fi";
import { getPublicBlogs } from "../services/publicBlogService";
import { getAllCategories } from "../services/blogCategoryService";
import useDebounce from "../hooks/useDebounce";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";

const calculateReadingTime = (html = "") => {
  const text = html ? html.replace(/<[^>]*>/g, "") : "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, totalPages: 0 });

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [categories, setCategories] = useState([]);

  const debouncedSearch = useDebounce(search, 400);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPublicBlogs({
        search: debouncedSearch,
        category,
        sort,
        page: searchParams.get("page") || "1",
        limit: "9",
      });
      if (result.success) {
        setBlogs(result.blogs || []);
        setPagination({
          total: result.total || 0,
          currentPage: result.currentPage || 1,
          totalPages: result.totalPages || 0,
        });
      }
    } catch (err) {
      setError("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  // Load categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getAllCategories();
        if (result.success) {
          setCategories(result.categories || []);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [debouncedSearch, category, sort, searchParams]);

  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (category !== "All") params.category = category;
    if (sort !== "newest") params.sort = sort;
    const page = searchParams.get("page");
    if (page && page !== "1") params.page = page;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, category, sort]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const featuredBlogs = blogs.filter((b) => b.featured);
  const featuredHero = featuredBlogs[0];
  const otherBlogs = blogs.filter((b) => !featuredHero || b._id !== featuredHero._id);

  return (
    <>
      <Helmet>
        <title>Blog - ToolSphere | Insights on AI Tools</title>
        <meta name="description" content="Explore the latest articles, guides, and insights about AI tools, technology trends, and productivity." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">Blog</p>
          <h1 className="text-3xl font-semibold sm:text-4xl text-white">
            Fresh insights on AI products
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Explore the latest articles, guides, and tutorials about AI tools, technology trends, and productivity.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="newest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchBlogs} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">Retry</button>
          </div>
        )}

        {/* Featured Hero */}
        {!loading && featuredHero && (
          <Link
            to={`/blog/${featuredHero.slug}`}
            className="group block rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-950 overflow-hidden hover:border-cyan-400 transition-all duration-300"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {featuredHero.coverImage && (
                <div className="h-48 md:h-full overflow-hidden">
                  <img
                    src={featuredHero.coverImage}
                    alt={featuredHero.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 mb-2">
                  <FiStar size={12} />
                  Featured
                </span>
                <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition">
                  {featuredHero.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400 line-clamp-3">
                  {featuredHero.excerpt}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><FiCalendar size={12} />{formatDate(featuredHero.publishedAt)}</span>
                  <span className="flex items-center gap-1"><FiClock size={12} />{featuredHero.readingTime || calculateReadingTime(featuredHero.content)} min</span>
                  <span className="flex items-center gap-1"><FiEye size={12} />{featuredHero.views || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Blog Cards Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4">
                <div className="h-40 bg-slate-800 rounded-xl" />
                <div className="h-4 w-1/3 bg-slate-800 rounded" />
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-800 rounded" />
                <div className="h-4 w-2/3 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <EmptyState
            type="search"
            title="No articles found"
            description="Try adjusting your search or filter criteria to find what you're looking for."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherBlogs.length > 0 ? otherBlogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className="group rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                {blog.coverImage && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    {blog.category ? (
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        {blog.category}
                      </span>
                    ) : <span />}
                    {blog.featured && (
                      <span className="text-xs text-fuchsia-400 flex items-center gap-1">
                        <FiStar size={10} />
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1"><FiCalendar size={12} />{formatDate(blog.publishedAt)}</span>
                    <span className="flex items-center gap-1"><FiClock size={12} />{blog.readingTime || calculateReadingTime(blog.content)} min</span>
                    <span className="flex items-center gap-1"><FiEye size={12} />{blog.views || 0}</span>
                  </div>
                </div>
              </Link>
            )) : blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className="group rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                {blog.coverImage && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    {blog.category ? (
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        {blog.category}
                      </span>
                    ) : <span />}
                  </div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1"><FiCalendar size={12} />{formatDate(blog.publishedAt)}</span>
                    <span className="flex items-center gap-1"><FiClock size={12} />{blog.readingTime || calculateReadingTime(blog.content)} min</span>
                    <span className="flex items-center gap-1"><FiEye size={12} />{blog.views || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}