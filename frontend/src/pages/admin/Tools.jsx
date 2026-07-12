import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import {
  getAllTools,
  deleteTool,
  approveTool,
  rejectTool,
  featureTool,
  getCategories,
} from "../../services/adminApi";
import { FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";

const statusOptions = ["All", "active", "pending", "rejected"];
const featuredOptions = ["All", "true", "false"];

export default function Tools() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTools, setTotalTools] = useState(0);
  
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    status: "All",
    featured: "All",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [newsletterCount, setNewsletterCount] = useState(null);

  // Check if bulk actions are available
  const hasBulkActions = selectedTools.length > 0;

  const loadTools = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getAllTools(filters);
      const list = data.tools || [];
      
      setTools(list);
      setTotalPages(data.totalPages || 1);
      setTotalTools(data.total || 0);

      // Update category list from API if not loaded yet
      if (!categoriesLoaded) {
        try {
          const { data } = await getCategories();
          const cats = (data.categories || [])
            .filter(c => c.isActive !== false)
            .map(c => c.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
          setCategories(["All", ...cats]);
          setCategoriesLoaded(true);
        } catch (err) {
          // Fallback: derive from tools
          const allCats = [...new Set(list.map((t) => t.category).filter(Boolean))];
          setCategories(["All", ...allCats.sort((a, b) => a.localeCompare(b))]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value, // Reset to page 1 on filter change
    }));
  };

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTools(tools.map((t) => t._id));
    } else {
      setSelectedTools([]);
    }
  };

  const handleSelectTool = (id) => {
    setSelectedTools((prev) => 
      prev.includes(id) 
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this tool permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteTool(id);
      setMessage("Tool deleted successfully.");
      setNewsletterCount(null);
      setSelectedTools((prev) => prev.filter((t) => t !== id));
      // Remove the deleted tool from local state immediately
      setTools((prev) => prev.filter((t) => t._id !== id));
      setTotalTools((prev) => prev - 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete tool");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTools.length} tools? This cannot be undone.`)) return;
    
    try {
      setLoading(true);
      // Note: Backend may not support bulk delete, so we'll do individual deletes
      for (const id of selectedTools) {
        await deleteTool(id);
      }
      setMessage(`${selectedTools.length} tools deleted successfully.`);
      setSelectedTools([]);
      loadTools();
    } catch (err) {
      setError("Failed to delete some tools");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tool) => {
    try {
      setLoading(true);
      await approveTool(tool._id);
      setMessage("Tool approved successfully.");
      loadTools();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve tool");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (tool) => {
    const reason = window.prompt("Reason for rejecting or unpublishing this tool:", "");
    if (reason === null) return;

    try {
      setLoading(true);
      await rejectTool(tool._id, { status: "rejected", reason });
      setMessage("Tool unpublished successfully.");
      loadTools();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unpublish tool");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (tool) => {
    try {
      setLoading(true);
      await featureTool(tool._id);
      setMessage(
        `Tool ${tool.featured ? "unmarked" : "marked"} as featured successfully.`
      );
      loadTools();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle feature status");
    } finally {
      setLoading(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header with Bulk Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tools</h1>
            <p className="text-slate-400 mt-2">
              Manage your AI tools, approve or reject submissions, and keep the directory fresh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasBulkActions && (
              <>
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="inline-flex items-center rounded-xl bg-red-600/20 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                >
                  Delete Selected ({selectedTools.length})
                </button>
                <button
                  onClick={() => setSelectedTools([])}
                  className="inline-flex items-center rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                >
                  Clear Selection
                </button>
              </>
            )}
            
            <button
              onClick={() => navigate("/admin/tools/add")}
              className="inline-flex items-center rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600"
            >
              Add Tool
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search tools..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.featured}
            onChange={(e) => handleFilterChange("featured", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            {featuredOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {tools.length} of {totalTools} tools
          </span>
          <button
            onClick={loadTools}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-cyan-400 hover:bg-white/5 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {message && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {message}
            {newsletterCount !== null && (
              <span className="ml-2">
                {newsletterCount > 0
                  ? `Newsletter sent to ${newsletterCount} subscribers.`
                  : "No active newsletter subscribers to notify."}
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTools.length === tools.length && tools.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  />
                </th>
                <th
                  role="button"
                  tabIndex={0}
                  aria-sort={filters.sortBy === "name" ? (filters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                  className="px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort("name")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort("name");
                    }
                  }}
                >
                  Name
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Category</th>
                <th
                  role="button"
                  tabIndex={0}
                  aria-sort={filters.sortBy === "status" ? (filters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                  className="px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort("status")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort("status");
                    }
                  }}
                >
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Featured</th>
                <th
                  role="button"
                  tabIndex={0}
                  aria-sort={filters.sortBy === "createdAt" ? (filters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                  className="px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort("createdAt")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort("createdAt");
                    }
                  }}
                >
                  Created
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Loading tools...
                  </td>
                </tr>
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No tools found.
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool._id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool._id)}
                        onChange={() => handleSelectTool(tool._id)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-semibold">{tool.name}</div>
                      <div className="text-slate-500 text-xs">{tool.slug}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{tool.category}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          tool.status === "active"
                            ? "bg-emerald-500/10 text-emerald-200"
                            : tool.status === "pending"
                            ? "bg-amber-500/10 text-amber-200"
                            : "bg-red-500/10 text-red-200"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {tool.featured ? (
                        <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(tool.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/admin/tools/${tool._id}/edit`)}
                          className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(tool)}
                          className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          {tool.featured ? "Unfeature" : "Feature"}
                        </button>
                        {tool.status !== "active" ? (
                          <button
                            onClick={() => handleApprove(tool)}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReject(tool)}
                            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tool._id)}
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {filters.page} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange("page", Math.max(1, filters.page - 1))}
                disabled={filters.page === 1 || loading}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <FiChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handleFilterChange("page", page)}
                      disabled={loading}
                      className={`
                        rounded-lg px-3 py-2 text-sm font-medium
                        ${filters.page === page 
                          ? "bg-cyan-500 text-white" 
                          : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                        }
                        disabled:opacity-50
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handleFilterChange("page", Math.min(totalPages, filters.page + 1))}
                disabled={filters.page === totalPages || loading}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}