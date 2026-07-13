import { motion } from 'framer-motion';
import { FiArrowRight, FiSearch, FiStar, FiZap, FiLoader, FiCheck } from 'react-icons/fi';
import { Link, useNavigate } from "react-router-dom";

import { useEffect, useState, memo } from "react";
import { getFeaturedTools, getCategories, getTools } from "../services/toolsService";
import { subscribeToNewsletter } from "../services/newsletterService";
import { getStatistics } from "../services/statisticsService";
import { getTrendingBlogs } from "../services/publicBlogService";
import { ToastContainer, useToast } from "../components/common/Toast";
import CategoryIcon from "../components/common/CategoryIcon";
import EmptyState from "../components/common/EmptyState";
import BlogCard from "../components/blog/BlogCard";
import { isLoggedIn } from "../utils/auth";

// Memoized so the toast container (and its Toast children, which reset their
// auto-dismiss timers on every re-render) does NOT re-render on unrelated
// HomePage state changes such as typing in the search box. `toasts` and
// `removeToast` are stable references between toast changes, so memo is safe.
const MemoizedToastContainer = memo(ToastContainer);

const trendingTools = [
  {
    name: 'ChatGPT',
    category: 'Writing',
    rating: 4.9,
    pricing: 'Freemium',
    description: 'A versatile conversational AI assistant for brainstorming and writing.'
  },
  {
    name: 'Midjourney',
    category: 'Image',
    rating: 4.8,
    pricing: 'Paid',
    description: 'Create stunning visuals with text prompts and style control.'
  },
  {
    name: 'Notion AI',
    category: 'Productivity',
    rating: 4.7,
    pricing: 'Freemium',
    description: 'Enhance your workspace with AI-powered summaries and writing.'
  }
];

