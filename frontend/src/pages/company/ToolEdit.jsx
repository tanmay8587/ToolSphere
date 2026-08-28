import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiLoader,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";
import { getCompanyTool, updateCompanyTool } from "../../services/companyApi";
import { useToast, ToastContainer } from "../../components/common/Toast";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 transition-colors duration-300 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

const field = "mb-5";

const toList = (arr) => (Array.isArray(arr) ? arr.join(", ") : String(arr || ""));
const fromList = (str) =>
  String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function ToolEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getCompanyTool(id);
        if (cancelled) return;
        if (res.data?.success) {
          const t = res.data.data;
          setForm({
            description: t.description || "",
            website: t.website || "",
            pricing: t.pricing || "Freemium",
            logo: t.logo || "",
            coverImage: t.coverImage || "",
            tags: toList(t.tags),
            features: toList(t.features),
            pros: toList(t.pros),
            cons: toList(t.cons),
            screenshots: toList(t.screenshots),
            gallery: toList(t.gallery),
            seoTitle: t.seoTitle || "",
            seoDescription: t.seoDescription || "",
            seoKeywords: toList(t.seoKeywords),
          });
        } else {
          setError(res.data?.message || "Unable to load tool.");
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load tool.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        tags: fromList(form.tags),
        features: fromList(form.features),
        pros: fromList(form.pros),
        cons: fromList(form.cons),
        screenshots: fromList(form.screenshots),
        gallery: fromList(form.gallery),
        seoKeywords: fromList(form.seoKeywords),
      };
      const res = await updateCompanyTool(id, payload);
      if (res.data?.success) {
        addToast(res.data.message || "Tool updated successfully.", "success");
        navigate("/company/tools");
      } else {
        addToast(res.data?.message || "Failed to update tool.", "error");
        setError(res.data?.message || "");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update tool.", "error");
      setError(err.response?.data?.message || "");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading tool...
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
        <h1 className="text-xl font-semibold text-white">Unable to edit tool</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button
          onClick={() => navigate("/company/tools")}
          className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
        >
          Back to My Tools
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={() => navigate("/company/tools")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <FiArrowLeft className="h-4 w-4" /> Back to My Tools
      </button>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Edit Tool Details</h1>
        <p className="mt-2 text-slate-400">
          Update your tool's listing information. Fields are comma-separated where noted.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Pricing</label>
          <select
            name="pricing"
            value={form.pricing}
            onChange={handleChange}
            className={`${inputClass} cursor-pointer`}
          >
            {["Free", "Freemium", "Paid", "Custom"].map((p) => (
              <option key={p} value={p} className="bg-slate-900">
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Website</label>
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            className={inputClass}
            placeholder="https://your-tool.com"
            required
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className={`${inputClass} resize-none`}
            minLength={30}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Minimum 30 characters.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} className={inputClass} placeholder="AI, Writing, Productivity" />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Features</label>
            <input name="features" value={form.features} onChange={handleChange} className={inputClass} placeholder="Feature one, Feature two" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Pros</label>
            <input name="pros" value={form.pros} onChange={handleChange} className={inputClass} placeholder="Fast, Easy to use" />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Cons</label>
            <input name="cons" value={form.cons} onChange={handleChange} className={inputClass} placeholder="Learning curve, Pricey" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Screenshots (URLs)</label>
            <input name="screenshots" value={form.screenshots} onChange={handleChange} className={inputClass} placeholder="https://..., https://..." />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Gallery (URLs)</label>
            <input name="gallery" value={form.gallery} onChange={handleChange} className={inputClass} placeholder="https://..., https://..." />
          </div>
        </div>

        <h3 className="mb-4 border-t border-white/10 pt-6 text-lg font-semibold text-white">SEO Settings</h3>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">SEO Title</label>
          <input name="seoTitle" value={form.seoTitle} onChange={handleChange} maxLength={70} className={inputClass} placeholder="Max 70 characters" />
        </div>
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">SEO Description</label>
          <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange} rows={2} maxLength={160} className={`${inputClass} resize-none`} placeholder="Max 160 characters" />
        </div>
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">SEO Keywords</label>
          <input name="seoKeywords" value={form.seoKeywords} onChange={handleChange} className={inputClass} placeholder="keyword one, keyword two" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => navigate("/company/tools")}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}