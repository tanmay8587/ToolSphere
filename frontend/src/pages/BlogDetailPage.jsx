import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiClock, FiEye, FiArrowLeft, FiShare2, FiChevronUp, FiCalendar, FiUser, FiTag } from "react-icons/fi";
import { getPublicBlogBySlug } from "../services/publicBlogService";
import EmptyState from "../components/common/EmptyState";

/* =====================================
   HELPERS
   ===================================== */
const calculateReadingTime = (html = "") => {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const generateTableOfContents = (html) => {
  if (!html) return [];
  const headingRegex = /<h([2-4])(?:\s[^>]*)?>(.*?)<\/h\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, ""),
      id: match[2].replace(/<[^>]*>/g, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  }
  return headings;
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* =====================================
   PAGE
   ===================================== */
export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPublicBlogBySlug(slug);
        if (result.success && result.blog) {
          setBlog(result.blog);
          setRelatedBlogs(result.relatedBlogs || []);
        } else {
          setError("Blog not found");
        }
      } catch (err) {
        setError("Failed to load blog");
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setReadingProgress(progress);
      setShowBackToTop(scrollTop > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add IDs to headings for table of contents
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const container = contentRef.current;
    container.querySelectorAll("h2, h3, h4").forEach((heading) => {
      const text = heading.textContent || "";
      const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      heading.id = id;
    });
  }, [blog?.content]);

  const toc = generateTableOfContents(blog?.content);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // aborted
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
          <div className="h-8 w-3/4 bg-slate-800 rounded-lg" />
          <div className="h-4 w-1/2 bg-slate-800 rounded" />
          <div className="h-72 bg-slate-800 rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-4 bg-slate-800 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          type="search"
          title="Blog not found"
          description={error || "The blog post you're looking for doesn't exist."}
          action={
            <Link to="/blog" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20">
              <FiArrowLeft size={16} />
              Back to Blog
            </Link>
          }
        />
      </div>
    );
  }

  const readingTime = blog.readingTime || calculateReadingTime(blog.content);
  const blogUrl = window.location.origin + "/blog/" + blog.slug;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt,
    image: blog.coverImage || blog.ogImage,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": "Person",
      name: blog.author || "ToolSphere",
    },
    publisher: {
      "@type": "Organization",
      name: "ToolSphere",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": blogUrl },
    wordCount: blog.content ? blog.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length : 0,
  };

  return (
    <>
      <Helmet>
        <title>{blog.seoTitle || `${blog.title} | ToolSphere Blog`}</title>
        <meta name="description" content={blog.seoDescription || blog.excerpt || ""} />
        {blog.seoKeywords?.length > 0 && <meta name="keywords" content={blog.seoKeywords.join(", ")} />}
        {blog.canonicalUrl && <link rel="canonical" href={blog.canonicalUrl} />}
        {/* OpenGraph */}
        <meta property="og:title" content={blog.seoTitle || blog.title} />
        <meta property="og:description" content={blog.seoDescription || blog.excerpt || ""} />
        <meta property="og:image" content={blog.ogImage || blog.coverImage || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={blogUrl} />
        <meta property="og:site_name" content="ToolSphere" />
        <meta property="article:published_time" content={blog.publishedAt} />
        <meta property="article:author" content={blog.author || "ToolSphere"} />
        {blog.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={blog.seoDescription || blog.excerpt || ""} />
        <meta name="twitter:image" content={blog.ogImage || blog.coverImage || ""} />
        {/* Breadcrumb */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-150" style={{ width: `${readingProgress}%` }} />

      {/* Sticky Share (Desktop) */}
      <div className="hidden lg:flex fixed left-6 top-1/3 z-50 flex-col gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 transition"
          title="Share"
        >
          <FiShare2 size={18} />
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 transition"
          title="Copy link"
        >
          {copied ? "✓" : <FiShare2 size={18} />}
        </button>
      </div>

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition">
          <FiArrowLeft size={16} />
          Back to Blog
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          {/* Main Content */}
          <div>
            {/* Cover Image */}
            {blog.coverImage && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {blog.category && (
                <Link to={`/blog?category=${encodeURIComponent(blog.category)}`} className="rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition">
                  {blog.category}
                </Link>
              )}
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <FiCalendar size={14} />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <FiClock size={14} />
                {readingTime} min read
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <FiEye size={14} />
                {blog.views || 0} views
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {blog.title}
            </h1>

            {/* Author */}
            {blog.author && (
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-sm font-semibold text-white">
                  {blog.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{blog.author}</p>
                  <p className="text-xs text-slate-400">Author</p>
                </div>
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-cyan-500 pl-4 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-cyan-400 prose-pre:bg-slate-900 prose-code:text-cyan-300 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <FiTag className="text-slate-400" size={16} />
                  <span className="text-sm font-medium text-slate-400">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?search=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 hover:bg-white/10 hover:text-cyan-300 transition"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Updated date */}
            {blog.updatedAt && blog.updatedAt !== blog.publishedAt && (
              <p className="mt-6 text-sm text-slate-500">
                Last updated: {formatDate(blog.updatedAt)}
              </p>
            )}

            {/* Mobile share */}
            <div className="lg:hidden flex items-center gap-3 mt-8 pt-6 border-t border-slate-800">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition"
              >
                {copied ? "✓ Copied" : "Copy Link"}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition"
              >
                <FiShare2 size={16} />
                Share
              </button>
            </div>
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block space-y-6">
            {/* Table of Contents */}
            {toc.length > 0 && (
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Table of Contents</h3>
                <nav className="space-y-1.5">
                  {toc.map((heading, i) => (
                    <a
                      key={i}
                      href={`#${heading.id}`}
                      className={`block text-sm transition hover:text-cyan-400 ${
                        heading.level === 2 ? "text-slate-300" : heading.level === 3 ? "text-slate-400 ml-3" : "text-slate-500 ml-6"
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Related Blogs */}
            {relatedBlogs.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Related Articles</h3>
                <div className="space-y-4">
                  {relatedBlogs.slice(0, 4).map((related) => (
                    <Link key={related._id} to={`/blog/${related.slug}`} className="group block">
                      <p className="text-sm text-slate-300 group-hover:text-cyan-400 transition line-clamp-2">
                        {related.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(related.publishedAt)} · {related.readingTime || calculateReadingTime(related.content)} min
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Back to Top */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 transition shadow-cyan-500/25"
          >
            <FiChevronUp size={20} />
          </button>
        )}
      </article>
    </>
  );
}