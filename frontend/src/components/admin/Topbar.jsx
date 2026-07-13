import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSearch, FiMenu, FiX, FiRefreshCw } from "react-icons/fi";
import { adminSearch } from "../../services/adminApi";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

// Page title mapping
const pageTitles = {
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Monitor your AI directory performance and analytics",
  },
  "/admin/tools": {
    title: "Tools",
    description: "Manage your AI tools and submissions",
  },
  "/admin/tools/add": {
    title: "Add Tool",
    description: "Add a new AI tool to the directory",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Configure your admin preferences",
  },
  "/admin/profile": {
    title: "My Profile",
    description: "Manage your account information",
  },
  "/admin/change-password": {
    title: "Change Password",
    description: "Update your account password",
  },
  "/admin/contact-messages": {
    title: "Contact Messages",
    description: "View and manage contact form submissions",
  },
};

// Breadcrumb mapping
const breadcrumbMap = {
  "/admin/dashboard": ["Dashboard"],
  "/admin/tools": ["Tools"],
  "/admin/tools/add": ["Tools", "Add Tool"],
  "/admin/settings": ["Settings"],
  "/admin/profile": ["Profile"],
  "/admin/change-password": ["Profile", "Change Password"],
  "/admin/contact-messages": ["Contact Messages"],
};

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // Get current page info
  const currentPage = pageTitles[pathname] || { 
    title: "Admin", 
    description: "Admin panel" 
  };
  const breadcrumbs = breadcrumbMap[pathname] || ["Admin"];

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await adminSearch(searchQuery);
        setSearchResults(res.data.results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-slate-950 px-4 sm:px-8">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => {
            // Dispatch custom event for mobile menu
            window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Toggle sidebar menu"
        >
          <FiMenu size={20} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {currentPage.title}
          </h2>
          <p className="text-xs text-slate-300 sm:text-sm">
            {currentPage.description}
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* SEARCH */}
        <div ref={searchRef} className="relative hidden md:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tools, users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={handleSearchFocus}
            className="w-48 sm:w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-10 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-white/10"
          />
          {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                aria-label="Clear search"
              >
                <FiX size={14} />
              </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl" role="listbox" aria-label="Search results">
              {searchLoading ? (
                <div className="flex items-center justify-center px-5 py-8">
                  <FiRefreshCw className="animate-spin text-cyan-400" size={20} />
                </div>
              ) : searchResults ? (
                <div className="max-h-96 overflow-y-auto">
                  {/* Tools */}
                  {searchResults.tools?.length > 0 && (
                    <div className="border-b border-white/10 p-3">
                      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Tools</h3>
                      {searchResults.tools.slice(0, 5).map((tool) => (
                        <div
                          key={tool._id}
                          role="option"
                          tabIndex={0}
                          onClick={() => {
                            navigate(`/admin/tools/${tool._id}/edit`);
                            setShowSearchResults(false);
                            setSearchQuery("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/admin/tools/${tool._id}/edit`);
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }
                          }}
                          className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-slate-300">{tool.category} • {tool.status}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Categories */}
                  {searchResults.categories?.length > 0 && (
                    <div className="border-b border-white/10 p-3">
                      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Categories</h3>
                      {searchResults.categories.slice(0, 5).map((cat) => (
                        <div
                          key={cat._id}
                          className="rounded-lg px-2 py-2 text-sm text-slate-300"
                        >
                          <p className="font-medium">{cat.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Users */}
                  {searchResults.users?.length > 0 && (
                    <div className="p-3">
                      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Users</h3>
                      {searchResults.users.slice(0, 5).map((user) => (
                        <div
                          key={user._id}
                          className="rounded-lg px-2 py-2 text-sm text-slate-300"
                        >
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-slate-300">{user.email}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!searchResults.tools?.length && !searchResults.categories?.length && !searchResults.users?.length && (
                    <div className="px-5 py-8 text-center text-sm text-slate-300">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* NOTIFICATION DROPDOWN */}
        <NotificationDropdown />

        {/* PROFILE DROPDOWN */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
