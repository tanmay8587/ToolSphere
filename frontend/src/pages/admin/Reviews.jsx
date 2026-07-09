import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAdminToken } from "../../utils/auth";
import AdminLayout from "../../layout/AdminLayout";
import { FiStar, FiInbox, FiRefreshCw, FiClock, FiCheck } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await adminApi.get("/admin/reviews");

      if (data.success) {
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  // Handle approve
  const handleApprove = async (id) => {
    setProcessingId(id);
    setError("");
    try {
      const { data } = await adminApi.put(`/admin/reviews/${id}/approve`);

      if (data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        setSuccessMsg("Review approved successfully");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to approve review"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Render star rating
  const renderRating = (rating) => {
    const value = Number(rating) || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={14}
            className={
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-600"
            }
          />
        ))}
        <span className="ml-1.5 text-xs text-slate-400">{value}/5</span>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Pending Reviews</h1>
            <p className="mt-2 text-slate-400">
              Review and moderate user-submitted ratings before they go live.
            </p>
          </div>

          <button
            onClick={loadReviews}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <FiStar className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending Reviews</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {reviews.length} of {total} pending reviews
          </span>
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

        {/* Reviews Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">User</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Tool</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Rating</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Review</th>
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
                     Loading reviews...
                   </td>
                 </tr>
              ) : reviews.length === 0 ? (
                 <tr>
                   <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiInbox className="h-10 w-10 text-slate-600" />
                      <p className="font-medium">No pending reviews</p>
                      <p className="text-xs text-slate-600">
                        New reviews awaiting moderation will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review._id}
                    className="transition-colors hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
                          {review.user?.name
                            ? review.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : review.user?.email
                            ? review.user.email[0].toUpperCase()
                            : "??"}
                        </div>
                        <span className="font-medium text-slate-200">
                          {review.user?.name || review.user?.email || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {review.tool?.name || "Unknown Tool"}
                    </td>
                    <td className="px-4 py-4">{renderRating(review.rating)}</td>
                    <td className="px-4 py-4 text-slate-400 max-w-[280px]">
                      <span className="block truncate">
                        {review.comment || "(No comment)"}
                      </span>
                    </td>
                     <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                       {formatDate(review.createdAt)}
                     </td>
                     <td className="px-4 py-4">
                       <button
                         onClick={() => handleApprove(review._id)}
                         disabled={processingId === review._id}
                         className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30 disabled:opacity-50"
                         title="Approve review"
                       >
                         <FiCheck size={14} />
                         Approve
                       </button>
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