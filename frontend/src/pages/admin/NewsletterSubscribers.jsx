import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { FiMail, FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { getSubscribers, deleteSubscriber } from "../../services/newsletterService";
import { useToast } from "../../components/common/Toast";
import Pagination from "../../components/common/Pagination";

export default function NewsletterSubscribers() {
  const { addToast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "active",
    page: 1,
    limit: 50,
  });

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSubscribers({
        status: filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      if (result.success) {
        setSubscribers(result.subscribers || []);
        setPagination(result.pagination || {});
      }
    } catch (err) {
      setError(err.message || "Failed to fetch subscribers");
      addToast(err.message || "Failed to fetch subscribers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }

    try {
      const result = await deleteSubscriber(id);

      if (result.success) {
        addToast("Subscriber deleted successfully", "success");
        fetchSubscribers();
      } else {
        addToast(result.message || "Failed to delete subscriber", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to delete subscriber", "error");
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

  const getStatusBadge = (status) => {
    const isActive = status === "active";
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          isActive
            ? "bg-green-500/10 text-green-300 border border-green-500/20"
            : "bg-slate-500/10 text-slate-300 border border-slate-500/20"
        }`}
      >
        {isActive ? "Active" : "Unsubscribed"}
      </span>
    );
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
            onClick={fetchSubscribers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-300">
                <FiUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Subscribers</p>
                <p className="text-2xl font-semibold text-white">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3 text-green-300">
                <FiMail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Subscribers</p>
                <p className="text-2xl font-semibold text-white">
                  {subscribers.filter((s) => s.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-300">
                <FiUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Unsubscribed</p>
                <p className="text-2xl font-semibold text-white">
                  {subscribers.filter((s) => s.status === "unsubscribed").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Filter by Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
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
                      Subscribe Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Unsubscribe Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Source
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
                      <td className="px-6 py-4">{getStatusBadge(subscriber.status)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(subscriber.subscribedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(subscriber.unsubscribedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-500/20">
                          {subscriber.source || "website"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(subscriber._id, subscriber.email)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500 hover:text-white"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
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
          currentPage={filters.page}
          totalPages={pagination.pages}
          onPageChange={(page) => handleFilterChange("page", page)}
        />
      </div>
    </AdminLayout>
  );
}