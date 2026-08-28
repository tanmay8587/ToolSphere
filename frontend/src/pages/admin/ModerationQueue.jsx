import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../layout/AdminLayout";
import {
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  requestChanges,
} from "../../services/moderationService";
import {
  FiInbox,
  FiRefreshCw,
  FiClock,
  FiCheck,
  FiX,
  FiEdit,
  FiMessageSquare,
} from "react-icons/fi";

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="divide-x divide-slate-800">
          <td className="px-4 py-4">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-800" />
          </td>
          <td className="px-4 py-4"><div className="h-3 w-24 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-20 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-40 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-24 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-7 w-28 animate-pulse rounded-xl bg-slate-800" /></td>
        </tr>
      ))}
    </>
  );
}

export default function ModerationQueue() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Modal state for Reject (optional reason) and Request Changes (required note)
  const [modal, setModal] = useState({ type: null, toolId: null, toolName: "", note: "" });

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingSubmissions({ page: 1, limit: 50 });
      if (data.success) {
        setTools(data.tools || []);
      } else {
        setError(data.message || "Failed to load pending submissions.");
      }
    } catch (err) {
      setError(err.message || "Failed to load pending submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    setError("");
    try {
      const data = await approveSubmission(id);
      if (data.success) {
        await loadSubmissions();
        setSuccessMsg("Submission approved successfully.");
      } else {
        setError(data.message || "Failed to approve submission.");
      }
    } catch (err) {
      setError(err.message || "Failed to approve submission.");
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (type, tool) => {
    setModal({ type, toolId: tool._id, toolName: tool.name, note: "" });
  };

  const closeModal = () => {
    setModal({ type: null, toolId: null, toolName: "", note: "" });
  };

  const submitModal = async () => {
    const { type, toolId, note } = modal;
    if (!type || !toolId) return;

    if (type === "changes" && !note.trim()) {
      setError("A change request note is required.");
      return;
    }

    setProcessingId(toolId);
    setError("");
    try {
      const data =
        type === "reject"
          ? await rejectSubmission(toolId, note.trim())
          : await requestChanges(toolId, note.trim());

      if (data.success) {
        await loadSubmissions();
        setSuccessMsg(
          type === "reject"
            ? "Submission rejected successfully."
            : "Change request sent successfully."
        );
        closeModal();
      } else {
        setError(data.message || "Action failed.");
      }
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
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

  const isModalOpen = modal.type !== null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Moderation Queue</h1>
            <p className="mt-2 text-slate-400">
              Review and moderate pending tool submissions.
            </p>
          </div>

          <button
            onClick={loadSubmissions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <FiInbox className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending Submissions</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : tools.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Submissions Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Tool Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Website</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Submitted By</th>
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
                <SkeletonRows />
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/10">
                        <FiInbox className="h-8 w-8 text-slate-600" />
                      </div>
                      <p className="text-base font-semibold text-slate-300">
                        No pending submissions
                      </p>
                      <p className="max-w-sm text-sm text-slate-600">
                        When users submit tools for approval, they will appear here
                        for you to review.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr
                    key={tool._id}
                    className="transition-colors hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-4 font-medium text-slate-200">
                      {tool.name}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{tool.category}</td>
                    <td className="px-4 py-4 text-slate-400 max-w-[180px]">
                      {tool.website ? (
                        <a
                          href={tool.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-cyan-400 hover:underline"
                        >
                          {tool.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {tool.createdBy || "Unknown"}
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatDate(tool.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleApprove(tool._id)}
                          disabled={processingId === tool._id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                          title="Approve submission"
                        >
                          <FiCheck size={14} />
                          Approve
                        </button>

                        <button
                          onClick={() => openModal("reject", tool)}
                          disabled={processingId === tool._id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                          title="Reject submission"
                        >
                          <FiX size={14} />
                          Reject
                        </button>

                        <button
                          onClick={() => openModal("changes", tool)}
                          disabled={processingId === tool._id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600/20 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-600/30 disabled:opacity-50"
                          title="Request changes"
                        >
                          <FiEdit size={14} />
                          Request Changes
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject / Request Changes Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  modal.type === "reject"
                    ? "bg-red-600/20 text-red-300"
                    : "bg-amber-600/20 text-amber-300"
                }`}
              >
                {modal.type === "reject" ? (
                  <FiX className="h-5 w-5" />
                ) : (
                  <FiMessageSquare className="h-5 w-5" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {modal.type === "reject"
                    ? "Reject Submission"
                    : "Request Changes"}
                </h2>
                <p className="text-sm text-slate-400 truncate max-w-[260px]">
                  {modal.toolName}
                </p>
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-300">
              {modal.type === "reject"
                ? "Reason (optional)"
                : "Change request note (required)"}
            </label>
            <textarea
              value={modal.note}
              onChange={(e) => setModal((m) => ({ ...m, note: e.target.value }))}
              rows={4}
              placeholder={
                modal.type === "reject"
                  ? "Explain why this submission is being rejected…"
                  : "Describe the changes the submitter needs to make…"
              }
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={submitModal}
                disabled={processingId === modal.toolId}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  modal.type === "reject"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {modal.type === "reject" ? "Reject" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}