import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import {
  getContactMessages,
  deleteContactMessage,
  markContactAsRead,
} from "../../services/contactService";
import {
  FiMail,
  FiTrash2,
  FiEye,
  FiCheck,
  FiRefreshCw,
  FiSearch,
  FiMessageSquare,
  FiInbox,
  FiSend,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import Pagination from "../../components/common/Pagination";

// Status Badge Component
const StatusBadge = ({ status }) => {
  if (status === "unread") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        Unread
      </span>
    );
  }
  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
        <FiCheck size={12} />
        Read
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
      <FiSend size={12} />
      Replied
    </span>
  );
};

export default function ContactMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });

  // Load messages
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getContactMessages({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
      });

      if (data.success) {
        setMessages(data.contacts || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.status]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    try {
      await markContactAsRead(id);
      setSuccessMsg("Message marked as read");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark as read");
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete message from "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteContactMessage(id);
      setSuccessMsg("Message deleted successfully");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete message");
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / filters.limit) || 1;

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Truncate text for preview
  const truncate = (text, max = 60) => {
    if (!text) return "";
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
            <p className="mt-2 text-slate-400">
              View and manage all contact form submissions from visitors.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <FiMessageSquare className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Messages</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : total}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <FiInbox className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Unread</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : unreadCount}
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
                <p className="text-sm text-slate-400">Read</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : total - unreadCount}
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
              placeholder="Search by name or email..."
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
            <option value="">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>

          <button
            onClick={loadMessages}
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
            Showing {messages.length} of {total} messages
          </span>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Messages Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Subject</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Message</th>
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
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiInbox className="h-10 w-10 text-slate-600" />
                      <p className="font-medium">No messages found</p>
                      <p className="text-xs text-slate-600">
                        Contact form submissions will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg._id}
                    className={`transition-colors hover:bg-slate-900/70 ${
                      msg.status === "unread"
                        ? "bg-cyan-500/[0.03] border-l-2 border-l-cyan-400"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {msg.name
                            ? msg.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "??"}
                        </div>
                        <span className={`font-medium ${msg.status === "unread" ? "text-white" : "text-slate-300"}`}>
                          {msg.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FiMail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300">{msg.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 max-w-[150px]">
                      <span className="block truncate">
                        {msg.subject || "(No subject)"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 max-w-[200px]">
                      <span className="block truncate">
                        {truncate(msg.message, 80)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={msg.status || (msg.isRead ? "read" : "unread")} />
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <Link
                          to={`/admin/contact-messages/${msg._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600/20 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-600/30"
                          title="View message"
                        >
                          <FiEye size={14} />
                          View
                        </Link>

                        {/* Mark as Read - Only show for unread */}
                        {msg.status === "unread" && (
                          <button
                            onClick={() => handleMarkAsRead(msg._id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                            title="Mark as read"
                          >
                            <FiCheck size={14} />
                            Read
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(msg._id, msg.name)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                          title="Delete message"
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