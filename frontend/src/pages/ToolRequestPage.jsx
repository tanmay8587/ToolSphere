import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FiSend, FiArrowRight, FiCheckCircle, FiLoader } from "react-icons/fi";
import { submitToolRequest } from "../services/toolRequestService";
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

const MAX = { toolName: 100, website: 500, category: 100, description: 1000 };

const isValidUrl = (value) => {
  if (!value) return true; // optional
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function ToolRequestPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({
    toolName: "",
    website: "",
    category: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn()) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field error as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    const toolName = form.toolName.trim();
    const category = form.category.trim();

    if (!toolName) {
      next.toolName = "Tool name is required.";
    } else if (toolName.length < 2) {
      next.toolName = "Tool name must be at least 2 characters.";
    } else if (toolName.length > MAX.toolName) {
      next.toolName = `Tool name must be ${MAX.toolName} characters or fewer.`;
    }

    if (!category) {
      next.category = "Category is required.";
    } else if (category.length > MAX.category) {
      next.category = `Category must be ${MAX.category} characters or fewer.`;
    }

    if (form.website && form.website.trim() && !isValidUrl(form.website.trim())) {
      next.website = "Please enter a valid URL (http:// or https://).";
    } else if (form.website.length > MAX.website) {
      next.website = `Website must be ${MAX.website} characters or fewer.`;
    }

    if (form.description.trim().length > MAX.description) {
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
      const { success: ok, data, message } = await submitToolRequest({
        toolName: form.toolName.trim(),
        website: form.website.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
      });

      if (ok) {
        setSuccess(true);
        addToast("Tool request submitted successfully.", "success");
        setForm({ toolName: "", website: "", category: "", description: "" });
        setErrors({});
      } else {
        addToast(message || "Failed to submit tool request.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to submit tool request.", "error");
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
          <h1 className="text-2xl font-bold text-white">Request a Tool</h1>
          <p className="mt-2 text-sm text-slate-400">
            Can't find a tool you love? Let us know and we'll review your request.
          </p>

          {success && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <FiCheckCircle className="h-5 w-5" />
              <span>Your request has been submitted. We'll get back to you soon.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tool Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="toolName"
                value={form.toolName}
                onChange={handleChange}
                maxLength={MAX.toolName}
                placeholder="e.g. Midjourney"
                className={inputClass("toolName")}
              />
              {errors.toolName && (
                <p className="mt-1.5 text-xs text-red-400">{errors.toolName}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Website
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
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={MAX.description}
                placeholder="Tell us a bit about this tool..."
                className={`${inputClass("description")} resize-none`}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>
              )}
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
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}