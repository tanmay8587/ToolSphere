import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiClock, FiEye, FiArrowLeft, FiShare2, FiChevronUp, FiCalendar, FiUser, FiTag, FiHeart, FiBookmark, FiChevronDown } from "react-icons/fi";
import { getPublicBlogBySlug, getRelatedBlogs, getAdjacentBlogs, recordBlogView } from "../services/publicBlogService";
import EmptyState from "../components/common/EmptyState";
import BlogComments from "../components/blog/BlogComments";
import {
  getBlogInteraction,
  likeBlog,
  unlikeBlog,
  bookmarkBlog,
  removeBookmark,
} from "../services/blogInteractionService";
import { isLoggedIn } from "../utils/auth";
import { useNavigate } from "react-router-dom";

/* =====================================
   HELPERS
   ===================================== */
const calculateReadingTime = (html = "") => {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * Decode common HTML entities (e.g. &nbsp;, &#39;, &) into plain text.
 * Used to produce clean heading text for the Table of Contents and to keep
 * anchor ids consistent with the rendered (decoded) DOM headings.
 */
const decodeHtmlEntities = (str = "") => {
  if (typeof document === "undefined") {
    // Fallback for non-DOM environments (e.g. SSR/tests)
    return str
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&/g, "&")
      .replace(/"/g, '"')
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

/**
 * Convert a heading's text into a stable, URL-safe slug used for anchor ids.
 * Decodes HTML entities first so it matches the decoded textContent of the
 * rendered DOM heading (which is what scrollToHeading targets).
 */
const slugifyHeading = (text = "") => {
  return decodeHtmlEntities(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
};

const generateTableOfContents = (html) => {
  if (!html) return [];
  const headingRegex = /<h([2-4])(?:\s[^>]*)?>(.*?)<\/h\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const rawText = match[2].replace(/<[^>]*>/g, "");
    const cleanText = decodeHtmlEntities(rawText).replace(/\s+/g, " ").trim();
    headings.push({
      level: parseInt(match[1]),
      text: cleanText,
      id: slugifyHeading(rawText),
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
  const [previousBlog, setPreviousBlog] = useState(null);
  const [nextBlog, setNextBlog] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [bookmarks, setBookmarks] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [views, setViews] = useState(0);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPublicBlogBySlug(slug);
        if (result.success && result.blog) {
          setBlog(result.blog);
          setViews(result.blog.views || 0);
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

  // Record a view via the existing View API when the blog opens
  useEffect(() => {
    if (!slug) return;
    recordBlogView(slug)
      .then((data) => {
        if (data.success) {
          setViews(data.views || 0);
        }
      })
      .catch(() => {
        // Non-blocking: keep the views loaded from the blog payload
      });
  }, [slug]);

  // Load like/bookmark state for the current user
  useEffect(() => {
    if (!slug) return;
    getBlogInteraction(slug)
      .then((data) => {
        if (data.success) {
          setLikes(data.likes || 0);
          setBookmarks(data.bookmarks || 0);
          setIsLiked(!!data.isLiked);
          setIsBookmarked(!!data.isBookmarked);
        }
      })
      .catch(() => {
        // Non-blocking: counts simply stay at 0
      });
  }, [slug]);

  /**
   * Load related blogs and prev/next navigation
   */
  useEffect(() => {
    const loadRelated = async () => {
      if (!slug) return;
      try {
        const [relatedRes, adjacentRes] = await Promise.all([
          getRelatedBlogs(slug),
          getAdjacentBlogs(slug),
        ]);
        if (relatedRes.success) {
          setRelatedBlogs(relatedRes.relatedBlogs || []);
        }
        if (adjacentRes.success) {
          setPreviousBlog(adjacentRes.previousBlog);
          setNextBlog(adjacentRes.nextBlog);
        }
      } catch (err) {
        // Non-blocking
      }
    };
    loadRelated();
  }, [slug]);

  // Reading progress and active heading detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setReadingProgress(progress);
      setShowBackToTop(scrollTop > 400);

      // Detect active heading
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll("h2, h3, h4");
        let current = "";
        headings.forEach((heading) => {
          const headingTop = heading.getBoundingClientRect().top;
          if (headingTop <= 150) {
            current = heading.id;
          }
        });
        if (current && current !== activeHeading) {
          setActiveHeading(current);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeHeading]);

  // Add IDs to headings for table of contents
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const container = contentRef.current;
    container.querySelectorAll("h2, h3, h4").forEach((heading) => {
      const text = heading.textContent || "";
      const id = slugifyHeading(text);
      if (id) heading.id = id;
    });
  }, [blog?.content]);

  // NOTE: `toc` and `readingTime` are derived from `blog` and are computed
  // AFTER the loading/error guards below, so `blog` is guaranteed non-null.

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

  // Redirect unauthenticated users to login before interacting
  const requireAuth = () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    setInteractionLoading(true);
    try {
      const data = isLiked
        ? await unlikeBlog(slug)
        : await likeBlog(slug);
      if (data.success) {
        setLikes(data.likes || 0);
        setIsLiked(!!data.isLiked);
      }
    } catch {
      // ignore network errors; state unchanged
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth()) return;
    setInteractionLoading(true);
    try {
      const data = isBookmarked
        ? await removeBookmark(slug)
        : await bookmarkBlog(slug);
      if (data.success) {
        setBookmarks(data.bookmarks || 0);
        setIsBookmarked(!!data.isBookmarked);
      }
    } catch {
      // ignore network errors; state unchanged
    } finally {
      setInteractionLoading(false);
    }
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
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

  // Derived values that depend on `blog` are computed ONLY after the guards
  // above, so `blog` is guaranteed to be a non-null object here.
  const toc = generateTableOfContents(blog.content);
  const readingTime = blog.readingTime ?? calculateReadingTime(blog.content ?? "");

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
          className="flex items-center justify-center rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 transition"
          title="Share this article"
          aria-label="Share this article"
        >
          <FiShare2 size={18} />
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
                {views} views
              </span>

              {/* Like / Bookmark */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={interactionLoading}
                  aria-pressed={isLiked}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                    isLiked
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <FiHeart size={15} className={isLiked ? "fill-rose-400 text-rose-400" : ""} />
                  <span>{likes}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={interactionLoading}
                  aria-pressed={isBookmarked}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                    isBookmarked
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  title={isBookmarked ? "Remove bookmark" : "Save"}
                >
                  <FiBookmark size={15} className={isBookmarked ? "fill-cyan-400 text-cyan-400" : ""} />
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {blog.title}
            </h1>

            {/* Reading Information Section */}
            <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-2xl border border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FiClock size={16} className="text-cyan-400" />
                <span className="font-medium">{readingTime} min read</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <FiCalendar size={16} />
                <div>
                  <span className="text-slate-500">Published:</span>{" "}
                  <span className="text-slate-300">{formatDate(blog.publishedAt || blog.createdAt)}</span>
                </div>
              </div>
              {blog.updatedAt && blog.updatedAt !== blog.publishedAt && (
                <>
                  <div className="h-4 w-px bg-slate-700" />
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FiCalendar size={16} />
                    <div>
                      <span className="text-slate-500">Updated:</span>{" "}
                      <span className="text-slate-300">{formatDate(blog.updatedAt)}</span>
                    </div>
                  </div>
                </>
              )}
              {blog.author && (
                <>
                  <div className="h-4 w-px bg-slate-700" />
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FiUser size={16} />
                    <span className="text-slate-300">{blog.author}</span>
                  </div>
                </>
              )}
            </div>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-cyan-500 pl-4 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="blog-content prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-cyan-400 prose-pre:bg-slate-900 prose-code:text-cyan-300 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300"
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

            {/* Mobile Table of Contents Accordion */}
            {toc.length >= 2 && (
              <div className="lg:hidden mt-10 pt-8 border-t border-slate-800">
                <button
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left hover:border-cyan-500/50 transition"
                  aria-expanded={mobileTocOpen}
                >
                  <span className="text-sm font-semibold text-white">Table of Contents</span>
                  {mobileTocOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                </button>
                {mobileTocOpen && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <nav className="space-y-2">
                      {toc.map((heading, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToHeading(heading.id)}
                          className={`block w-full text-left text-sm transition hover:text-cyan-400 ${
                            activeHeading === heading.id
                              ? "text-cyan-400 font-medium"
                              : heading.level === 2
                              ? "text-slate-300"
                              : heading.level === 3
                              ? "text-slate-400 ml-3"
                              : "text-slate-500 ml-6"
                          }`}
                        >
                          {heading.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
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
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition"
                aria-label="Share this article"
              >
                <FiShare2 size={16} />
                {copied ? "Link Copied" : "Share"}
              </button>
            </div>

            {/* Related Articles */}
            {relatedBlogs.length > 0 && (
              <div className="mt-16 pt-10 border-t border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedBlogs.map((related) => (
                    <Link
                      key={related._id}
                      to={`/blog/${related.slug}`}
                      className="group rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      {related.coverImage && (
                        <div className="h-40 overflow-hidden">
                          <img
                            src={related.coverImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        {related.category && (
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                            {related.category}
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {related.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
                          <span className="flex items-center gap-1">
                            <FiClock size={12} />
                            {related.readingTime || "5"} min
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar size={12} />
                            {formatDate(related.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Previous / Next Navigation */}
            {(previousBlog || nextBlog) && (
              <div className="mt-12 pt-8 border-t border-slate-800">
                <div className="grid gap-6 md:grid-cols-2">
                  {previousBlog ? (
                    <Link
                      to={`/blog/${previousBlog.slug}`}
                      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      <span className="text-xs font-medium text-slate-400 mb-2 block">Previous Article</span>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                        {previousBlog.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                        {previousBlog.category && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">
                            {previousBlog.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {formatDate(previousBlog.publishedAt)}
                        </span>
                      </div>
                    </Link>
                  ) : <div />}

                  {nextBlog ? (
                    <Link
                      to={`/blog/${nextBlog.slug}`}
                      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 text-right"
                    >
                      <span className="text-xs font-medium text-slate-400 mb-2 block">Next Article</span>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                        {nextBlog.title}
                      </h3>
                      <div className="flex items-center justify-end gap-3 text-xs text-slate-500 mt-3">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {formatDate(nextBlog.publishedAt)}
                        </span>
                        {nextBlog.category && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">
                            {nextBlog.category}
                          </span>
                        )}
                      </div>
                    </Link>
                  ) : <div />}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block space-y-6">
            {/* Table of Contents */}
            {toc.length >= 2 && (
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Table of Contents</h3>
                <nav className="space-y-1.5">
                  {toc.map((heading, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`block w-full text-left text-sm transition hover:text-cyan-400 ${
                        activeHeading === heading.id
                          ? "text-cyan-400 font-medium"
                          : heading.level === 2
                          ? "text-slate-300"
                          : heading.level === 3
                          ? "text-slate-400 ml-3"
                          : "text-slate-500 ml-6"
                      }`}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
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

      {/* Comments & Replies */}
      {blog && <BlogComments slug={blog.slug} />}
    </>
  );
}