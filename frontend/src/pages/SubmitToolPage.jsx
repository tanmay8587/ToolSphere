import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FiSend, FiArrowRight, FiCheckCircle, FiLoader, FiUploadCloud, FiX } from "react-icons/fi";
import { submitTool } from "../services/toolsService";
import { useToast, ToastContainer } from "../components/common/Toast";
import { isLoggedIn } from "../utils/auth";

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const MAX = {
  name: 100,
  website: 500,
  category: 100,
  description: 5000,
};

const PRICING_OPTIONS = ["Free", "Freemium", "Paid", "Custom"];

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function SubmitToolPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    category: "",
    website: "",
    description: "",
    pricing: "Freemium",
    tags: "",
    features: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isLoggedIn()) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: "Only PNG, JPG, JPEG, WebP, SVG, or ICO images are allowed." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "Logo must be 5MB or smaller." }));
      return;
    }

    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogo(null);
    setLogoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const category = form.category.trim();
    const website = form.website.trim();
    const description = form.description.trim();

    if (!name) {
      next.name = "Tool name is required.";
    } else if (name.length < 3) {
      next.name = "Tool name must be at least 3 characters.";
    } else if (name.length > MAX.name) {
      next.name = `Tool name must be ${MAX.name} characters or fewer.`;
    }

    if (!category) {
      next.category = "Category is required.";
    } else if (category.length > MAX.category) {
      next.category = `Category must be ${MAX.category} characters or fewer.`;
    }

    if (!website) {
      next.website = "Website is required.";
    } else if (!isValidUrl(website)) {
      next.website = "Please enter a valid URL (http:// or https://).";
    } else if (website.length > MAX.website) {
      next.website = `Website must be ${MAX.website} characters or fewer.`;
    }

    if (!description) {
      next.description = "Description is required.";
    } else if (description.length < 30) {
      next.description = "Description must be at least 30 characters.";
    } else if (description.length > MAX.description) {
      next.description = `Description must be ${MAX.description} characters or fewer.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast("Please fix the highlighted fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("category", form.category.trim());
      payload.append("website", form.website.trim());
      payload.append("description", form.description.trim());
      payload.append("pricing", form.pricing);
      payload.append("tags", form.tags);
      payload.append("features", form.features);
      if (logo) payload.append("logo", logo);

      const result = await submitTool(payload);

      if (result.success) {
        setSuccess(true);
        addToast("Tool submitted successfully. It will appear after admin approval.", "success");
        setForm({
          name: "",
          category: "",
          website: "",
          description: "",
          pricing: "Freemium",
          tags: "",
          features: "",
        });
        clearLogo();
        setErrors({});
      } else {
        addToast(result.message || "Failed to submit tool.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to submit tool.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
      errors[field]
        ? "border-red-500/60 focus:border-red-400"
        : "border-slate-700 focus:border-cyan-400"
    }`;

  return (
    <motion.div
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <motion.div
        variants={cardVariants}
        className="mx-auto max-w-2xl space-y-8"
      >
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10"
          >
            <FiArrowRight className="h-4 w-4 rotate-180 text-cyan-300" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-white">Submit an AI Tool</h1>
          <p className="mt-2 text-sm text-slate-400">
            Know a great AI tool? Submit it here. Our team will review your submission
            and publish it once approved.
          </p>

          {success && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <FiCheckCircle className="h-5 w-5" />
              <span>
                Your tool has been submitted and is pending approval. You'll be notified
                once it goes live.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {/* Logo upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Logo
              </label>
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-red-400/40 hover:text-red-400"
                  >
                    <FiX className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-800/50 px-4 py-8 text-center transition hover:border-cyan-400/50">
                  <FiUploadCloud className="h-7 w-7 text-slate-500" />
                  <span className="text-sm text-slate-400">
                    Click to upload a logo (PNG, JPG, WebP, SVG, ICO · max 5MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
              {errors.logo && (
                <p className="mt-1.5 text-xs text-red-400">{errors.logo}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tool Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={MAX.name}
                placeholder="e.g. Midjourney"
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Category <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                maxLength={MAX.category}
                placeholder="e.g. Image Generation"
                className={inputClass("category")}
              />
              {errors.category && (
                <p className="mt-1.5 text-xs text-red-400">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Website <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                maxLength={MAX.website}
                placeholder="https://example.com"
                className={inputClass("website")}
              />
              {errors.website && (
                <p className="mt-1.5 text-xs text-red-400">{errors.website}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Pricing
              </label>
              <select
                name="pricing"
                value={form.pricing}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {PRICING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                maxLength={MAX.description}
                placeholder="Describe what this AI tool does, who it's for, and its key benefits..."
                className={`${inputClass("description")} resize-none`}
              />
              <div className="mt-1 flex justify-between">
                {errors.description ? (
                  <p className="text-xs text-red-400">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-slate-500">
                  {form.description.length}/{MAX.description}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="comma, separated, tags"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Key Features
              </label>
              <input
                type="text"
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder="feature one, feature two, feature three"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="h-4 w-4" />
                  Submit Tool
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Looking for something else?{" "}
          <Link to="/request-tool" className="text-cyan-400 hover:underline">
            Request a tool instead
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}