import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../layout/AdminLayout";
import {
  FiMail,
  FiUsers,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSend,
} from "react-icons/fi";
import {
  getSubscribers,
  deleteSubscriber,
  resendVerification,
  getNewsletterStats,
} from "../../services/newsletterService";
import { useToast } from "../../components/common/Toast";
import Pagination from "../../components/common/Pagination";

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
function StatusBadge({ status, isVerified }) {
  if (status === "unsubscribed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-500/20">
        <FiXCircle size={12} />
        Unsubscribed
      </span>
    );
  }
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 border border-green-500/20">
        <FiCheckCircle size={12} />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 border border-amber-500/20">
      <FiClock size={12} />
      Pending
    </span>
  );
}

/* =====================================
   PAGE
   ===================================== */
export default function NewsletterSubscribers() {
  const { addToast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalSubscribers: 0,
    verifiedSubscribers: 0,
    pendingVerification: 0,
    unsubscribed: 0,
    newestSubscriber: null,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 0,
  });

  // Filters / search / sort
  const [filters, setFilters] = useState({
    search: "",
    filter: "all",
    sort: "newest",
    page: 1,
    limit: 20,
  });

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // "delete" | "resend"
    subscriber: null,
    loading: false,
  });

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSubscribers({
        search: filters.search,
        filter: filters.filter,
        sort: filters.sort,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      if (result.success) {
        setSubscribers(result.subscribers || []);
        setPagination({
          total: result.total || 0,
          currentPage: result.currentPage || 1,
          totalPages: result.totalPages || 0,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to fetch subscribers");
      addToast(err.message || "Failed to fetch subscribers", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getNewsletterStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      // Stats are non-critical; silently ignore failures
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
  }, [fetchSubscribers, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscribers();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  /* ---- Delete flow ---- */
  const openDeleteModal = (subscriber) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      subscriber,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    const { subscriber } = confirmModal;
    if (!subscriber) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deleteSubscriber(subscriber._id);
      if (result.success) {
        addToast("Subscriber deleted successfully", "success");
        setConfirmModal({ isOpen: false, type: null, subscriber: null, loading: false });
        fetchSubscribers();
        fetchStats();
      } else {
        addToast(result.message || "Failed to delete subscriber", "error");
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to delete subscriber", "error");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ---- Resend flow ---- */
  const openResendModal = (subscriber) => {
    setConfirmModal({
      isOpen: true,
      type: "resend",
      subscriber,
      loading: false,
    });
  };

  const confirmResend = async () => {
    const { subscriber } = confirmModal;
    if (!subscriber) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await resendVerification(subscriber._id);
      if (result.success) {
        addToast("Verification email sent successfully", "success");
        setConfirmModal({ isOpen: false, type: null, subscriber: null, loading: false });
      } else {
        addToast(result.message || "Failed to send verification email", "error");
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to send verification email", "error");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Newsletter Subscribers</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your newsletter subscribers and view subscription status
            </p>
          </div>

          <button
            onClick={() => {
              fetchSubscribers();
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-300">
                <FiUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Subscribers</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.totalSubscribers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3 text-green-300">
                <FiCheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Verified</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.verifiedSubscribers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-300">
                <FiClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending Verification</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.pendingVerification}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-500/10 p-3 text-slate-300">
                <FiXCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Unsubscribed</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.unsubscribed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Newest subscriber info */}
        {stats.newestSubscriber && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200">
            <FiMail className="mr-2 inline h-4 w-4" />
            Newest subscriber:{" "}
            <span className="font-semibold">{stats.newestSubscriber.email}</span>{" "}
            on {formatDate(stats.newestSubscriber.subscribedAt)}
          </div>
        )}

        {/* Filters / Search / Sort */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search by email..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={filters.filter}
            onChange={(e) => handleFilterChange("filter", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange("limit", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={fetchSubscribers}
              className="mt-2 text-sm text-red-200 underline hover:text-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Subscribers Table */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-slate-400">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center">
              <FiMail className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">No subscribers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Subscribed Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Verified
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm text-white">{subscriber.email}</td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={subscriber.status}
                          isVerified={subscriber.isVerified}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(subscriber.subscribedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {subscriber.isVerified ? (
                          <span className="text-green-300">Yes</span>
                        ) : (
                          <span className="text-amber-300">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!subscriber.isVerified && (
                            <button
                              onClick={() => openResendModal(subscriber)}
                              title="Resend verification email"
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500 hover:text-white"
                            >
                              <FiSend className="h-3.5 w-3.5" />
                              Resend
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(subscriber)}
                            title="Delete subscriber"
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500 hover:text-white"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        title="Delete Subscriber"
        message={`Are you sure you want to delete this subscriber? (${confirmModal.subscriber?.email || ""})`}
        confirmText="Delete"
        loading={confirmModal.loading}
        onConfirm={confirmDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, subscriber: null, loading: false })
        }
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "resend"}
        title="Resend Verification Email"
        message="Send a new verification email to this subscriber?"
        confirmText="Send Email"
        loading={confirmModal.loading}
        onConfirm={confirmResend}
        onCancel={() =>
          setConfirmModal({ isOpen: false, type: null, subscriber: null, loading: false })
        }
      />
    </AdminLayout>
  );
}