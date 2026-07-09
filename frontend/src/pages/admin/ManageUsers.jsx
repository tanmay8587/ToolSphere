import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { getAdminUsers, deleteUser } from "../../services/adminApi";
import { FiSearch, FiRefreshCw, FiTrash2, FiMail, FiCalendar, FiLogIn, FiShield, FiUsers, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";
import Pagination from "../../components/common/Pagination";

// User Avatar Component
const UserAvatar = ({ user, size = "w-10 h-10" }) => {
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-green-600",
      "from-amber-500 to-orange-600",
      "from-fuchsia-500 to-purple-600",
      "from-rose-500 to-pink-600",
      "from-indigo-500 to-blue-600",
      "from-violet-500 to-purple-600",
    ];
    const index = (name || "U").charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${size} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(
        user.name
      )} text-sm font-semibold text-white`}
    >
      {getInitials(user.name)}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ isVerified, isSuspended }) => {
  if (isSuspended) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
        <FiAlertCircle size={12} />
        Suspended
      </span>
    );
  }
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
        <FiCheck size={12} />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
      <FiX size={12} />
      Pending
    </span>
  );
};

// Role Badge Component
const RoleBadge = ({ role }) => {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        isAdmin
          ? "bg-cyan-500/10 text-cyan-200"
          : "bg-slate-700 text-slate-300"
      }`}
    >
      {isAdmin && <FiShield size={12} />}
      {role || "user"}
    </span>
  );
};

// Auth Provider Badge
const AuthProviderBadge = ({ provider }) => {
  const isGoogle = provider === "google";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        isGoogle
          ? "bg-blue-500/10 text-blue-200"
          : "bg-slate-700 text-slate-300"
      }`}
    >
      {isGoogle ? "Google" : "Email"}
    </span>
  );
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    page: 1,
    limit: 20,
  });

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getAdminUsers(filters);
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setVerifiedUsers(data.verified || 0);
      setPendingUsers(data.pending || 0);
      setAdminUsers(data.admins || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field !== "page" ? 1 : value,
    }));
  };

  // Handle delete
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteUser(userId);
      setMessage("User deleted successfully");
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / filters.limit) || 1;

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Users</h1>
            <p className="mt-2 text-slate-400">
              View, manage, and monitor all registered users in your directory.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <FiUsers className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : totalUsers}
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
                <p className="text-sm text-slate-400">Verified Users</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : verifiedUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <FiX className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending Verification</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : pendingUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <FiShield className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Admins</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {loading ? "—" : adminUsers}
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
            <option value="All">All Users</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Verification</option>
            <option value="admin">Admins</option>
          </select>

          <button
            onClick={loadUsers}
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
            Showing {users.length} of {totalUsers} users
          </span>
        </div>

        {message && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400">User</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Auth Provider</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiCalendar size={14} />
                    Registration Date
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiLogIn size={14} />
                    Last Login
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-900/70 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FiMail className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-300">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge isVerified={user.isVerified} isSuspended={user.isSuspended} />
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-4">
                      <AuthProviderBadge provider={user.googleId ? "google" : "email"} />
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
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