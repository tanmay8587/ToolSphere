import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { getProfile, updateProfile } from "../../services/adminApi";
import { FiUser, FiMail, FiSave, FiRefreshCw } from "react-icons/fi";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res.data.success) {
          const admin = res.data.admin;
          setProfile(admin);
          setFormData({
            name: admin.name || "",
            email: admin.email || "",
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateProfile(formData);
      if (res.data.success) {
        setProfile(res.data.admin);
        setSuccess("Profile updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <FiRefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="mt-2 text-slate-400">Manage your account information</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
          {/* Avatar Section */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white">
              <FiUser size={40} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">{profile?.name}</h2>
              <p className="text-sm text-slate-400">{profile?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
                {profile?.role || "Admin"}
              </span>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:bg-white/10 ${
                    validationErrors.name ? "border-red-500" : "border-white/10 focus:border-cyan-400"
                  }`}
                  placeholder="Your name"
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:bg-white/10 ${
                    validationErrors.email ? "border-red-500" : "border-white/10 focus:border-cyan-400"
                  }`}
                  placeholder="your@email.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <div className="text-xs text-slate-500">
                {profile?.createdAt && (
                  <p>Account created: {new Date(profile.createdAt).toLocaleDateString()}</p>
                )}
                {profile?.updatedAt && (
                  <p>Last updated: {new Date(profile.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Save Changes
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