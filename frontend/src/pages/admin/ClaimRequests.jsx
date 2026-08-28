import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAdminToken } from "../../utils/auth";
import AdminLayout from "../../layout/AdminLayout";
import {
  FiInbox, FiRefreshCw, FiClock, FiCheck, FiX, FiShield, FiRotateCcw, FiEye,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-300 border-red-500/30",
  revoked: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

const STATUS_TABS = ["All", "pending", "approved", "rejected", "revoked"];

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="divide-x divide-slate-800">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
            </div>
          </td>
          <td className="px-4 py-4"><div className="h-3 w-28 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-32 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-40 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-3 w-16 animate-pulse rounded bg-slate-800" /></td>
          <td className="px-4 py-4"><div className="h-7 w-28 animate-pulse rounded-xl bg-slate-800" /></td>
        </tr>
      ))}
    </>
  );
}

export default function ClaimRequests() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [noteFor, setNoteFor] = useState(null); // claim _id currently gathering an admin note
  const [notes, setNotes] = useState({});

  const loadClaims = useCallback(async (status = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status && status !== "All") params.set("status", status);
      const qs = params.toString();
      const { data } = await adminApi.get(`/admin/tool-claims${qs ? `?${qs}` : ""}`);
      if (data.success) {
        setClaims(data.data || []);
      } else {
        setError(data.message || "Failed to load tool claims.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load tool claims");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadClaims(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const updateStatus = async (id, status) => {
    setProcessingId(id);
    setError("");
    try {
      const payload = { status };
      if (notes[id] && notes[id].trim()) payload.adminNote = notes[id].trim();

      const { data } = await adminApi.put(`/admin/tool-claims/${id}/status`, payload);

      if (data.success) {
        await loadClaims(statusFilter);
        setNoteFor(null);
        setSuccessMsg(data.message || `Claim ${status.toLowerCase()} successfully.`);
      } else {
        setError(data.message || `Failed to ${status.toLowerCase()} claim.`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || `Failed to ${status.toLowerCase()} claim.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
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
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusCounts = claims.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, revoked: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tool Claim Requests</h1>
            <p className="mt-2 text-slate-400">
              Review company claims and approve them to grant the verified badge.
            </p>
          </div>
          <button
            onClick={() => loadClaims(statusFilter)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setNoteFor(null);
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                statusFilter === tab
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab === "All" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          {["pending", "approved", "rejected", "revoked"].map((status) => (
            <div key={status} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${STATUS_STYLES[status]}`}>
                  {status === "approved" ? <FiCheck className="h-6 w-6" /> : status === "rejected" ? <FiX className="h-6 w-6" /> : status === "revoked" ? <FiRotateCcw className="h-6 w-6" /> : <FiClock className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-sm text-slate-400 capitalize">{status}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {loading ? "—" : statusCounts[status]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}
        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">{successMsg}</div>
        )}

        {/* Claims Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">Claimer</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Tool</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Company</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Verification</th>
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
                <SkeletonRows />
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/10">
                        <FiShield className="h-8 w-8 text-slate-600" />
                      </div>
                      <p className="text-base font-semibold text-slate-300">
                        No tool claims found
                      </p>
                      <p className="max-w-sm text-sm text-slate-600">
                        When companies claim a tool, their verification requests will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim._id} className="transition-colors hover:bg-slate-900/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {claim.user?.name
                            ? claim.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                            : claim.user?.email
                            ? claim.user.email[0].toUpperCase()
                            : "??"}
                        </div>
                        <span className="font-medium text-slate-200">
                          {claim.user?.name || claim.user?.email || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        {claim.tool?.name || "—"}
                        {claim.tool?.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            <FiCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-200">{claim.companyName}</p>
                      {claim.role && <p className="text-xs text-slate-500">{claim.role}</p>}
                    </td>
                    <td className="px-4 py-4 max-w-[260px]">
                      <p className="text-cyan-400">{claim.contactEmail}</p>
                      {claim.companyWebsite && (
                        <a
                          href={claim.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-xs text-slate-400 hover:underline"
                        >
                          {claim.companyWebsite}
                        </a>
                      )}
                      {claim.verificationDetails && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {claim.verificationDetails}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          STATUS_STYLES[claim.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {claim.status === "pending" || claim.status === "approved" ? (
                        <div className="space-y-2">
                          {noteFor === claim._id ? (
                            <>
                              <textarea
                                rows={2}
                                value={notes[claim._id] || ""}
                                onChange={(e) =>
                                  setNotes((prev) => ({ ...prev, [claim._id]: e.target.value }))
                                }
                                placeholder={`Note for ${claim.status === "approved" ? "revoking" : "rejecting"}...`}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                              />
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateStatus(claim._id, claim.status === "approved" ? "revoked" : "rejected")}
                                  disabled={processingId === claim._id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-600/30 disabled:opacity-50"
                                >
                                  <FiX size={13} /> Confirm
                                </button>
                                <button
                                  onClick={() => { setNoteFor(null); setNotes((prev) => ({ ...prev, [claim._id]: "" })); }}
                                  className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {claim.status === "pending" && (
                                <button
                                  onClick={() => updateStatus(claim._id, "approved")}
                                  disabled={processingId === claim._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                                  title="Approve claim and grant verified badge"
                                >
                                  <FiCheck size={14} /> Approve
                                </button>
                              )}
                              {claim.status === "pending" && (
                                <button
                                  onClick={() => setNoteFor(claim._id)}
                                  disabled={processingId === claim._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                                  title="Reject claim"
                                >
                                  <FiX size={14} /> Reject
                                </button>
                              )}
                              {claim.status === "approved" && (
                                <button
                                  onClick={() => setNoteFor(claim._id)}
                                  disabled={processingId === claim._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-600/20 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/30 disabled:opacity-50"
                                  title="Revoke verified badge"
                                >
                                  <FiRotateCcw size={14} /> Revoke
                                </button>
                              )}
                              {claim.adminNote && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500" title={claim.adminNote}>
                                  <FiEye size={12} /> {claim.adminNote.slice(0, 24)}...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
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
