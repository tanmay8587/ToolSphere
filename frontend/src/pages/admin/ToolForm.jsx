import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { addTool, getToolById, updateTool, getCategories } from "../../services/adminApi";
import SectionCard from "../../components/admin/form/SectionCard";
import ImageUploader from "../../components/admin/form/ImageUploader";
import GalleryUploader from "../../components/admin/form/GalleryUploader";
import DynamicList from "../../components/admin/form/DynamicList";
import TagInput from "../../components/admin/form/TagInput";
import { FiAlertCircle } from "react-icons/fi";

// Slug generation utility (shared with backend)
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Form input components with validation
const Input = ({ label, error, required, charCount, ...props }) => (
  <label className="block">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      {charCount && (
        <span className="text-xs text-slate-500">
          {props.value?.length || 0}/{charCount}
        </span>
      )}
    </div>
    <input
      {...props}
      className={`
        mt-1 w-full rounded-xl border px-4 py-3 text-white placeholder:text-slate-500 outline-none transition
        ${error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"}
        bg-slate-900
      `}
    />
    {error && (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
        <FiAlertCircle size={14} />
        {error}
      </p>
    )}
  </label>
);

const TextArea = ({ label, error, required, charCount, ...props }) => (
  <label className="block">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      {charCount && (
        <span className="text-xs text-slate-500">
          {props.value?.length || 0}/{charCount}
        </span>
      )}
    </div>
    <textarea
      {...props}
      rows={4}
      className={`
        mt-1 w-full rounded-xl border px-4 py-3 text-white placeholder:text-slate-500 outline-none transition
        ${error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"}
        bg-slate-900
      `}
    />
    {error && (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
        <FiAlertCircle size={14} />
        {error}
      </p>
    )}
  </label>
);

const Select = ({ label, error, required, options, ...props }) => (
  <label className="block">
    <span className="text-sm text-slate-300 mb-1">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </span>
    <select
      {...props}
      className={`
        mt-1 w-full rounded-xl border px-4 py-3 text-white outline-none transition
        ${error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"}
        bg-slate-900
      `}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {error && (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
        <FiAlertCircle size={14} />
        {error}
      </p>
    )}
  </label>
);

const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-3 text-slate-300 mt-6">
    <input type="checkbox" {...props} className="h-5 w-5 rounded border-slate-600 bg-slate-800" />
    {label}
  </label>
);

