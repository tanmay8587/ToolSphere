import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layout/AdminLayout";
import { getBlogById, addBlog, updateBlog } from "../../services/blogService";
import { deleteImage } from "../../services/adminApi";
import SectionCard from "../../components/admin/form/SectionCard";
import ImageUploader from "../../components/admin/form/ImageUploader";
import GalleryUploader from "../../components/admin/form/GalleryUploader";
import TagInput from "../../components/admin/form/TagInput";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FiAlertCircle, FiEye, FiCalendar } from "react-icons/fi";

/* =====================================
   CONSTANTS
   ===================================== */
const MAX_TITLE = 200;
const MAX_EXCERPT = 500;
const WORDS_PER_MINUTE = 200;

/* =====================================
   HELPERS
   ===================================== */
const createSlug = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const calculateReadingTime = (html = "") => {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

const countWords = (html = "") => {
  const text = html.replace(/<[^>]*>/g, "");
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "");

// Format a Date into a value usable by <input type="datetime-local">.
// Uses the browser's local timezone so the default reflects the user's locale.
const toLocalDateTimeInputValue = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/* =====================================
   QUIL MODULES
   ===================================== */
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    [{ script: "sub" }, { script: "super" }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "indent",
  "link",
  "image",
  "code-block",
  "align",
  "color",
  "background",
  "script",
];

/* =====================================
   FORM INPUT COMPONENTS
   ===================================== */
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
      className={`mt-1 w-full rounded-xl border px-4 py-3 text-white placeholder:text-slate-500 outline-none transition ${
        error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"
      } bg-slate-900`}
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
      className={`mt-1 w-full rounded-xl border px-4 py-3 text-white placeholder:text-slate-500 outline-none transition ${
        error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"
      } bg-slate-900`}
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
      className={`mt-1 w-full rounded-xl border px-4 py-3 text-white outline-none transition ${
        error ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"
      } bg-slate-900`}
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
    <input
      type="checkbox"
      {...props}
      className="h-5 w-5 rounded border-slate-600 bg-slate-800"
    />
    {label}
  </label>
);

/* =====================================
   PAGE
   ===================================== */
