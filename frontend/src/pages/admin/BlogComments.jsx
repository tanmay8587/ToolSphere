import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../layout/AdminLayout";
import {
  getAdminComments,
  approveComment,
  rejectComment,
  deleteComment,
} from "../../services/blogCommentService";
import {
  FiMessageSquare,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiSearch,
  FiClock,
  FiUser,
  FiInbox,
} from "react-icons/fi";
import Pagination from "../../components/common/Pagination";
import { formatToIndiaDate } from "../../utils/dateFormatter";
import { useToast } from "../../components/common/Toast";

// Status Badge
const StatusBadge = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
        <FiCheck size={12} />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
        <FiX size={12} />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      Pending
    </span>
  );
};

export default function BlogCommentsAdmin() {
  const { addToast } = useToast();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminComments({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      if (data.success) {
        setComments(data.comments || []);
        setTotal(data.total || 0);
        setPendingCount(data.pendingCount || 0);
        setApprovedCount(data.approvedCount || 0);
        setRejectedCount(data.rejectedCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.status, filters.search]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  const handleApprove = async (id) => {
    try {
      await approveComment(id);
      addToast("Comment approved", "success");
      loadComments();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to approve", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectComment(id);
      addToast("Comment rejected", "info");
      loadComments();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to reject", "error");
    }
  };

  const handleDelete = async (id, author) => {
    if (!window.confirm(`Delete comment by "${author}"? This also removes its replies.`)) {
      return;
    }
    try {
      await deleteComment(id);
      addToast("Comment deleted", "success");
      loadComments();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const totalPages = Math.ceil(total / filters.limit) || 1;

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const truncate = (text, max = 120) => {
    if (!text) return "";
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Blog Comments</h1>
            <p className="mt-2 text-slate-400">
              Moderate comments and replies submitted on blog posts.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <FiInbox className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : pendingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <FiCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Approved</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : approvedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <FiX className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Rejected</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search by blog title..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={loadComments}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {comments.length} of {total} comments
          </span>
        </div>

        {/* Success / Error */}
        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Author</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Blog</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Comment</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiClock size={14} />
                    Date
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    Loading comments...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiMessageSquare className="h-10 w-10 text-slate-600" />
                      <p className="font-medium">No comments found</p>
                      <p className="text-xs text-slate-600">
                        Comments submitted on blogs will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                comments.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-slate-900/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {(c.authorName || "A")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-medium text-white">{c.authorName}</span>
                          {c.isGuest && (
                            <span className="ml-2 rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
                              Guest
                            </span>
                          )}
                          {c.parentComment && (
                            <span className="ml-2 rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
                              Reply
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[160px]">
                      <span className="block truncate text-slate-300">
                        {c.blog?.title || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[280px]">
                      <span className="block truncate text-slate-400">
                        {truncate(c.content, 100)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatToIndiaDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {c.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(c._id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                            title="Approve"
                          >
                            <FiCheck size={14} />
                            Approve
                          </button>
                        )}
                        {c.status !== "rejected" && (
                          <button
                            onClick={() => handleReject(c._id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600/20 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-600/30 disabled:opacity-50"
                            title="Reject"
                          >
                            <FiX size={14} />
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c._id, c.authorName)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                          title="Delete"
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
        {totalPages > 1 && (
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => handleFilterChange("page", page)}
          />
        )}
      </div>
    </AdminLayout>
  );
}