export default function ToolForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    pricing: "Freemium",
    website: "",
    status: "pending",
    featured: false,
    logo: "",
    coverImage: "",
    gallery: [],
    features: [],
    pros: [],
    cons: [],
    tags: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    canonicalUrl: "",
    ogImage: "",
    notifyNewsletter: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newsletterCount, setNewsletterCount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data } = await getCategories();
        const cats = (data.categories || [])
          .filter(c => c.isActive !== false)
          .map(c => c.name)
          .sort((a, b) => a.localeCompare(b));
        setCategories(cats);
      } catch (err) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Load tool for edit mode
  useEffect(() => {
    if (!id) return;

    const loadTool = async () => {
      try {
        setLoading(true);
        const { data } = await getToolById(id);
        const tool = data.tool;

        setForm({
          name: tool.name || "",
          slug: tool.slug || "",
          description: tool.description || "",
          category: tool.category || "",
          pricing: tool.pricing || "Freemium",
          website: tool.website || "",
          status: tool.status || "pending",
          featured: Boolean(tool.featured),
          logo: tool.logo || "",
          coverImage: tool.coverImage || "",
          gallery: Array.isArray(tool.gallery)
            ? tool.gallery.map((url, index) => ({
                id: `existing-${index}`,
                url,
                status: "uploaded"
              }))
            : [],
          features: Array.isArray(tool.features) ? tool.features : [],
          pros: Array.isArray(tool.pros) ? tool.pros : [],
          cons: Array.isArray(tool.cons) ? tool.cons : [],
          tags: Array.isArray(tool.tags) ? tool.tags : [],
          seoTitle: tool.seoTitle || "",
          seoDescription: tool.seoDescription || "",
          seoKeywords: Array.isArray(tool.seoKeywords) ? tool.seoKeywords : [],
          canonicalUrl: tool.canonicalUrl || "",
          ogImage: tool.ogImage || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load tool");
      } finally {
        setLoading(false);
      }
    };

    loadTool();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate slug from name
      if (name === "name") {
        updated.slug = createSlug(value);
      }

      return updated;
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle array field changes
  const handleArrayChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle gallery changes
  const handleGalleryChange = (value) => {
    setForm((prev) => ({
      ...prev,
      gallery: value,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (form.name.trim().length < 3) {
      newErrors.name = "Tool name must be at least 3 characters.";
    }

    if (!form.category.trim()) {
      newErrors.category = "Please select a category.";
    }

    if (form.description.trim().length < 30) {
      newErrors.description = "Description must be at least 30 characters.";
    }

    try {
      new URL(form.website);
    } catch {
      newErrors.website = "Please enter a valid website URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setNewsletterCount(null);

    if (!validateForm()) return;

    try {
      // Extract gallery URLs
      const galleryUrls = form.gallery.map((img) => img.url);

      const payload = {
        ...form,
        gallery: galleryUrls,
        featured: Boolean(form.featured),
        notifyNewsletter: form.notifyNewsletter,
      };

      setLoading(true);

      let response;
      if (isEditMode) {
        response = await updateTool(id, payload);
        setMessage("Tool updated successfully");
      } else {
        response = await addTool(payload);
        setMessage("Tool created successfully");
        // Reset form
        setForm({
          name: "",
          slug: "",
          description: "",
          category: "",
          pricing: "Freemium",
          website: "",
          status: "pending",
          featured: false,
          logo: "",
          coverImage: "",
          gallery: [],
          features: [],
          pros: [],
          cons: [],
          tags: [],
          seoTitle: "",
          seoDescription: "",
          seoKeywords: [],
          canonicalUrl: "",
          ogImage: "",
          notifyNewsletter: false,
        });
      }

      // Check if newsletter was sent
      if (response?.data?.newsletter) {
        setNewsletterCount(response.data.newsletter.count || 0);
        if (response.data.newsletter.count > 0) {
          setMessage(response.data.message || `Tool ${isEditMode ? 'updated' : 'created'} successfully. Newsletter sent to ${response.data.newsletter.count} subscribers.`);
        } else {
          setMessage(response.data.message || `Tool ${isEditMode ? 'updated' : 'created'} successfully. No active newsletter subscribers to notify.`);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save tool");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isEditMode ? "Edit Tool" : "Add New Tool"}
          </h1>
          <p className="text-slate-400 mt-2">
            Fill in the details below to publish your AI tool in the directory.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
            {message}
            {newsletterCount !== null && newsletterCount > 0 && (
              <span className="ml-2 font-semibold">
                Newsletter sent to {newsletterCount} subscribers.
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Basic Information */}
          <SectionCard
            title="Basic Information"
            description="Essential details about the tool"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Tool Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. ChatGPT, Midjourney, Notion AI"
                required
                error={errors.name}
                charCount={100}
              />

              <Input
                label="Slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g. chatgpt, midjourney-ai"
                error={errors.slug}
              />

              <Select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                error={errors.category}
                options={categoriesLoading ? ["Loading..."] : categories.length > 0 ? categories : ["No categories available"]}
              />

              <Select
                label="Pricing"
                name="pricing"
                value={form.pricing}
                onChange={handleChange}
                options={["Free", "Freemium", "Paid", "Custom"]}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  required
                  error={errors.website}
                />
              </div>

              <div className="sm:col-span-2">
                <TextArea
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write about this AI tool..."
                  required
                  error={errors.description}
                  charCount={500}
                />
              </div>
            </div>
          </SectionCard>

          {/* SECTION 2: Branding */}
          <SectionCard
            title="Branding"
            description="Logo, cover image, and gallery for visual presentation"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <ImageUploader
                  label="Logo"
                  value={form.logo}
                  onChange={(value) => handleArrayChange("logo", value)}
                  previewSize="small"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Square image used in tool cards, search, and categories.
                </p>
              </div>

              <div>
                <ImageUploader
                  label="Cover Image"
                  value={form.coverImage}
                  onChange={(value) => handleArrayChange("coverImage", value)}
                  previewSize="small"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Hero image displayed on the tool detail page.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <GalleryUploader
                label="Gallery"
                value={form.gallery}
                onChange={handleGalleryChange}
              />
              <p className="text-xs text-slate-500 mt-2">
                Multiple screenshots. Only displayed on detail page if 2+ images.
              </p>
            </div>
          </SectionCard>

          {/* SECTION 3: Features */}
          <SectionCard
            title="Features"
            description="Key features and capabilities of the tool"
          >
            <DynamicList
              label="Features"
              placeholder="Add a feature..."
              value={form.features}
              onChange={(value) => handleArrayChange("features", value)}
              maxItems={20}
            />
          </SectionCard>

          {/* SECTION 4: Pros */}
          <SectionCard
            title="Pros"
            description="Advantages and positive aspects"
          >
            <DynamicList
              label="Pros"
              placeholder="Add a pro..."
              value={form.pros}
              onChange={(value) => handleArrayChange("pros", value)}
              maxItems={10}
            />
          </SectionCard>

          {/* SECTION 5: Cons */}
          <SectionCard
            title="Cons"
            description="Limitations and drawbacks"
          >
            <DynamicList
              label="Cons"
              placeholder="Add a con..."
              value={form.cons}
              onChange={(value) => handleArrayChange("cons", value)}
              maxItems={10}
            />
          </SectionCard>

          {/* SECTION 6: Tags */}
          <SectionCard
            title="Tags"
            description="Keywords for search and categorization"
          >
            <TagInput
              label="Tags"
              placeholder="Type and press Enter..."
              value={form.tags}
              onChange={(value) => handleArrayChange("tags", value)}
              maxTags={20}
            />
          </SectionCard>

          {/* SECTION 7: SEO */}
          <SectionCard
            title="SEO"
            description="Search engine optimization settings"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="SEO Title"
                name="seoTitle"
                value={form.seoTitle}
                onChange={handleChange}
                placeholder="Best AI Writing Tool"
                charCount={60}
              />

              <Input
                label="Canonical URL"
                name="canonicalUrl"
                value={form.canonicalUrl}
                onChange={handleChange}
                placeholder="https://yourwebsite.com/tools/chatgpt"
              />

              <div className="sm:col-span-2">
                <TextArea
                  label="SEO Description"
                  name="seoDescription"
                  value={form.seoDescription}
                  onChange={handleChange}
                  placeholder="Short SEO description (150-160 characters)"
                  charCount={160}
                />
              </div>

              <div className="sm:col-span-2">
                <TagInput
                  label="SEO Keywords"
                  placeholder="Type and press Enter..."
                  value={form.seoKeywords}
                  onChange={(value) => handleArrayChange("seoKeywords", value)}
                  maxTags={15}
                />
              </div>

              <Input
                label="OG Image URL"
                name="ogImage"
                value={form.ogImage}
                onChange={handleChange}
                placeholder="https://example.com/og-image.jpg"
              />
            </div>
          </SectionCard>

          {/* SECTION 8: Publishing */}
          <SectionCard
            title="Publishing"
            description="Control the tool's visibility and status"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={["pending", "active", "rejected"]}
              />

              <Checkbox
                label="Featured Tool"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6">
              <Checkbox
                label="Notify Newsletter Subscribers"
                name="notifyNewsletter"
                checked={form.notifyNewsletter}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500 mt-2">
                Send an email notification to all active newsletter subscribers about this tool.
              </p>
            </div>
          </SectionCard>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/admin/tools")}
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : isEditMode ? "Update Tool" : "Create Tool"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}