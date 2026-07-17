import { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX, FiArrowRight, FiBookOpen, FiFolder } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../../services/searchService";
import useDebounce from "../../hooks/useDebounce";

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ tools: [], blogs: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeSection, setActiveSection] = useState("tools");
  const inputRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  // Flatten all results for keyboard navigation
  const allItems = [
    ...results.tools.map((item) => ({ ...item, type: "tool" })),
    ...results.blogs.map((item) => ({ ...item, type: "blog" })),
    ...results.categories.map((item) => ({ ...item, type: "category" })),
  ];

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setResults({ tools: [], blogs: [], categories: [] });
      setActiveIndex(-1);
      setActiveSection("tools");
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch.trim()) {
        setResults({ tools: [], blogs: [], categories: [] });
        return;
      }

      setLoading(true);
      try {
        const data = await globalSearch(debouncedSearch, 20);
        if (data?.success) {
          setResults(data.results || { tools: [], blogs: [], categories: [] });
        } else {
          setResults({ tools: [], blogs: [], categories: [] });
        }
      } catch (err) {
        console.error("Search failed:", err);
        setResults({ tools: [], blogs: [], categories: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (!allItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev < allItems.length - 1 ? prev + 1 : 0;
        setActiveSection(allItems[next].type);
        return next;
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev > 0 ? prev - 1 : allItems.length - 1;
        setActiveSection(allItems[next].type);
        return next;
      });
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = allItems[activeIndex];
      handleSelect(selected);
    }
  };

  const handleSelect = (item) => {
    if (item.type === "tool") {
      navigate(`/tools/${item.slug}`);
    } else if (item.type === "blog") {
      navigate(`/blog/${item.slug}`);
    } else if (item.type === "category") {
      navigate(`/tools?category=${encodeURIComponent(item.name)}`);
    }
    onClose();
  };

  // Helper to highlight matching text
  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-cyan-500/30 px-0.5 text-cyan-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  const hasResults = results.tools.length > 0 || results.blogs.length > 0 || results.categories.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/80 backdrop-blur-sm pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">Search</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close search"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search tools, blogs, categories..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-4 pl-12 pr-4 text-white placeholder:text-slate-400 outline-none focus:border-cyan-500"
              aria-label="Search query"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              role="combobox"
              aria-expanded={allItems.length > 0}
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto px-6 pb-6" id="search-suggestions" role="listbox" aria-label="Search results">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 animate-pulse">
                  <div className="h-12 w-12 rounded-xl bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !search && (
            <div className="py-8 text-center">
              <p className="text-slate-400">Start typing to search for tools, blogs, and categories...</p>
            </div>
          )}

          {!loading && search && !hasResults && (
            <div className="py-8 text-center">
              <p className="text-slate-300">No results found for "{search}"</p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="space-y-4">
              {/* Tools Section */}
              {results.tools.length > 0 && (
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tools ({results.tools.length})
                  </h3>
                  <div className="space-y-2">
                    {results.tools.map((tool, index) => {
                      const globalIndex = index;
                      const isActive = globalIndex === activeIndex && activeSection === "tool";
                      return (
                        <button
                          key={tool._id}
                          onClick={() => handleSelect({ ...tool, type: "tool" })}
                          className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition-all hover:border-cyan-500 hover:bg-slate-900 ${
                            isActive ? "border-cyan-500 bg-slate-900" : ""
                          }`}
                          role="option"
                          aria-selected={isActive}
                          id={`suggestion-${globalIndex}`}
                        >
                          <img
                            src={tool.logo || "/default-logo.png"}
                            alt={tool.name}
                            className="h-12 w-12 rounded-xl object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/default-logo.png";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {highlightMatch(tool.name, search)}
                            </p>
                            <p className="text-sm text-slate-300">
                              {highlightMatch(tool.category, search)}
                            </p>
                          </div>
                          <FiArrowRight className="h-4 w-4 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blogs Section */}
              {results.blogs.length > 0 && (
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Blogs ({results.blogs.length})
                  </h3>
                  <div className="space-y-2">
                    {results.blogs.map((blog, index) => {
                      const globalIndex = results.tools.length + index;
                      const isActive = globalIndex === activeIndex && activeSection === "blog";
                      return (
                        <button
                          key={blog._id}
                          onClick={() => handleSelect({ ...blog, type: "blog" })}
                          className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition-all hover:border-cyan-500 hover:bg-slate-900 ${
                            isActive ? "border-cyan-500 bg-slate-900" : ""
                          }`}
                          role="option"
                          aria-selected={isActive}
                          id={`suggestion-${globalIndex}`}
                        >
                          {blog.coverImage ? (
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
                              <FiBookOpen className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {highlightMatch(blog.title, search)}
                            </p>
                            <p className="text-sm text-slate-300">
                              {highlightMatch(blog.category, search)} • {blog.readingTime || 5} min read
                            </p>
                          </div>
                          <FiArrowRight className="h-4 w-4 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {results.categories.length > 0 && (
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Categories ({results.categories.length})
                  </h3>
                  <div className="space-y-2">
                    {results.categories.map((category, index) => {
                      const globalIndex = results.tools.length + results.blogs.length + index;
                      const isActive = globalIndex === activeIndex && activeSection === "category";
                      return (
                        <button
                          key={category._id}
                          onClick={() => handleSelect({ ...category, type: "category" })}
                          className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition-all hover:border-cyan-500 hover:bg-slate-900 ${
                            isActive ? "border-cyan-500 bg-slate-900" : ""
                          }`}
                          role="option"
                          aria-selected={isActive}
                          id={`suggestion-${globalIndex}`}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                            {category.icon || "📁"}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {highlightMatch(category.name, search)}
                            </p>
                            <p className="text-sm text-slate-300">
                              {highlightMatch(category.description, search)}
                            </p>
                          </div>
                          <FiArrowRight className="h-4 w-4 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}