import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiShield, FiArrowRight, FiCheckCircle, FiLoader, FiArrowLeft,
} from "react-icons/fi";
import { submitToolClaim } from "../services/toolClaimService";
import { getToolBySlug } from "../services/toolsService";
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
const MAX = { companyName: 200, contactEmail: 200, companyWebsite: 500, role: 100, verificationDetails: 2000 };

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ClaimToolPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { toasts, addToast, removeToast } = useToast();

  const [tool, setTool] = useState(null);
  const [toolLoading, setToolLoading] = useState(true);
  const [toolError, setToolError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    companyWebsite: "",
    role: "",
    verificationDetails: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn()) {
    navigate("/login");
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setToolLoading(true);
      setToolError("");
      try {
        const { success: ok, tool: loaded } = await getToolBySlug(slug);
        if (cancelled) return;
        if (!ok || !loaded) {
          setToolError("The requested tool could not be found.");
          return;
        }
        setTool(loaded);
      } catch {
        if (!cancelled) setToolError("The requested tool could not be found.");
      } finally {
        if (!cancelled) setToolLoading(false);
      }
    };
    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    const companyName = form.companyName.trim();
    const contactEmail = form.contactEmail.trim();
    if (!companyName) next.companyName = "Company name is required.";
    else if (companyName.length > MAX.companyName) next.companyName = `Must be ${MAX.companyName} characters or fewer.`;
    if (!contactEmail) next.contactEmail = "A company contact email is required for verification.";
    else if (!isValidEmail(contactEmail)) next.contactEmail = "Please enter a valid email address.";
    else if (contactEmail.length > MAX.contactEmail) next.contactEmail = `Must be ${MAX.contactEmail} characters or fewer.`;
    if (form.companyWebsite && form.companyWebsite.trim() && !isValidUrl(form.companyWebsite.trim())) {
      next.companyWebsite = "Please enter a valid URL (http:// or https://).";
    } else if (form.companyWebsite.length > MAX.companyWebsite) next.companyWebsite = `Must be ${MAX.companyWebsite} characters or fewer.`;
    if (form.role.trim().length > MAX.role) next.role = `Must be ${MAX.role} characters or fewer.`;
    if (form.verificationDetails.trim().length > MAX.verificationDetails) next.verificationDetails = `Must be ${MAX.verificationDetails} characters or fewer.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tool) return;
    if (!validate()) {
      addToast("Please fix the highlighted fields.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { success: ok, message } = await submitToolClaim({
        tool: tool._id,
        companyName: form.companyName.trim(),
        contactEmail: form.contactEmail.trim(),
        companyWebsite: form.companyWebsite.trim(),
        role: form.role.trim(),
        verificationDetails: form.verificationDetails.trim(),
      });
      if (ok) {
        setSuccess(true);
        addToast("Claim request submitted for review!", "success");
      } else {
        addToast(message || "Failed to submit claim.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 ${
      errors[name] ? "border-red-500/70" : "border-slate-700"
    }`;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <FiShield className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Claim this tool</h1>
            <p className="text-sm text-slate-400">
              Verify your ownership to get the official verified badge.
            </p>
          </div>
        </div>

        {toolLoading ? (
          <div className="mt-6 flex items-center gap-3 text-slate-400">
            <FiLoader className="h-5 w-5 animate-spin" />
            Loading tool...
          </div>
        ) : toolError ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {toolError}
          </div>
        ) : !tool ? null : tool.verified && !success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            This tool has already been claimed and verified by its company.
          </div>
        ) : success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <FiCheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-4 text-xl font-bold text-white">Claim request submitted!</h2>
            <p className="mt-2 text-sm text-slate-300">
              Your claim for <span className="font-semibold text-white">{tool.name}</span> has been
              submitted for admin review. You will be notified once it is approved.
            </p>
            <Link
              to={`/tools/${tool.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Back to {tool.name}
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <img
                src={tool.logo || tool.coverImage || "https://placehold.co/48x48?text=No+Image"}
                alt={tool.name}
                className="h-12 w-12 rounded-xl border border-white/10 bg-white object-cover p-1"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/48x48?text=No+Image";
                }}
              />
              <div>
                <p className="font-semibold text-white">{tool.name}</p>
                <p className="text-xs text-slate-400">{tool.category}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  maxLength={MAX.companyName}
                  placeholder="e.g. OpenAI"
                  className={inputClass("companyName")}
                />
                {errors.companyName && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Company Contact Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  maxLength={MAX.contactEmail}
                  placeholder="team@company.com"
                  className={inputClass("contactEmail")}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Use an email on your company domain to speed up verification.
                </p>
                {errors.contactEmail && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Company Website
                </label>
                <input
                  type="url"
                  name="companyWebsite"
                  value={form.companyWebsite}
                  onChange={handleChange}
                  maxLength={MAX.companyWebsite}
                  placeholder="https://company.com"
                  className={inputClass("companyWebsite")}
                />
                {errors.companyWebsite && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.companyWebsite}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Your Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  maxLength={MAX.role}
                  placeholder="e.g. Product Owner"
                  className={inputClass("role")}
                />
                {errors.role && <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Verification Details
                </label>
                <textarea
                  name="verificationDetails"
                  value={form.verificationDetails}
                  onChange={handleChange}
                  rows={5}
                  maxLength={MAX.verificationDetails}
                  placeholder="Share how we can verify your ownership (e.g. domain ownership, links to your team page...)."
                  className={`${inputClass("verificationDetails")} resize-none`}
                />
                {errors.verificationDetails && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.verificationDetails}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiShield className="h-4 w-4" />
                    Submit Claim Request
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

