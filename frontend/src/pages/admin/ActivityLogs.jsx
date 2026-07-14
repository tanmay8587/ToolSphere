import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAdminToken } from "../../utils/auth";
import AdminLayout from "../../layout/AdminLayout";
import { FiSearch, FiRefreshCw, FiClock, FiActivity, FiFilter } from "react-icons/fi";

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

// Distinct action values used across the app
const ACTION_OPTIONS = [
  "All",
  "create",
  "update",
  "delete",
  "role_change",
  "status_change",
];

// Distinct resource values used across the app
const RESOURCE_OPTIONS = ["All", "Tool", "Blog", "User"];

const ACTION_STYLES = {
  create: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  update: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  delete: "bg-red-500/10 text-red-300 border-red-500/30",
  role_change: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  status_change: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="divide-x divide-slate-800">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
            </div>
          </td>
          <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-16 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-48 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-28 animate-pulse rounded bg-slate-800" /></td>
        </tr>
      ))}
    </>
  );
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("All");
  const [resource, setResource] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const limit = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.get("/admin/activity-logs", {
        params: {
          search,
          action,
          resource,
          page,
          limit,
        },
      });
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPages(data.pagination?.pages || 1);
      } else {
        setError(data.message || "Failed to load activity logs.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load activity logs"
      );
    } finally {
      setLoading(false);
    }
  }, [search, action, resource, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset to first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [search, action, resource]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
            <p className="mt-2 text-slate-400">
              Track administrative actions across the platform.
            </p>
          </div>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin, action, details..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500/50"
            />
          </div>

          {/* Action filter */}
          <div className="relative">
            <FiFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-200 outline-none transition focus:border-cyan-500/50"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "All" ? "All Actions" : opt.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Resource filter */}
          <div className="relative">
            <FiFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-200 outline-none transition focus:border-cyan-500/50"
            >
              {RESOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "All" ? "All Resources" : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Admin</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Action</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Resource</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Details</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiClock size={14} />
                    Timestamp
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <SkeletonRows />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/10">
                        <FiActivity className="h-8 w-8 text-slate-600" />
                      </div>
                      <p className="text-base font-semibold text-slate-300">
                        No activity logs found
                      </p>
                      <p className="max-w-sm text-sm text-slate-600">
                        When admins perform actions, they will be recorded here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="transition-colors hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {getInitials(log.adminName)}
                        </div>
                        <span className="font-medium text-slate-200">
                          {log.adminName || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          ACTION_STYLES[log.action] || ACTION_STYLES.update
                        }`}
                      >
                        {log.action?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{log.resource}</td>
                    <td className="px-4 py-4 text-slate-400 max-w-[360px]">
                      <span className="block truncate">{log.details || "—"}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Showing {logs.length} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}