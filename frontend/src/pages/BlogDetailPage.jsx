import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiClock, FiEye, FiArrowLeft, FiChevronUp, FiCalendar, FiUser, FiTag, FiHeart, FiBookmark, FiChevronDown } from "react-icons/fi";
import { getPublicBlogBySlug, getRelatedBlogs, getAdjacentBlogs, recordBlogView } from "../services/publicBlogService";
import EmptyState from "../components/common/EmptyState";
import BlogComments from "../components/blog/BlogComments";
import SocialShare from "../components/blog/SocialShare";
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

  // Reading progress (article-based) + back-to-top visibility.
  // Scroll work is throttled to one update per animation frame so the bar
  // stays smooth and lightweight even during fast scrolling.
  useEffect(() => {
    let rafId = null;
    const update = () => {
      rafId = null;
      const scrollTop = window.scrollY;
      setShowBackToTop(scrollTop > 400);

      // Progress reflects how much of the ARTICLE body has been read,
      // not the whole page (which also includes comments, related, prev/next).
      const el = contentRef.current;
      if (!el) {
        setReadingProgress(0);
        return;
      }
      const articleTop = el.getBoundingClientRect().top + scrollTop;
      const scrollable = el.offsetHeight - window.innerHeight;
      const read = scrollTop - articleTop;
      const progress =
        scrollable > 0 ? Math.min(Math.max((read / scrollable) * 100, 0), 100) : 0;
      setReadingProgress(progress);
    };
    const handleScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    update(); // initialize once content is present
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

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

  // Active TOC highlighting via IntersectionObserver (lightweight, no scroll listener)
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const headings = Array.from(contentRef.current.querySelectorAll("h2, h3, h4"));
    if (!headings.length) return;

    const visible = new Set();
    const navbar = document.querySelector("header");
    const navHeight = navbar ? navbar.offsetHeight : 64;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // Highlight the first heading (in document order) currently in view
        let active = headings.find((h) => visible.has(h.id));
        // If nothing is in the active band but we've reached the bottom,
        // keep the last heading highlighted for the final section.
        if (!active && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          active = headings[headings.length - 1];
        }
        if (active) {
          setActiveHeading((prev) => (prev === active.id ? prev : active.id));
        }
      },
      {
        // Activate a heading once it sits just below the fixed navbar,
        // and deactivate it once it scrolls past the upper ~30% of the viewport.
        rootMargin: `-${navHeight + 16}px 0px -70% 0px`,
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [blog?.content]);

  // NOTE: `toc` and `readingTime` are derived from `blog` and are computed
  // AFTER the loading/error guards below, so `blog` is guaranteed non-null.

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
      // Dynamically measure the fixed/sticky navbar height so the heading
      // lands just below it. Falls back to 80px if no header is found.
      const navbar = document.querySelector("header");
      const offset = navbar ? navbar.offsetHeight + 16 : 80;
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
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: `scaleX(${readingProgress / 100})` }}
      />

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
              className="blog-content prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:scroll-mt-24 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300 prose-img:rounded-xl prose-img:mx-auto prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none"
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
                  className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-900"
                  aria-expanded={mobileTocOpen}
                >
                  <span className="text-sm font-semibold text-white">Table of Contents</span>
                  {mobileTocOpen ? <FiChevronUp size={18} className="text-cyan-400" /> : <FiChevronDown size={18} className="text-slate-400" />}
                </button>
                {mobileTocOpen && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <nav className="space-y-1">
                      {toc.map((heading, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToHeading(heading.id)}
                          className={`group relative flex w-full items-center rounded-lg py-2 pl-4 pr-2 text-left text-sm transition-all duration-200 ${
                            activeHeading === heading.id
                              ? "bg-cyan-500/10 font-medium text-cyan-300"
                              : heading.level === 2
                              ? "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                              : heading.level === 3
                              ? "pl-7 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                              : "pl-10 text-slate-500 hover:bg-white/5 hover:text-cyan-300"
                          }`}
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 transition-opacity duration-200 ${
                              activeHeading === heading.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
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

            {/* Social Share */}
            <SocialShare url={blogUrl} title={blog.title} text={blog.excerpt} />

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
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-sm">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Table of Contents</h3>
                <nav className="max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto pr-1">
                  {toc.map((heading, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`group relative flex w-full items-center rounded-lg py-2 pl-4 pr-2 text-left text-sm transition-all duration-200 ${
                        activeHeading === heading.id
                          ? "bg-cyan-500/10 font-medium text-cyan-300"
                          : heading.level === 2
                          ? "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                          : heading.level === 3
                          ? "pl-7 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                          : "pl-10 text-slate-500 hover:bg-white/5 hover:text-cyan-300"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 transition-opacity duration-200 ${
                          activeHeading === heading.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
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