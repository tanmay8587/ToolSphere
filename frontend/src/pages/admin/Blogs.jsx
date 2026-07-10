import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import {
  FiSearch,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiStar,
  FiEye,
  FiCheck,
  FiFileText,
  FiClock,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";
import {
  getBlogs,
  getBlogStats,
  updateBlogStatus,
  toggleFeaturedBlog,
  deleteBlog,
} from "../../services/blogService";
import { useToast } from "../../components/common/Toast";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import useDebounce from "../../hooks/useDebounce";

/* =====================================
   CONFIRM MODAL
   Reusable confirmation dialog following the
   existing admin modal pattern.
   ===================================== */
function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", onConfirm, onCancel, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   STATUS BADGE
   ===================================== */
function StatusBadge({ status }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
        <FiCheck size={12} />
        Published
      </span>
    );
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
        <FiClock size={12} />
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
      Draft
    </span>
  );
}

/* =====================================
   PAGE
   ===================================== */
export default function Blogs() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    featured: 0,
    totalViews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 0,
  });

  // Filters / search / sort
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    status: "All",
    featured: "All",
    sort: "newest",
    page: 1,
    limit: 10,
  });

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // "delete" | "publish" | "draft"
    blog: null,
    loading: false,
  });

  // Debounced search (reuse existing pattern)
  const debouncedSearch = useDebounce(filters.search, 400);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getBlogs({
        search: debouncedSearch,
        category: filters.category,
        status: filters.status,
        featured: filters.featured,
        sort: filters.sort,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
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
      setError(err.message || "Failed to fetch blogs");
      addToast(err.message || "Failed to fetch blogs", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.category, filters.status, filters.featured, filters.sort, filters.page, filters.limit, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getBlogStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      // Stats are non-critical; silently ignore failures
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchStats();
  }, [fetchBlogs, fetchStats]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  /* ---- Delete flow ---- */
  const openDeleteModal = (blog) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      blog,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    const { blog } = confirmModal;
    if (!blog) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deleteBlog(blog._id);
      if (result.success) {
        addToast("Blog deleted successfully", "success");
        setConfirmModal({ isOpen: false, type: null, blog: null, loading: false });
        fetchBlogs();
        fetchStats();
      } else {
        addToast(result.message || "Failed to delete blog", "error");
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to delete blog", "error");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ---- Publish flow ---- */
  const openPublishModal = (blog) => {
    setConfirmModal({
      isOpen: true,
      type: "publish",
      blog,
      loading: false,
    });
  };

  const confirmPublish = async () => {
    const { blog } = confirmModal;
    if (!blog) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await updateBlogStatus(blog._id, "published");
      if (result.success) {
        addToast("Blog published successfully", "success");
        setConfirmModal({ isOpen: false, type: null, blog: null, loading: false });
        fetchBlogs();
        fetchStats();
      } else {
        addToast(result.message || "Failed to publish blog", "error");
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to publish blog", "error");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ---- Draft flow ---- */
  const openDraftModal = (blog) => {
    setConfirmModal({
      isOpen: true,
      type: "draft",
      blog,
      loading: false,
    });
  };

  const confirmDraft = async () => {
    const { blog } = confirmModal;
    if (!blog) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await updateBlogStatus(blog._id, "draft");
      if (result.success) {
        addToast("Blog moved to draft", "success");
        setConfirmModal({ isOpen: false, type: null, blog: null, loading: false });
        fetchBlogs();
        fetchStats();
      } else {
        addToast(result.message || "Failed to move blog to draft", "error");
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to move blog to draft", "error");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ---- Toggle featured ---- */
  const handleToggleFeatured = async (blog) => {
    try {
      const result = await toggleFeaturedBlog(blog._id);
      if (result.success) {
        addToast(
          `Blog ${blog.featured ? "unmarked" : "marked"} as featured`,
          "success"
        );
        fetchBlogs();
        fetchStats();
      } else {
        addToast(result.message || "Failed to toggle featured", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to toggle featured", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statCards = [
    {
      label: "Total Blogs",
      value: stats.totalBlogs,
      icon: FiFileText,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Published",
      value: stats.published,
      icon: FiCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Draft",
      value: stats.draft,
      icon: FiFileText,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Scheduled",
      value: stats.scheduled,
      icon: FiClock,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Featured",
      value: stats.featured,
      icon: FiStar,
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Blog Management</h1>
            <p className="mt-1 text-sm text-slate-400">
              Create, publish, and manage your blog posts
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/blogs/add")}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600"
          >
            <FiFileText className="h-4 w-4" />
            Add Blog
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters / Search / Sort */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search by title or slug..."
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
            <option value="All">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="AI">AI</option>
            <option value="Tutorial">Tutorial</option>
            <option value="News">News</option>
            <option value="Guide">Guide</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="All">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <select
            value={filters.featured}
            onChange={(e) => handleFilterChange("featured", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="All">All Featured</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {blogs.length} of {pagination.total} blogs
          </span>
          <button
            onClick={() => {
              fetchBlogs();
              fetchStats();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-cyan-400 hover:bg-white/5 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={fetchBlogs}
              className="mt-2 text-sm text-red-200 underline hover:text-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Blogs Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Cover</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Author</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Featured</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiTrendingUp size={14} />
                    Views
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiCalendar size={14} />
                    Published
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    Loading blogs...
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8">
                    <EmptyState
                      type="search"
                      title="No blogs found"
                      description="Try adjusting your search or filter criteria, or create a new blog post."
                    />
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-900/70 transition-colors">
                    <td className="px-4 py-4">
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="h-12 w-16 rounded-lg object-cover border border-slate-700"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/64x48?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-500">
                          <FiFileText className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white font-semibold">{blog.title}</div>
                      <div className="text-slate-500 text-xs">{blog.slug}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{blog.category || "—"}</td>
                    <td className="px-4 py-4 text-slate-300">{blog.author || "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={blog.status} />
                    </td>
                    <td className="px-4 py-4">
                      {blog.featured ? (
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
                      {(blog.views || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {formatDate(blog.publishedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/admin/blogs/${blog._id}/edit`)}
                          title="Edit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          <FiEdit size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(blog)}
                          title="Toggle Featured"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          <FiStar size={14} />
                          {blog.featured ? "Unfeature" : "Feature"}
                        </button>

                        {blog.status !== "published" ? (
                          <button
                            onClick={() => openPublishModal(blog)}
                            title="Publish"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            <FiCheck size={14} />
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => openDraftModal(blog)}
                            title="Move to Draft"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500"
                          >
                            <FiFileText size={14} />
                            Draft
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                          title="Preview"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          <FiEye size={14} />
                          Preview
                        </button>

                        <button
                          onClick={() => openDeleteModal(blog)}
                          title="Delete"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          <FiTrash2 size={14} />
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
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => handleFilterChange("page", page)}
        />
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "delete"}
        title="Delete Blog"
        message={`Are you sure you want to delete "${confirmModal.blog?.title || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={confirmModal.loading}
        onConfirm={confirmDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, blog: null, loading: false })
        }
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "publish"}
        title="Publish Blog"
        message={`Are you sure you want to publish "${confirmModal.blog?.title || ""}"?`}
        confirmText="Publish"
        loading={confirmModal.loading}
        onConfirm={confirmPublish}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, blog: null, loading: false })
        }
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "draft"}
        title="Move to Draft"
        message={`Are you sure you want to move "${confirmModal.blog?.title || ""}" to draft?`}
        confirmText="Move to Draft"
        loading={confirmModal.loading}
        onConfirm={confirmDraft}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, blog: null, loading: false })
        }
      />
    </AdminLayout>
  );
}