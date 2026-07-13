import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getTools } from "../../services/toolsService";
import useDebounce from "../../hooks/useDebounce";

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearch.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await getTools({ search: debouncedSearch, limit: 6 });
        setSuggestions(data.tools || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      const selected = suggestions[activeIndex];
      navigate(`/tools/${selected.slug}`);
      onClose();
    }
  };

  const handleSelect = (tool) => {
    navigate(`/tools/${tool.slug}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/80 backdrop-blur-sm pt-20 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">Search AI Tools</h2>
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
              placeholder="Search tools, categories, tags..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-4 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Suggestions */}
        <div className="max-h-96 overflow-y-auto px-6 pb-6">
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

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((tool, index) => (
                <button
                  key={tool._id}
                  onClick={() => handleSelect(tool)}
                  className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition-all hover:border-cyan-500 hover:bg-slate-900 ${
                    index === activeIndex ? "border-cyan-500 bg-slate-900" : ""
                  }`}
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
                    <p className="font-medium text-white">{tool.name}</p>
                    <p className="text-sm text-slate-400">{tool.category}</p>
                  </div>
                  <FiArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {!loading && search && suggestions.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-slate-400">No tools found for "{search}"</p>
            </div>
          )}

          {!loading && !search && (
            <div className="py-8 text-center">
              <p className="text-slate-500">Start typing to search for AI tools...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}