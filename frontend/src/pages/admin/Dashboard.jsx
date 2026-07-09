import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { getDashboard, getAllTools, getCategories, getAdminUsers, adminSearch } from "../../services/adminApi";
import { FiPlus, FiTool, FiUsers, FiGrid, FiEye, FiMousePointer, FiBarChart2, FiSearch, FiX, FiRefreshCw } from "react-icons/fi";

const statCards = [
  { key: "totalTools", label: "Total Tools", icon: FiTool, accent: "from-cyan-500 to-blue-600", path: "/admin/tools" },
  { key: "activeTools", label: "Published Tools", icon: FiTool, accent: "from-emerald-500 to-green-600", path: "/admin/tools" },
  { key: "pendingTools", label: "Pending Approval", icon: FiBarChart2, accent: "from-amber-500 to-orange-600", path: "/admin/tools" },
  { key: "totalCategories", label: "Categories", icon: FiGrid, accent: "from-fuchsia-500 to-purple-600", path: "/admin/settings" },
  { key: "totalUsers", label: "Users", icon: FiUsers, accent: "from-blue-500 to-indigo-600", path: "/admin/settings" },
  { key: "featuredTools", label: "Featured Tools", icon: FiEye, accent: "from-rose-500 to-pink-600", path: "/admin/tools" },
];

const quickActions = [
  { 
    label: "Add New Tool", 
    icon: FiPlus, 
    path: "/admin/tools/add",
    color: "from-cyan-500 to-blue-600"
  },
  { 
    label: "View All Tools", 
    icon: FiTool, 
    path: "/admin/tools",
    color: "from-emerald-500 to-green-600"
  },
  { 
    label: "Manage Categories", 
    icon: FiGrid, 
    path: "/admin/settings",
    color: "from-amber-500 to-orange-600"
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTools: 0,
    activeTools: 0,
    pendingTools: 0,
    featuredTools: 0,
    totalCategories: 0,
    totalUsers: 0,
  });
  const [recentTools, setRecentTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
const [dashboardRes, toolsRes, categoriesRes, usersRes] = await Promise.all([
          getDashboard(),
          getAllTools({ limit: 6 }),
          getCategories(),
          getAdminUsers(),
        ]);

        setStats(dashboardRes.data.stats || stats);
        setRecentTools(toolsRes.data.tools || []);
        setCategories(categoriesRes.data.categories || []);
        setUsers(usersRes.data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search handler
  const handleSearch = useMemo(() => {
    let timer;
    return async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await adminSearch(query);
        setSearchResults(res.data.results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Monitor your AI directory health, featured listings, and account activity.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search tools, categories, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showSearch && searchQuery && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
            {searchLoading ? (
              <div className="flex items-center justify-center px-5 py-8">
                <FiRefreshCw className="animate-spin text-cyan-400" size={20} />
              </div>
            ) : searchResults ? (
              <div className="max-h-96 overflow-y-auto">
                {/* Tools */}
                {searchResults.tools?.length > 0 && (
                  <div className="border-b border-white/10 p-3">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tools</h3>
                    {searchResults.tools.slice(0, 5).map((tool) => (
                      <div
                        key={tool._id}
                        onClick={() => {
                          navigate(`/admin/tools/${tool._id}/edit`);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      >
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-xs text-slate-500">{tool.category} • {tool.status}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Categories */}
                {searchResults.categories?.length > 0 && (
                  <div className="border-b border-white/10 p-3">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</h3>
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
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Users</h3>
                    {searchResults.users.slice(0, 5).map((user) => (
                      <div
                        key={user._id}
                        className="rounded-lg px-2 py-2 text-sm text-slate-300"
                      >
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!searchResults.tools?.length && !searchResults.categories?.length && !searchResults.users?.length && (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => navigate(card.path)}
                className={`group rounded-2xl border border-slate-800 bg-gradient-to-br ${card.accent} p-[1px] text-left transition-all hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="flex items-center gap-4 rounded-[calc(1rem-1px)] bg-slate-950/90 p-5 transition group-hover:bg-slate-950/95">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition group-hover:bg-white/10">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {loading ? "—" : stats[card.key] ?? 0}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`
                    group flex items-center gap-4 rounded-2xl border border-slate-800 bg-gradient-to-br ${action.color} p-[1px]
                    transition-all hover:scale-[1.02] hover:shadow-lg
                  `}
                >
                  <div className="flex flex-1 items-center gap-4 rounded-[calc(1rem-1px)] bg-slate-950/90 p-5 transition group-hover:bg-slate-950/95">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition group-hover:bg-white/10">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-medium text-white">{action.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* Recent Tools */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Tools</h2>
                <p className="text-sm text-slate-400">Latest submissions and updates</p>
              </div>
              <button
                onClick={() => navigate("/admin/tools")}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3.5">
                      <div className="h-5 w-40 rounded bg-slate-800 mb-2"></div>
                      <div className="h-4 w-28 rounded bg-slate-800"></div>
                    </div>
                  ))}
                </div>
              ) : recentTools.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-sm text-slate-500">No tools yet. Add your first tool to get started.</p>
                </div>
              ) : (
                recentTools.map((tool) => (
                  <div 
                    key={tool._id} 
                    onClick={() => navigate(`/admin/tools/${tool._id}/edit`)}
                    className="group flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3.5 transition-all hover:border-cyan-500/30 hover:bg-slate-900"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white transition group-hover:text-cyan-300">{tool.name}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {tool.category} • <span className="capitalize">{tool.status}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {new Date(tool.createdAt).toLocaleDateString()}
                      </span>
                      <FiMousePointer className="text-slate-600 opacity-0 transition group-hover:opacity-100" size={14} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Overview */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Quick Overview</h2>
              <p className="text-sm text-slate-400">Categories and users at a glance</p>
            </div>
            
            <div className="space-y-5">
              {/* Categories */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>Categories</span>
                  <span>{stats.totalCategories}</span>
                </div>
                <div className="space-y-2">
                  {categories.length > 0 ? (
                    <>
                      {categories.slice(0, 4).map((category) => (
                        <div 
                          key={category._id || category.name} 
                          className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                        >
                          <span className="truncate">{category.name}</span>
                          <span className="ml-2 text-xs text-slate-500">{category.count} tools</span>
                        </div>
                      ))}
                      {categories.length > 4 && (
                        <p className="text-xs text-slate-500">+{categories.length - 4} more</p>
                      )}
                    </>
                  ) : (
                    !loading && (
                      <p className="text-xs text-slate-500">No categories found</p>
                    )
                  )}
                </div>
              </div>

              {/* Users */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>Users</span>
                  <span>{stats.totalUsers}</span>
                </div>
                <div className="space-y-2">
                  {users.length > 0 ? (
                    users.slice(0, 4).map((user) => (
                      <div 
                        key={user._id} 
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-300"
                      >
                        <p className="font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    ))
                  ) : (
                    !loading && (
                      <p className="text-xs text-slate-500">No registered users yet.</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}