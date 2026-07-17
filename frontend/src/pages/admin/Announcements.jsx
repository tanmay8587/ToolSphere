import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "../../services/announcementService";
import {
  FiBell,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
} from "react-icons/fi";
import { useToast, ToastContainer } from "../../components/common/Toast";

const typeConfig = {
  info: { icon: FiInfo, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  success: { icon: FiCheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  warning: { icon: FiAlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  error: { icon: FiXCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const priorityConfig = {
  low: { label: "Low", color: "text-slate-400", bg: "bg-slate-500/10" },
  medium: { label: "Medium", color: "text-blue-400", bg: "bg-blue-500/10" },
  high: { label: "High", color: "text-amber-400", bg: "bg-amber-500/10" },
  urgent: { label: "Urgent", color: "text-red-400", bg: "bg-red-500/10" },
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    isActive: true,
    scheduledAt: "",
    expiresAt: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const loadAnnouncements = async (page = 1, status = "all") => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status !== "all") {
        params.status = status;
      }
      const data = await getAllAnnouncements(params);
      if (data.success) {
        setAnnouncements(data.announcements || []);
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to load announcements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(currentPage, filterStatus);
  }, [currentPage, filterStatus]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 200) {
      errors.title = "Title must not exceed 200 characters";
    }
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.length > 1000) {
      errors.message = "Message must not exceed 1000 characters";
    }
    if (formData.scheduledAt && formData.expiresAt) {
      const scheduled = new Date(formData.scheduledAt);
      const expires = new Date(formData.expiresAt);
      if (scheduled > expires) {
        errors.expiresAt = "Expiry date must be after scheduled date";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        priority: announcement.priority,
        isActive: announcement.isActive,
        scheduledAt: announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().slice(0, 16) : "",
        expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : "",
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: "",
        message: "",
        type: "info",
        priority: "medium",
        isActive: true,
        scheduledAt: "",
        expiresAt: "",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "medium",
      isActive: true,
      scheduledAt: "",
      expiresAt: "",
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Please fix the validation errors", "error");
      return;
    }

    setSaving(true);
    try {
      const dataToSubmit = {
        ...formData,
        scheduledAt: formData.scheduledAt || null,
        expiresAt: formData.expiresAt || null,
      };

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement._id, dataToSubmit);
        addToast("Announcement updated successfully", "success");
      } else {
        await createAnnouncement(dataToSubmit);
        addToast("Announcement created successfully", "success");
      }
      handleCloseModal();
      loadAnnouncements(currentPage, filterStatus);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save announcement", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }
    try {
      await deleteAnnouncement(id);
      addToast("Announcement deleted successfully", "success");
      loadAnnouncements(currentPage, filterStatus);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete announcement", "error");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleAnnouncementStatus(id);
      addToast("Announcement status updated", "success");
      loadAnnouncements(currentPage, filterStatus);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to toggle status", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (announcement) => {
    const now = new Date();
    if (!announcement.isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-500/10 text-slate-400">Inactive</span>;
    }
    if (announcement.scheduledAt && new Date(announcement.scheduledAt) > now) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400">Scheduled</span>;
    }
    if (announcement.expiresAt && new Date(announcement.expiresAt) < now) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400">Active</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Announcements</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage homepage announcements and notifications
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FiPlus size={18} />
            Create Announcement
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-1">
          {["all", "active", "inactive", "scheduled", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filterStatus === status
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
                <div className="h-6 w-3/4 rounded bg-slate-800" />
                <div className="h-4 w-full rounded bg-slate-800" />
                <div className="h-4 w-1/2 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
            <FiBell className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-lg font-semibold text-white">No announcements found</h3>
            <p className="mt-2 text-sm text-slate-300">
              Get started by creating your first announcement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const TypeIcon = typeConfig[announcement.type]?.icon || FiInfo;
              const typeStyle = typeConfig[announcement.type] || typeConfig.info;
              const priorityStyle = priorityConfig[announcement.priority] || priorityConfig.medium;

              return (
                <div
                  key={announcement._id}
                  className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-1 ${typeStyle.bg} ${typeStyle.border} border`}>
                          <TypeIcon className={typeStyle.color} size={16} />
                          <span className={`text-xs font-medium ${typeStyle.color}`}>
                            {announcement.type.toUpperCase()}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityStyle.bg} ${priorityStyle.color}`}>
                          {priorityStyle.label}
                        </span>
                        {getStatusBadge(announcement)}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{announcement.title}</h3>
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">{announcement.message}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {announcement.scheduledAt && (
                          <span>Scheduled: {formatDate(announcement.scheduledAt)}</span>
                        )}
                        {announcement.expiresAt && (
                          <span>Expires: {formatDate(announcement.expiresAt)}</span>
                        )}
                        <span>Created: {formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(announcement._id)}
                        className={`rounded-lg p-2 transition ${
                          announcement.isActive
                            ? "text-green-400 hover:bg-green-500/10"
                            : "text-slate-400 hover:bg-white/5"
                        }`}
                        title={announcement.isActive ? "Deactivate" : "Activate"}
                      >
                        {announcement.isActive ? <FiCheck size={18} /> : <FiX size={18} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(announcement)}
                        className="rounded-lg p-2 text-cyan-400 transition hover:bg-cyan-500/10"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3">
            <div className="text-sm text-slate-300">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, total)} of {total} announcements
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full rounded-xl border ${
                    formErrors.title ? "border-red-500" : "border-white/10"
                  } bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none`}
                  placeholder="Enter announcement title"
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.title}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className={`w-full rounded-xl border ${
                    formErrors.message ? "border-red-500" : "border-white/10"
                  } bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none resize-none`}
                  placeholder="Enter announcement message"
                />
                {formErrors.message && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.message}</p>
                )}
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Scheduled At */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Schedule Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Leave empty to publish immediately
                </p>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className={`w-full rounded-xl border ${
                    formErrors.expiresAt ? "border-red-500" : "border-white/10"
                  } bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none`}
                />
                {formErrors.expiresAt && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.expiresAt}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Leave empty for no expiration
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div>
                  <label className="text-sm font-medium text-slate-200">Active</label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inactive announcements won't be displayed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    formData.isActive ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      {editingAnnouncement ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}