export default function BlogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);

  // Warn on page unload when form is dirty (BrowserRouter-compatible)
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

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
    galleryImages: [],
    status: "draft",
    featured: false,
    publishedAt: "",
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
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newsletterCount, setNewsletterCount] = useState(null);

  // Computed values
  const readingTime = calculateReadingTime(form.content);
  const wordCount = countWords(form.content);
  const charCount = stripHtml(form.content).length;

  // Load blog for edit mode
  useEffect(() => {
    if (!id) {
      setFetching(false);
      return;
    }

    const loadBlog = async () => {
      try {
        setFetching(true);
        const result = await getBlogById(id);
        const blog = result.blog || result.data?.blog;

        setForm({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          category: blog.category || "",
          author: blog.author || "",
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          coverImage: blog.coverImage || "",
          galleryImages: Array.isArray(blog.galleryImages)
            ? blog.galleryImages.map((url, index) => ({
                id: `existing-${index}`,
                url,
                status: "uploaded",
              }))
            : [],
          status: blog.status || "draft",
          featured: Boolean(blog.featured),
          publishedAt: blog.publishedAt
            ? toLocalDateTimeInputValue(new Date(blog.publishedAt))
            : "",
          seoTitle: blog.seoTitle || "",
          seoDescription: blog.seoDescription || "",
          seoKeywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords : [],
          canonicalUrl: blog.canonicalUrl || "",
          ogImage: blog.ogImage || "",
          notifyNewsletter: false,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load blog");
      } finally {
        setFetching(false);
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

      // Auto-manage the publish date based on the selected status
      if (name === "status") {
        if (value === "published" && !prev.publishedAt) {
          // Auto-set to the current local date and time when publishing
          updated.publishedAt = toLocalDateTimeInputValue();
        } else if (value === "draft") {
          // Drafts don't require a publish date
          updated.publishedAt = "";
        }
      }

      return updated;
    });

    setDirty(true);

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle rich text content change
  const handleContentChange = (value) => {
    setForm((prev) => ({ ...prev, content: value }));
    setDirty(true);
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: "" }));
    }
  };

  // Handle array field changes
  const handleArrayChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  // Handle gallery changes
  const handleGalleryChange = (next) => {
    setForm((prev) => {
      const removed = prev.galleryImages.filter(
        (img) => !next.some((n) => n.id === img.id)
      );
      removed.forEach((img) => {
        if (img.url && !img.isLocal) deleteImage(img.url);
      });
      return { ...prev, galleryImages: next };
    });
    setDirty(true);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.title?.trim() || form.title.trim().length < 5) {
      newErrors.title = "Blog title must be at least 5 characters.";
    }

    if (!form.slug?.trim()) {
      newErrors.slug = "Slug is required.";
    }

    if (!form.content?.trim() || stripHtml(form.content).trim().length < 50) {
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
      const galleryUrls = form.galleryImages.map((img) => img.url);

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt?.trim() || "",
        content: form.content,
        category: form.category?.trim() || "",
        author: form.author?.trim() || "",
        tags: form.tags,
        coverImage: form.coverImage || "",
        galleryImages: galleryUrls,
        status: form.status,
        featured: Boolean(form.featured),
        seoTitle: form.seoTitle?.trim() || "",
        seoDescription: form.seoDescription?.trim() || "",
        seoKeywords: form.seoKeywords,
        canonicalUrl: form.canonicalUrl?.trim() || "",
        ogImage: form.ogImage || "",
        notifyNewsletter: form.notifyNewsletter,
      };

      // Determine publishedAt based on status and user input
      if (form.status === "draft") {
        // Draft posts: publish date is optional, leave empty
        delete payload.publishedAt;
      } else if (form.publishedAt) {
        // Preserve the user-selected or existing publish date
        payload.publishedAt = new Date(form.publishedAt).toISOString();
      } else if (form.status === "published") {
        // Auto-set to the current local date and time
        payload.publishedAt = new Date().toISOString();
      }
      // For "scheduled" without a date, publishedAt remains undefined

      setLoading(true);

      let result;
      if (isEditMode) {
        result = await updateBlog(id, payload);
        setMessage("Blog updated successfully");
      } else {
        result = await addBlog(payload);
        setMessage("Blog created successfully");
        setDirty(false);
        // Reset form after create
        setForm({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          category: "",
          author: "",
          tags: [],
          coverImage: "",
          galleryImages: [],
          status: "draft",
          featured: false,
          publishedAt: "",
          seoTitle: "",
          seoDescription: "",
          seoKeywords: [],
          canonicalUrl: "",
          ogImage: "",
          notifyNewsletter: false,
        });
      }

      // Check if newsletter was sent
      if (result?.newsletter) {
        setNewsletterCount(result.newsletter.count || 0);
        if (result.newsletter.count > 0) {
          setMessage(
            result.message ||
              `Blog ${isEditMode ? "updated" : "published"} successfully. Newsletter sent to ${result.newsletter.count} subscribers.`
          );
        } else {
          setMessage(
            result.message ||
              `Blog ${isEditMode ? "updated" : "published"} successfully. No active newsletter subscribers to notify.`
          );
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500 mx-auto"></div>
            <p className="text-slate-400">Loading blog...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isEditMode ? "Edit Blog" : "Add New Blog"}
          </h1>
          <p className="text-slate-400 mt-2">
            Create and publish professional blog posts with rich media and SEO
          </p>
        </div>

        {/* Unsaved Changes Warning */}
        {dirty && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-200">
            <p className="text-sm">You have unsaved changes. Remember to save before leaving this page.</p>
          </div>
        )}

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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                maxLength={MAX_TITLE}
                charCount={MAX_TITLE}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input
                    label="Slug"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="auto-generated-from-title"
                    error={errors.slug}
                  />
                  {form.slug && (
                    <p className="mt-1 text-xs text-slate-500">
                      URL: /blog/<span className="text-cyan-400">{form.slug}</span>
                    </p>
                  )}
                </div>

                <Input
                  label="Author"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Author name"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Technology, AI, Tutorial"
                />
              </div>

              <TextArea
                label="Excerpt"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Brief summary of the blog post (max 500 characters)"
                maxLength={MAX_EXCERPT}
                charCount={MAX_EXCERPT}
                rows={3}
              />
            </div>
          </SectionCard>

          {/* SECTION 2: Content - Rich Text Editor */}
          <SectionCard
            title="Content"
            description="Write your blog post content with the rich text editor"
          >
            <div className="space-y-3">
              <div className={errors.content ? "border border-red-500 rounded-xl overflow-hidden" : ""}>
                <ReactQuill
                  value={form.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your blog content here..."
                  theme="snow"
                  className="blog-editor bg-slate-900 text-white rounded-xl"
                />
              </div>
              {errors.content && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <FiAlertCircle size={14} />
                  {errors.content}
                </p>
              )}

              {/* Content Stats */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span>
                  Words: <strong className="text-white">{wordCount}</strong>
                </span>
                <span>
                  Characters: <strong className="text-white">{charCount}</strong>
                </span>
                <span>
                  Reading Time:{" "}
                  <strong className="text-cyan-400">{readingTime} min</strong>
                </span>
              </div>
            </div>
          </SectionCard>

          {/* SECTION 3: Media & Tags */}
          <SectionCard
            title="Media & Tags"
            description="Cover image, gallery, and tags for the blog post"
          >
            <div className="space-y-5">
              <ImageUploader
                label="Cover Image"
                value={form.coverImage}
                onChange={(value) => handleArrayChange("coverImage", value)}
                previewSize="medium"
              />

              <GalleryUploader
                label="Gallery Images"
                value={form.galleryImages}
                onChange={handleGalleryChange}
                maxImages={10}
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

          {/* SECTION 4: SEO */}
          <SectionCard
            title="SEO"
            description="Search engine optimization settings for this blog post"
          >
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="SEO Title"
                  name="seoTitle"
                  value={form.seoTitle}
                  onChange={handleChange}
                  placeholder="SEO title (max 70 characters)"
                  maxLength={70}
                  charCount={70}
                />

                <Input
                  label="Canonical URL"
                  name="canonicalUrl"
                  value={form.canonicalUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/blog/my-post"
                />
              </div>

              <TextArea
                label="SEO Description"
                name="seoDescription"
                value={form.seoDescription}
                onChange={handleChange}
                placeholder="SEO meta description (max 160 characters)"
                maxLength={160}
                charCount={160}
                rows={2}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TagInput
                  label="SEO Keywords"
                  placeholder="Type and press Enter..."
                  value={form.seoKeywords}
                  onChange={(value) => handleArrayChange("seoKeywords", value)}
                  maxTags={15}
                />

                <ImageUploader
                  label="OG Image"
                  value={form.ogImage}
                  onChange={(value) => handleArrayChange("ogImage", value)}
                  previewSize="small"
                />
              </div>

              {/* Live SEO Preview */}
              {(form.seoTitle || form.seoDescription || form.slug) && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">LIVE SEO PREVIEW</p>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-400 hover:underline truncate">
                      {form.seoTitle || form.title || "SEO Title"} - ToolSphere
                    </p>
                    <p className="text-xs text-emerald-600 truncate">
                      {window.location.origin}/blog/{form.slug || "slug"}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {form.seoDescription || form.excerpt || "SEO description goes here..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* SECTION 5: Publishing */}
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
                options={["draft", "published", "scheduled"]}
              />

              <div className="space-y-2">
                <label className="block text-sm text-slate-300">
                  Publish Date
                  {form.publishedAt && (
                    <span className="ml-2 text-xs text-slate-500">
                      <FiCalendar className="inline mr-1" />
                      {new Date(form.publishedAt).toLocaleString()}
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  name="publishedAt"
                  value={form.publishedAt}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 mt-5">
              <Checkbox
                label="Featured Post"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />

              <Checkbox
                label="Notify Newsletter Subscribers"
                name="notifyNewsletter"
                checked={form.notifyNewsletter}
                onChange={handleChange}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Send an email notification to all active newsletter subscribers about this blog post.
            </p>
          </SectionCard>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-4 pt-6 border-t border-slate-800">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() =>
                window.open(
                  `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/blog/${form.slug || "preview"}`,
                  "_blank"
                )
              }
              disabled={!form.slug}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 transition disabled:opacity-50"
            >
              <FiEye size={16} />
              Preview
            </button>

            <button
              type="button"
              onClick={() => navigate(isEditMode ? "/admin/blogs" : "/admin/blogs")}
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : isEditMode ? (
                "Update Blog"
              ) : (
                "Publish Blog"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}