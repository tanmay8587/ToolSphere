import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../services/userApi";
import { uploadFile } from "../services/uploadService";
import { getUser, logout } from "../utils/auth";
import { useToast, ToastContainer } from "../components/common/Toast";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getProfile();
        if (data.success) {
          setProfile(data.user);
          setName(data.user.name || "");
          setBio(data.user.bio || "");
          setAvatar(data.user.avatar || "");
          if (data.user.avatar) {
            setAvatarPreview(data.user.avatar);
          }
        } else {
          setError(data.message || "Unable to load profile.");
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Please verify your email to access your profile.");
        } else {
          setError(err.response?.data?.message || "Unable to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast("Please select an image file.", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be less than 5MB.", "error");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let avatarUrl = avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploading(true);
        try {
          avatarUrl = await uploadFile(avatarFile);
        } catch (uploadErr) {
          addToast("Failed to upload image. Please try again.", "error");
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }

      const updateData = {};
      if (name.trim() !== (profile?.name || "")) {
        updateData.name = name.trim();
      }
      if (bio !== (profile?.bio || "")) {
        updateData.bio = bio.trim();
      }
      if (avatarUrl !== (profile?.avatar || "")) {
        updateData.avatar = avatarUrl;
      }

      if (Object.keys(updateData).length === 0) {
        addToast("No changes to save.", "info");
        setSaving(false);
        return;
      }

      const { data } = await updateProfile(updateData);
      if (data.success) {
        addToast("Profile updated successfully!", "success");
        setTimeout(() => navigate("/profile"), 1000);
      } else {
        throw new Error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      addToast(err.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  const localUser = getUser();

  if (!localUser && !loading) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-10 shadow-xl">
          <p className="text-center text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-white">Edit Profile</h1>
          <p className="mt-4 text-sm text-red-300">{error}</p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-6 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="mx-auto max-w-2xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={sectionVariants}>
          <button
            onClick={handleCancel}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-3xl font-semibold text-white">Edit Profile</h1>
          <p className="mt-2 text-slate-400">Update your name and profile photo.</p>
        </motion.div>

        {/* Edit Form Card */}
        <motion.div
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-10 shadow-2xl backdrop-blur-xl"
        >
          {/* Subtle gradient glow effects */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"></div>

          <form onSubmit={handleSubmit} className="relative space-y-8">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-slate-400">Profile Photo</p>
              <div
                role="button"
                tabIndex={0}
                aria-label="Change profile photo"
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-[3px] shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-105">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {profile?.name?.[0] || "U"}
                      </span>
                    )}
                  </div>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-white">
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.822.12 1.635.31 2.416.56 1.145.364 1.895 1.42 1.898 2.568l.002 6.934c-.003 1.148-.753 2.204-1.898 2.568a18.165 18.165 0 0 1-2.416.56c-.465.068-.87.328-1.11.71l-.821 1.317c-.502.805-1.365 1.338-2.332 1.39a49.502 49.502 0 0 1-5.312 0c-.967-.052-1.83-.585-2.332-1.39l-.821-1.317c-.24-.383-.645-.643-1.11-.71a18.164 18.164 0 0 1-2.416-.56c-1.145-.364-1.895-1.42-1.898-2.568l-.002-6.934c.003-1.148.753-2.204 1.898-2.568a18.163 18.163 0 0 1 2.416-.56c.465-.068.87-.328 1.11-.71l.821-1.317c.502-.805 1.365-1.338 2.332-1.39ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" clipRule="evenodd" />
                  </svg>
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <svg className="h-8 w-8 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {avatarPreview ? "Change Photo" : "Upload Photo"}
              </button>
              {avatarPreview && avatarPreview !== profile?.avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(profile?.avatar || null);
                  }}
                  className="text-sm text-red-400 transition-colors hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-lg backdrop-blur-md transition-colors duration-300 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-400 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-lg backdrop-blur-md transition-colors duration-300 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-500 shadow-lg backdrop-blur-md cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={saving || uploading}
                whileHover={{ y: -2, boxShadow: "0 14px 30px -10px rgba(34,211,238,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleCancel}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}