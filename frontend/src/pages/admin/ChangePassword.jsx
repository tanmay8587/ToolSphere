import { useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { changePassword } from "../../services/adminApi";
import { FiLock, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import PasswordInput from "../../components/common/PasswordInput";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.currentPassword) errors.currentPassword = "Current password is required";
    if (!formData.newPassword) errors.newPassword = "New password is required";
    else if (formData.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters";
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your new password";
    else if (formData.newPassword !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await changePassword(formData);
      if (res.data.success) {
        setSuccess("Password changed successfully");
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-lg space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Change Password</h1>
          <p className="mt-2 text-slate-400">Update your account password</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" size={16} />
              {success}
            </div>
          </div>
        )}

        {/* Password Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Current Password
              </label>
              <PasswordInput
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                error={validationErrors.currentPassword}
                placeholder="Enter current password"
                className="bg-white/5"
              />
              {validationErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                error={validationErrors.newPassword}
                placeholder="Enter new password"
                className="bg-white/5"
              />
              {validationErrors.newPassword && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirm New Password
              </label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={validationErrors.confirmPassword}
                placeholder="Confirm new password"
                className="bg-white/5"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <div className="border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <FiLock size={16} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}