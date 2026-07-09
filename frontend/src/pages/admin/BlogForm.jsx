import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { addBlog, getBlogById, updateBlog } from "../../services/adminApi";
import SectionCard from "../../components/admin/form/SectionCard";
import ImageUploader from "../../components/admin/form/ImageUploader";
import TagInput from "../../components/admin/form/TagInput";
import { FiAlertCircle } from "react-icons/fi";

// Slug generation utility
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
};

// Form input components
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
      rows={6}
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

export default function BlogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    author: "",
    tags: [],
    coverImage: "",
    status: "draft",
    featured: false,
    notifyNewsletter: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newsletterCount, setNewsletterCount] = useState(null);

  // Load blog for edit mode
  useEffect(() => {
    if (!id) return;

    const loadBlog = async () => {
      try {
        setLoading(true);
        const { data } = await getBlogById(id);
        const blog = data.blog;

        setForm({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          category: blog.category || "",
          author: blog.author || "",
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          coverImage: blog.coverImage || "",
          status: blog.status || "draft",
          featured: Boolean(blog.featured),
          notifyNewsletter: false,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate slug from title
      if (name === "title") {
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (form.title.trim().length < 5) {
      newErrors.title = "Blog title must be at least 5 characters.";
    }

    if (!form.content.trim() || form.content.trim().length < 50) {
      newErrors.content = "Content must be at least 50 characters.";
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
      const payload = {
        ...form,
        featured: Boolean(form.featured),
        notifyNewsletter: form.notifyNewsletter,
      };

      setLoading(true);

      let response;
      if (isEditMode) {
        response = await updateBlog(id, payload);
        setMessage("Blog updated successfully");
      } else {
        response = await addBlog(payload);
        setMessage("Blog created successfully");
        // Reset form
        setForm({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          category: "",
          author: "",
          tags: [],
          coverImage: "",
          status: "draft",
          featured: false,
          notifyNewsletter: false,
        });
      }

      // Check if newsletter was sent
      if (response?.data?.newsletter) {
        setNewsletterCount(response.data.newsletter.count || 0);
        if (response.data.newsletter.count > 0) {
          setMessage(response.data.message || `Blog ${isEditMode ? 'updated' : 'published'} successfully. Newsletter sent to ${response.data.newsletter.count} subscribers.`);
        } else {
          setMessage(response.data.message || `Blog ${isEditMode ? 'updated' : 'published'} successfully. No active newsletter subscribers to notify.`);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isEditMode ? "Edit Blog" : "Add New Blog"}
          </h1>
          <p className="text-slate-400 mt-2">
            Create and publish blog posts to engage with your audience.
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
            description="Essential details about the blog post"
          >
            <div className="space-y-5">
              <Input
                label="Blog Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter blog title"
                required
                error={errors.title}
                charCount={200}
              />

              <Input
                label="Slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="auto-generated-from-title"
                error={errors.slug}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Technology, AI, Tutorial"
                />

                <Input
                  label="Author"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Author name"
                />
              </div>

              <TextArea
                label="Excerpt"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Brief summary of the blog post (max 500 characters)"
                charCount={500}
              />
            </div>
          </SectionCard>

          {/* SECTION 2: Content */}
          <SectionCard
            title="Content"
            description="Write your blog post content"
          >
            <TextArea
              label="Blog Content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your blog post content here... (supports HTML)"
              required
              error={errors.content}
              charCount={10000}
            />
          </SectionCard>

          {/* SECTION 3: Media & Tags */}
          <SectionCard
            title="Media & Tags"
            description="Cover image and tags for the blog post"
          >
            <div className="space-y-5">
              <ImageUploader
                label="Cover Image"
                value={form.coverImage}
                onChange={(value) => handleArrayChange("coverImage", value)}
                previewSize="medium"
              />

              <TagInput
                label="Tags"
                placeholder="Type and press Enter..."
                value={form.tags}
                onChange={(value) => handleArrayChange("tags", value)}
                maxTags={10}
              />
            </div>
          </SectionCard>

          {/* SECTION 4: Publishing */}
          <SectionCard
            title="Publishing"
            description="Control the blog's visibility and status"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={["draft", "published"]}
              />

              <Checkbox
                label="Featured Post"
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
                Send an email notification to all active newsletter subscribers about this blog post.
              </p>
            </div>
          </SectionCard>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/admin/blogs")}
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : isEditMode ? "Update Blog" : "Publish Blog"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}