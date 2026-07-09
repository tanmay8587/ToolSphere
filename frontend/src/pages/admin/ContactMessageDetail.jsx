import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import {
  getContactMessageById,
  markContactAsRead,
  deleteContactMessage,
} from "../../services/contactService";
import {
  FiArrowLeft,
  FiMail,
  FiUser,
  FiCalendar,
  FiMessageSquare,
  FiCheck,
  FiTrash2,
  FiSend,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";

export default function ContactMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load message details
  const loadMessage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getContactMessageById(id);
      if (data.success) {
        setMessage(data.contact);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load message");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMessage();
  }, [loadMessage]);

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (!message || message.status === "read") return;

    setActionLoading(true);
    try {
      await markContactAsRead(id);
      setSuccessMsg("Message marked as read");
      setMessage((prev) => ({ ...prev, status: "read", isRead: true }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark as read");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Delete this message? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteContactMessage(id);
      navigate("/admin/contact-messages");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete message");
      setActionLoading(false);
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!message) return null;
    const status = message.status || (message.isRead ? "read" : "unread");

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500 mx-auto"></div>
            <p className="text-slate-400">Loading message...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !message) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/contact-messages"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <FiArrowLeft size={16} />
              Back to Messages
            </Link>
          </div>
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!message) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/contact-messages"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <FiArrowLeft size={16} />
              Back to Messages
            </Link>
          </div>
          <div className="rounded-2xl bg-slate-900/50 px-4 py-12 text-center text-slate-400">
            <FiAlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="font-medium">Message not found</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const status = message.status || (message.isRead ? "read" : "unread");

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/contact-messages"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <FiArrowLeft size={16} />
                Back
              </Link>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">Contact Message</h1>
            <p className="mt-2 text-slate-400">
              View and manage this contact form submission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status === "unread" && (
              <button
                onClick={handleMarkAsRead}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
              >
                <FiCheck size={16} />
                Mark as Read
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600/20 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
            >
              <FiTrash2 size={16} />
              Delete
            </button>
          </div>
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

        {/* Message Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Message */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-xl shadow-black/10">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Message</h2>
                {getStatusBadge()}
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                  {message.message}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Sender Info */}
          <div className="space-y-6">
            {/* Sender Information */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Sender Information</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-sm font-bold text-white">
                    {message.name
                      ? message.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "??"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white break-words">{message.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <FiMail className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={`mailto:${message.email}`}
                        className="break-all hover:text-cyan-300 transition"
                      >
                        {message.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Details */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Subject</p>
                  <p className="mt-1 font-medium text-white">
                    {message.subject || "(No subject)"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Received</p>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <FiClock className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <span className="text-sm">{formatDate(message.createdAt)}</span>
                  </div>
                </div>

                {message.updatedAt !== message.createdAt && (
                  <div>
                    <p className="text-sm text-slate-400">Last Updated</p>
                    <div className="mt-1 flex items-center gap-2 text-white">
                      <FiCalendar className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      <span className="text-sm">{formatDate(message.updatedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>

              <div className="space-y-3">
                <a
                  href={`mailto:${message.email}?subject=Re: ${message.subject || "Your message"}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                >
                  <FiMail className="h-5 w-5 flex-shrink-0" />
                  Reply via Email
                </a>

                {status === "unread" && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={actionLoading}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm font-medium text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50"
                  >
                    <FiCheck className="h-5 w-5 flex-shrink-0" />
                    Mark as Read
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm font-medium text-red-300 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <FiTrash2 className="h-5 w-5 flex-shrink-0" />
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}