export default function HomePage() {

  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [featuredTools, setFeaturedTools] = useState([]);
  const [latestTools, setLatestTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestToolsLoading, setLatestToolsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [homeStats, setHomeStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Trending blogs state
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email) => {
    return emailRegex.test(email.trim());
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    // For guest users, validate email
    if (!isLoggedIn()) {
      if (!newsletterEmail.trim()) {
        addToast("Please enter your email address", "error");
        return;
      }

      if (!validateEmail(newsletterEmail)) {
        addToast("Please enter a valid email address", "error");
        return;
      }
    }

    setNewsletterLoading(true);

    try {
      const result = await subscribeToNewsletter(newsletterEmail);

      if (result.success) {
        if (result.alreadySubscribed) {
          // Already verified subscriber
          addToast(
            "You are already subscribed to ToolSphere newsletter.",
            "info"
          );
        } else if (result.pendingVerification) {
          // Existing subscriber who is still pending verification
          addToast(
            "Please check your email and verify your subscription.",
            "info"
          );
        } else {
          // New (or re-verification) subscription — verification still pending
          addToast(
            "Check your email 📩\n\nWe sent a confirmation link to your email.\nPlease verify your subscription to receive ToolSphere AI updates.",
            "success",
            6000
          );
          if (!isLoggedIn()) {
            setNewsletterEmail(""); // Clear input on success for guests
          }
        }
      } else {
        addToast(result.message || "Failed to subscribe", "error");
      }
    } catch (error) {
      addToast(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      setNewsletterLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [featured, cats] = await Promise.all([
          getFeaturedTools(),
          getCategories(),
        ]);

        setFeaturedTools(featured.tools || []);
        setCategories(cats.categories || []);

      } catch (err) {
        const errorMessage = err.message || "Failed to load categories and tools";
        setError(errorMessage);
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadLatestTools() {
      try {
        setLatestToolsLoading(true);
        
        // Fetch latest tools sorted by newest (sort=newest)
        const data = await getTools({
          sort: "newest",
          limit: 6,
        });

        setLatestTools(data.tools || []);
      } catch (err) {
        console.error("Error loading latest tools:", err);
        setLatestTools([]);
      } finally {
        setLatestToolsLoading(false);
      }
    }

    loadLatestTools();
  }, []);

  useEffect(() => {
    async function loadStatistics() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        const statsData = await getStatistics();
        
        if (statsData.success && statsData.statistics) {
          setHomeStats(statsData.statistics);
        }
      } catch (err) {
        console.error("Error loading statistics:", err);
        setStatsError("Failed to load statistics");
      } finally {
        setStatsLoading(false);
      }
    }

    loadStatistics();
  }, []);

  useEffect(() => {
    async function loadTrendingBlogs() {
      try {
        setTrendingLoading(true);
        setTrendingError(null);

        const data = await getTrendingBlogs();

        if (data.success) {
          setTrendingBlogs(data.blogs || []);
        } else {
          setTrendingBlogs([]);
        }
      } catch (err) {
        console.error("Error loading trending blogs:", err);
        setTrendingError("Failed to load trending blogs");
        setTrendingBlogs([]);
      } finally {
        setTrendingLoading(false);
      }
    }

    loadTrendingBlogs();
  }, []);

  useEffect(() => {
    let active = true;

    const loadSuggestions = async () => {
      if (!search.trim()) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);

      try {
        const data = await getTools({
          search,
          limit: 5,
        });

        if (active) {
          setSuggestions(data.tools || []);
        }
      } catch (err) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(loadSuggestions, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 lg:px-8">

      {/* HERO SECTION */}
      <section className="grid items-center gap-8 rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr] lg:p-12">

        <div className="space-y-6">

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            <FiZap className="h-4 w-4" />
            Discover the future of AI products
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Find the best AI tools for every workflow.
            </h1>
            <p className="max-w-2xl text-lg text-slate-200 sm:text-xl">
              Explore curated AI platforms for writing, coding, design, marketing, and more — all in one place.
            </p>
          </div>

          {/* SEARCH (SAFE INPUT HANDLING) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-lg sm:flex-row">

            <div className="relative flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3">
              <FiSearch className="h-5 w-5 text-slate-300" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/tools?search=${encodeURIComponent(search)}`);
                  }
                }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                placeholder="Search AI tools, categories, tags..."
                aria-label="Search AI tools"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="home-search-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={selectedIndex >= 0 ? `home-suggestion-${selectedIndex}` : undefined}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/10 bg-slate-900 shadow-xl z-50" id="home-search-suggestions" role="listbox" aria-label="Search suggestions">
                  {suggestions.map((tool, index) => (
                      <div
                        key={tool._id || tool.name}
                        role="option"
                        aria-selected={selectedIndex === index}
                        id={`home-suggestion-${index}`}
                        tabIndex={-1}
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/tools/${tool.slug}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setShowSuggestions(false);
                            navigate(`/tools/${tool.slug}`);
                          }
                        }}
                        className={`cursor-pointer px-4 py-3 hover:bg-slate-800 ${selectedIndex === index ? 'bg-slate-800' : ''}`}
                      >
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-slate-300">{tool.category}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <button
              onClick={() => navigate(`/tools?search=${encodeURIComponent(search)}`)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Explore
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            {statsLoading ? (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Loading...</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Real ratings</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">New releases weekly</span>
              </>
            ) : homeStats ? (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {homeStats.totalTools > 0 ? `${homeStats.totalTools}+` : "0"} AI tools
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Real ratings</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">New releases weekly</span>
              </>
            ) : (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">100+ curated tools</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Real ratings</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">New releases weekly</span>
              </>
            )}
          </div>

        </div>

        {/* RIGHT SIDE CARD */}
        <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-xl">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Trending now</p>
              <h2 className="mt-1 text-2xl font-semibold">AI Design Stack</h2>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-300">
              <FiZap className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {trendingTools.map((tool, index) => (
              <div key={tool.name || index} className="rounded-2xl border border-white/10 bg-white/5 p-4">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-slate-300">{tool.category}</p>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    <FiStar className="h-4 w-4" />
                    <span className="text-sm">{tool.rating}</span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  {tool.description}
                </p>

              </div>
            ))}
          </div>

        </div>

      </section>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-6 animate-pulse space-y-4"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-800" />
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800 rounded" />
              <div className="h-3 w-2/3 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* LATEST TOOLS */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Latest
            </p>
            <h2 className="text-2xl font-semibold">Newest AI tools</h2>
          </div>
          <Link to="/tools" className="text-sm text-cyan-300 transition hover:text-cyan-200">
            View all
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {latestToolsLoading ? (
            // Loading skeleton for latest tools
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800" />
                  <div className="h-6 w-20 rounded-full bg-slate-800" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-800 rounded" />
                <div className="h-9 w-full bg-slate-800 rounded-full" />
              </div>
            ))
          ) : latestTools.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                type="tool"
                title="No latest tools"
                description="New tools will appear here as they are published. Check back soon!"
              />
            </div>
          ) : (
            latestTools.map((tool) => (
              <div key={tool._id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
                <div className="flex items-center justify-between">
                  <img
                    src={tool.logo || tool.coverImage || "/default-logo.png"}
                    alt={tool.name}
                    className="h-12 w-12 rounded-2xl object-cover border border-white/10 bg-white/5"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-logo.png";
                    }}
                    loading="lazy"
                  />
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                    {tool.pricing}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold">{tool.name}</h3>
                <p className="mt-2 text-sm text-slate-300 line-clamp-2">{tool.description}</p>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                  <span>{tool.category}</span>
                  {tool.rating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <FiStar className="h-4 w-4" /> {tool.rating}
                    </span>
                  )}
                </div>

                <Link
                  to={`/tools/${tool.slug}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  View Details
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section>

        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Categories
            </p>
            <h2 className="text-2xl font-semibold">Featured categories</h2>
          </div>

          <Link
            to="/categories"
            className="text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            View all
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-200 underline hover:text-red-100"
            >
              Try refreshing the page
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {loading ? (
            // Loading skeleton for categories
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 p-[1px]"
              >
                <div className="rounded-[1.45rem] bg-slate-950/90 p-5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-slate-800" />
                    <div className="h-6 w-20 rounded-full bg-slate-800" />
                  </div>
                  <div className="mt-6 h-7 w-3/4 bg-slate-800 rounded" />
                  <div className="mt-2 h-4 w-full bg-slate-800 rounded" />
                </div>
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-4">
              <EmptyState
                type="folder"
                title="No categories yet"
                description="Categories will appear here once tools are organized into different categories. Check back soon!"
              />
            </div>
          ) : (
            categories.map((category) => (
              <Link
                key={category._id || category.name}
                to={`/tools?category=${encodeURIComponent(category.name || category._id)}`}
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="cursor-pointer rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 p-[1px]"
                >
                  <div className="rounded-[1.45rem] bg-slate-950/90 p-5">

                    <div className="flex items-center justify-between">
                      <CategoryIcon
                        category={category.name || category._id}
                        icon={category.icon}
                        size="xl"
                      />

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                        {category.count} tools
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-semibold">
                      {category.name || category._id}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Discover AI tools for {category.name || category._id}.
                    </p>

                  </div>
                </motion.div>
              </Link>
            ))
          )}

        </div>

      </section>

      {/* POPULAR */}
      <section>

        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-fuchsia-300">
              Popular
            </p>
            <h2 className="text-2xl font-semibold">Popular AI tools</h2>
          </div>

          <Link to="/tools" className="text-sm text-cyan-300 transition hover:text-cyan-200">
            Browse all
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {featuredTools.map((tool) => (
            <div key={tool._id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">

              <div className="flex items-center justify-between">
                <img
                  src={tool.logo || tool.coverImage || "/default-logo.png"}
                  alt={tool.name}
                  className="h-12 w-12 rounded-2xl object-cover border border-white/10 bg-white/5"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/default-logo.png";
                  }}
                  loading="lazy"
                />
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                  {tool.pricing}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">{tool.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{tool.description}</p>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>{tool.category}</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <FiStar className="h-4 w-4" /> {tool.rating}
                </span>
              </div>

              <Link
                to={`/tools/${tool.slug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                View Details
                <FiArrowRight className="h-4 w-4" />
              </Link>

            </div>
          ))}

        </div>

      </section>

      {/* TRENDING BLOGS */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Trending
            </p>
            <h2 className="text-2xl font-semibold">Popular blog posts</h2>
          </div>

          <Link to="/blog" className="text-sm text-cyan-300 transition hover:text-cyan-200">
            View all
          </Link>
        </div>

        {trendingError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{trendingError}</p>
          </div>
        ) : trendingLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
              >
                <div className="h-40 bg-slate-800 rounded-xl" />
                <div className="h-4 w-1/3 bg-slate-800 rounded" />
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : trendingBlogs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
            <p className="text-sm text-slate-300">No trending posts yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trendingBlogs.map((blog) => (
              <BlogCard key={blog._id || blog.slug} blog={blog} />
            ))}
          </div>
        )}
      </section>

      {/* NEWSLETTER */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-indigo-500/20 px-6 py-12 text-center shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:px-8 sm:py-16 lg:px-12 lg:py-20">

        {/* Subtle glass highlight overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-60" />

        <div className="relative mx-auto max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">
            Join the Newsletter
          </p>

          <h2 className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            Never Miss a New AI Tool
          </h2>

          <p className="mx-auto text-base text-white sm:text-lg lg:text-xl">
            Get notified when new AI tools, product launches, and important updates are published.
          </p>
        </div>

        <form onSubmit={handleNewsletterSubmit} className="relative mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-3">

          {!isLoggedIn() && (
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              disabled={newsletterLoading}
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-white placeholder:text-slate-300 backdrop-blur-md transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:flex-1"
              placeholder="you@example.com"
              aria-label="Email for newsletter subscription"
            />
          )}

          <button
            type="submit"
            disabled={newsletterLoading}
            className="w-[220px] rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 flex-shrink-0"
          >
            {newsletterLoading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : (
              "Subscribe to Newsletter"
            )}
          </button>

        </form>

        <div className="relative mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-200">
          <span className="inline-flex items-center gap-2">
            <FiCheck className="h-4 w-4 text-emerald-400" />
            Weekly AI Updates
          </span>
          <span className="inline-flex items-center gap-2">
            <FiCheck className="h-4 w-4 text-emerald-400" />
            No Spam
          </span>
          <span className="inline-flex items-center gap-2">
            <FiCheck className="h-4 w-4 text-emerald-400" />
            Unsubscribe Anytime
          </span>
        </div>

      </section>

      {/* Toast Container */}
      <MemoizedToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
}