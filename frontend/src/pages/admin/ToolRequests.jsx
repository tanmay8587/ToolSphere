import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAdminToken } from "../../utils/auth";
import AdminLayout from "../../layout/AdminLayout";
import { FiInbox, FiRefreshCw, FiClock, FiCheck, FiX } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

// Admin API instance with auth interceptor
const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const STATUS_STYLES = {
  Pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  Approved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-300 border-red-500/30",
};

export default function ToolRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.get("/admin/tool-requests");
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || "Failed to load tool requests.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load tool requests"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Update status of a request (Approve / Reject)
  const updateStatus = async (id, status) => {
    setProcessingId(id);
    setError("");
    try {
      const { data } = await adminApi.put(`/admin/tool-requests/${id}/status`, {
        status,
      });

      if (data.success) {
        // Refresh the list after a successful update
        await loadRequests();
        setSuccessMsg(`Request ${status.toLowerCase()} successfully.`);
      } else {
        setError(data.message || `Failed to ${status.toLowerCase()} request.`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${status.toLowerCase()} request.`
      );
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

  const statusCounts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { Pending: 0, Approved: 0, Rejected: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tool Requests</h1>
            <p className="mt-2 text-slate-400">
              Review tools requested by users.
            </p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {["Pending", "Approved", "Rejected"].map((status) => (
            <div
              key={status}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    STATUS_STYLES[status]
                  }`}
                >
                  <FiInbox className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{status}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {loading ? "—" : statusCounts[status]}
                  </p>
                </div>
              </div>
            </div>
          ))}
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

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">User</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Tool Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Website</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Description</th>
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
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    Loading tool requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiInbox className="h-10 w-10 text-slate-600" />
                      <p className="font-medium">No tool requests</p>
                      <p className="text-xs text-slate-600">
                        Requests submitted by users will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req._id}
                    className="transition-colors hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {req.user?.name
                            ? req.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : req.user?.email
                            ? req.user.email[0].toUpperCase()
                            : "??"}
                        </div>
                        <span className="font-medium text-slate-200">
                          {req.user?.name || req.user?.email || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-200">
                      {req.toolName}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{req.category}</td>
                    <td className="px-4 py-4 text-slate-400 max-w-[180px]">
                      {req.website ? (
                        <a
                          href={req.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-cyan-400 hover:underline"
                        >
                          {req.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400 max-w-[280px]">
                      <span className="block truncate">
                        {req.description || "(No description)"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[req.status] || STATUS_STYLES.Pending
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(req._id, "Approved")}
                          disabled={processingId === req._id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                          title="Approve request"
                        >
                          <FiCheck size={14} />
                          Approve
                        </button>

                        <button
                          onClick={() => updateStatus(req._id, "Rejected")}
                          disabled={processingId === req._id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                          title="Reject request"
                        >
                          <FiX size={14} />
                          Reject
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
    </AdminLayout>
  );
}