import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiClock, FiEye, FiArrowLeft, FiChevronUp, FiCalendar, FiUser, FiTag, FiHeart, FiBookmark, FiChevronDown, FiChevronRight, FiList } from "react-icons/fi";
import { getPublicBlogBySlug, getRelatedBlogs, getAdjacentBlogs, recordBlogView } from "../services/publicBlogService";
import EmptyState from "../components/common/EmptyState";
import BlogComments from "../components/blog/BlogComments";
import SocialShare from "../components/blog/SocialShare";
import { ToastContainer, useToast } from "../components/common/Toast";
import {
  getBlogInteraction,
  likeBlog,
  unlikeBlog,
  saveBlog,
  getSavedBlogs,
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
 * Calculate the total word count from HTML content.
 */
const getWordCount = (html = "") => {
  const text = html.replace(/<[^>]*>/g, "");
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Format remaining reading time into a human-friendly string.
 * Returns "Completed" when progress >= 100%.
 */
const formatRemainingTime = (progress, totalWords) => {
  if (progress >= 100) return "Completed";
  const remainingWords = totalWords * (1 - progress / 100);
  const remainingMinutes = Math.ceil(remainingWords / 200);
  if (remainingMinutes < 1) return "Less than 1 min left";
  if (remainingMinutes === 1) return "About 1 min left";
  return `About ${remainingMinutes} min left`;
};

const decodeHtmlEntities = (str = "") => {
  if (typeof document === "undefined") {
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

const groupTocBySections = (toc) => {
  const sections = [];
  let currentSection = null;
  for (const item of toc) {
    if (item.level === 2) {
      currentSection = { h2: item, children: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.children.push(item);
    }
  }
  return sections;
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
  const [remainingTime, setRemainingTime] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [likes, setLikes] = useState(0);
  const [bookmarks, setBookmarks] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [views, setViews] = useState(0);
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

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

  useEffect(() => {
    if (!slug) return;
    recordBlogView(slug)
      .then((data) => {
        if (data.success) {
          setViews(data.views || 0);
        }
      })
      .catch(() => {});
  }, [slug]);

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
      .catch(() => {});
  }, [slug]);

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
      } catch (err) {}
    };
    loadRelated();
  }, [slug]);

  // Reading progress + remaining time + back-to-top — throttled with rAF.
  // Progress is 0% when the top of the article content reaches the top of the
  // viewport (just below the navbar), and 100% when the bottom of the article
  // content reaches the bottom of the viewport. The bar is hidden (opacity 0)
  // before the article enters the viewport.
  useEffect(() => {
    let rafId = null;
    const navbar = document.querySelector("header");
    const navHeight = navbar ? navbar.offsetHeight : 64;

    // Cache total word count so we don't recompute on every frame
    let totalWords = 0;
    // Throttle localStorage writes — only persist every 500ms of scrolling
    let lastPersist = 0;

    const update = () => {
      rafId = null;
      const scrollTop = window.scrollY;
      setShowBackToTop(scrollTop > 400);

      const el = contentRef.current;
      if (!el) {
        setReadingProgress(0);
        setRemainingTime("");
        return;
      }

      // Compute total words once and cache
      if (totalWords === 0) {
        totalWords = getWordCount(blog?.content || "");
      }

      const rect = el.getBoundingClientRect();
      const articleTop = rect.top + scrollTop;
      const articleBottom = articleTop + el.offsetHeight;

      // The "start" is when the article's top edge reaches the navbar bottom
      const start = articleTop - navHeight - 20;
      // The "end" is when the article's bottom edge reaches the viewport bottom
      const end = articleBottom - window.innerHeight;

      let progress;
      if (scrollTop <= start) {
        // Before the article starts — hide the bar
        progress = 0;
      } else if (scrollTop >= end) {
        // Past the end of the article — exactly 100%
        progress = 100;
      } else {
        // Within the article — interpolate linearly
        progress = ((scrollTop - start) / (end - start)) * 100;
        progress = Math.min(Math.max(progress, 0), 100);
      }

      setReadingProgress(progress);
      setRemainingTime(formatRemainingTime(progress, totalWords));

      // Persist reading position to localStorage (throttled)
      const now = Date.now();
      if (progress > 0 && progress < 100 && now - lastPersist > 500) {
        lastPersist = now;
        try {
          const scrollY = window.scrollY;
          localStorage.setItem(
            `blog_progress_${slug}`,
            JSON.stringify({ scrollY, progress, updatedAt: now })
          );
        } catch {
          // localStorage may be full or unavailable
        }
      }

      // Clear saved progress when article is completed
      if (progress >= 100) {
        try {
          localStorage.removeItem(`blog_progress_${slug}`);
        } catch {
          // noop
        }
      }
    };

    const handleScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [blog?.content, slug]);

  // Assign heading IDs after content renders
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const container = contentRef.current;
    container.querySelectorAll("h2, h3, h4").forEach((heading) => {
      if (!heading.id) {
        const text = heading.textContent || "";
        const id = slugifyHeading(text);
        if (id) heading.id = id;
      }
    });
  }, [blog?.content]);

  // Scroll to heading on initial hash load — highest priority
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) {
        const navbar = document.querySelector("header");
        const offset = navbar ? navbar.offsetHeight + 20 : 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    });
  }, [blog?.content]);

  // Check for saved reading position on load (only if no URL hash is present)
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    // If there's a URL hash, the hash handler above takes priority — skip resume
    if (window.location.hash) return;

    try {
      const saved = localStorage.getItem(`blog_progress_${slug}`);
      if (saved) {
        const data = JSON.parse(saved);
        // Only show resume if progress is between 5% and 95%
        if (data.progress > 5 && data.progress < 95) {
          setShowResume(true);
        }
      }
    } catch {
      // Invalid or missing data — noop
    }
  }, [blog?.content, slug]);

  // Handle resume — scroll to saved position
  const handleResume = useCallback(() => {
    try {
      const saved = localStorage.getItem(`blog_progress_${slug}`);
      if (saved) {
        const data = JSON.parse(saved);
        const navbar = document.querySelector("header");
        const offset = navbar ? navbar.offsetHeight + 20 : 80;
        const targetY = Math.max(0, data.scrollY - offset);
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    } catch {
      // noop
    }
    setShowResume(false);
  }, [slug]);

  // Active heading via IntersectionObserver — stable callback
  useEffect(() => {
    if (!blog?.content || !contentRef.current) return;
    const headings = Array.from(contentRef.current.querySelectorAll("h2, h3, h4"));
    if (!headings.length) return;

    const navbar = document.querySelector("header");
    const navHeight = navbar ? navbar.offsetHeight : 64;
    const visibleMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleMap.set(entry.target.id, entry.isIntersecting);
        });

        let active = null;
        for (const h of headings) {
          if (visibleMap.get(h.id)) {
            active = h;
            break;
          }
        }

        if (!active) {
          for (let i = headings.length - 1; i >= 0; i--) {
            const rect = headings[i].getBoundingClientRect();
            if (rect.top < navHeight + 20) {
              active = headings[i];
              break;
            }
          }
        }

        if (!active && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          active = headings[headings.length - 1];
        }

        if (active) {
          setActiveHeading((prev) => (prev === active.id ? prev : active.id));
        }
      },
      {
        rootMargin: `-${navHeight + 20}px 0px -70% 0px`,
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [blog?.content]);

  // Auto-expand active section
  const toc = useMemo(() => generateTableOfContents(blog?.content || ""), [blog?.content]);
  const tocSections = useMemo(() => groupTocBySections(toc), [toc]);

  useEffect(() => {
    if (!toc.length) return;
    const sections = groupTocBySections(toc);
    const nextExpanded = new Set();

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.h2.id === activeHeading || section.children.some((c) => c.id === activeHeading)) {
        nextExpanded.add(i);
      }
    }

    if (nextExpanded.size === 0) return;

    setExpandedSections((prev) => {
      const merged = new Set(prev);
      for (const idx of nextExpanded) merged.add(idx);
      return merged;
    });
  }, [activeHeading, toc]);

  // Stable callbacks — no unnecessary re-renders
  const requireAuth = useCallback(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return false;
    }
    return true;
  }, [navigate]);

  const handleLike = useCallback(async () => {
    if (!requireAuth() || likeLoading) return;
    const previousLiked = isLiked;
    const previousLikes = likes;
    const nextLiked = !isLiked;
    const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));

    setIsLiked(nextLiked);
    setLikes(nextLikes);
    setLikeAnim(true);
    setLikeLoading(true);

    try {
      const data = previousLiked ? await unlikeBlog(slug) : await likeBlog(slug);
      if (data && data.success) {
        setLikes(typeof data.totalLikes === "number" ? data.totalLikes : nextLikes);
        setIsLiked(typeof data.liked === "boolean" ? data.liked : nextLiked);
        addToast(data.liked ? "Liked!" : "Like removed", "success", 2000);
      } else {
        setIsLiked(previousLiked);
        setLikes(previousLikes);
        addToast("Something went wrong", "error", 3000);
      }
    } catch {
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      addToast("Failed to update like. Please try again.", "error", 3000);
    } finally {
      setLikeLoading(false);
      setTimeout(() => setLikeAnim(false), 300);
    }
  }, [requireAuth, likeLoading, isLiked, likes, slug, addToast]);

  const handleBookmark = useCallback(async () => {
    if (!requireAuth() || saveLoading) return;
    const previousBookmarked = isBookmarked;
    const nextBookmarked = !isBookmarked;

    setIsBookmarked(nextBookmarked);
    setSaveLoading(true);

    try {
      const data = await saveBlog(slug);
      if (data && data.success) {
        setIsBookmarked(typeof data.saved === "boolean" ? data.saved : nextBookmarked);
        addToast(data.saved ? "Blog saved!" : "Blog unsaved", "success", 2000);
      } else {
        setIsBookmarked(previousBookmarked);
        addToast("Something went wrong", "error", 3000);
      }
    } catch {
      setIsBookmarked(previousBookmarked);
      addToast("Failed to save. Please try again.", "error", 3000);
    } finally {
      setSaveLoading(false);
    }
  }, [requireAuth, saveLoading, isBookmarked, slug, addToast]);

  const scrollToHeading = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      history.replaceState(null, "", `#${id}`);
      const navbar = document.querySelector("header");
      const offset = navbar ? navbar.offsetHeight + 20 : 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }, []);

  const toggleSection = useCallback((sectionIdx, h2Id) => {
    scrollToHeading(h2Id);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIdx)) next.delete(sectionIdx);
      else next.add(sectionIdx);
      return next;
    });
  }, [scrollToHeading]);

  // Keyboard handler for TOC items
  const handleTocKeyDown = useCallback(
    (id) => (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollToHeading(id);
      }
    },
    [scrollToHeading]
  );

  const handleSectionKeyDown = useCallback(
    (sectionIdx, h2Id) => (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSection(sectionIdx, h2Id);
      }
    },
    [toggleSection]
  );

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
    author: { "@type": "Person", name: blog.author || "ToolSphere" },
    publisher: { "@type": "Organization", name: "ToolSphere" },
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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={blog.seoDescription || blog.excerpt || ""} />
        <meta name="twitter:image" content={blog.ogImage || blog.coverImage || ""} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Reading Progress Bar — fixed at top, hidden before article starts */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-150 ease-out will-change-transform"
        style={{
          transform: `scaleX(${readingProgress / 100})`,
          opacity: readingProgress > 0 ? 1 : 0,
        }}
      />

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors duration-200">
          <FiArrowLeft size={16} />
          Back to Blog
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          {/* Main Content */}
          <div>
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

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {blog.category && (
                <Link to={`/blog?category=${encodeURIComponent(blog.category)}`} className="rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors duration-200">
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

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "Unlike this blog" : "Like this blog"}
                  aria-busy={likeLoading}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                    isLiked
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95"
                  }`}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <FiHeart size={15} className={`transition-transform duration-200 ${isLiked ? "fill-rose-400 text-rose-400" : ""} ${likeAnim ? "scale-125" : "scale-100"}`} />
                  <span className="tabular-nums">{likes}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={saveLoading}
                  aria-pressed={isBookmarked}
                  aria-label={isBookmarked ? "Remove bookmark" : "Save this blog"}
                  aria-busy={saveLoading}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                    isBookmarked
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95"
                  }`}
                  title={isBookmarked ? "Remove bookmark" : "Save"}
                >
                  <FiBookmark size={15} className={isBookmarked ? "fill-cyan-400 text-cyan-400" : ""} />
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {blog.title}
            </h1>

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

            {blog.excerpt && (
              <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-cyan-500 pl-4 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Resume Reading button */}
            {showResume && (
              <div className="mb-6 animate-fadeIn">
                <button
                  onClick={handleResume}
                  className="group inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all duration-200 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:shadow-sm hover:shadow-cyan-500/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  <FiArrowLeft size={14} className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  Resume Reading
                </button>
              </div>
            )}

            <div
              ref={contentRef}
              className="blog-content prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:scroll-mt-24 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300 prose-img:rounded-xl prose-img:mx-auto prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

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
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 hover:bg-white/10 hover:text-cyan-300 transition-colors duration-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile TOC */}
            {toc.length >= 2 && (
              <div className="lg:hidden mt-10 pt-8 border-t border-slate-800">
                <button
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 p-4 text-left transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  aria-expanded={mobileTocOpen}
                  aria-controls="mobile-toc-panel"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FiList size={16} className="text-cyan-400" />
                    Table of Contents
                  </span>
                  {mobileTocOpen ? <FiChevronUp size={18} className="text-cyan-400" /> : <FiChevronDown size={18} className="text-slate-400" />}
                </button>
                <div
                  id="mobile-toc-panel"
                  role="region"
                  aria-label="Table of Contents"
                  className={`grid transition-all duration-300 ease-in-out ${
                    mobileTocOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
                    <nav className="p-3 space-y-0.5">
                      {toc.map((heading, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            scrollToHeading(heading.id);
                            setMobileTocOpen(false);
                          }}
                          onKeyDown={handleTocKeyDown(heading.id)}
                          tabIndex={0}
                          role="link"
                          aria-current={activeHeading === heading.id ? "true" : undefined}
                          className={`group relative flex w-full items-center rounded-lg py-2 pl-4 pr-3 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset ${
                            activeHeading === heading.id
                              ? "bg-cyan-500/10 font-medium text-cyan-300"
                              : heading.level === 2
                              ? "text-slate-300 hover:bg-white/[0.04] hover:text-cyan-200"
                              : heading.level === 3
                              ? "pl-7 text-slate-400 hover:bg-white/[0.04] hover:text-cyan-200"
                              : "pl-10 text-slate-500 hover:bg-white/[0.04] hover:text-cyan-200"
                          }`}
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all duration-200 ${
                              activeHeading === heading.id
                                ? "bg-cyan-400 opacity-100 scale-y-100"
                                : "bg-cyan-400/40 opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-75"
                            }`}
                          />
                          {heading.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {blog.updatedAt && blog.updatedAt !== blog.publishedAt && (
              <p className="mt-6 text-sm text-slate-500">
                Last updated: {formatDate(blog.updatedAt)}
              </p>
            )}

            <SocialShare url={blogUrl} title={blog.title} text={blog.excerpt} />

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

            {(previousBlog || nextBlog) && (
              <div className="mt-12 pt-8 border-t border-slate-800">
                <div className="grid gap-6 md:grid-cols-2">
                  {previousBlog ? (
                    <Link
                      to={`/blog/${previousBlog.slug}`}
                      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      <span className="text-xs font-medium text-slate-400 mb-2 block">Previous Article</span>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">{previousBlog.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                        {previousBlog.category && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">{previousBlog.category}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {formatDate(previousBlog.publishedAt)}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextBlog ? (
                    <Link
                      to={`/blog/${nextBlog.slug}`}
                      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 text-right"
                    >
                      <span className="text-xs font-medium text-slate-400 mb-2 block">Next Article</span>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">{nextBlog.title}</h3>
                      <div className="flex items-center justify-end gap-3 text-xs text-slate-500 mt-3">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {formatDate(nextBlog.publishedAt)}
                        </span>
                        {nextBlog.category && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">{nextBlog.category}</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Desktop TOC */}
          <aside className="hidden lg:block space-y-6" aria-label="Table of Contents">
            {toc.length >= 2 && (
              <div className="sticky top-[100px] rounded-xl border border-white/[0.06] bg-slate-950/80 p-5 backdrop-blur-sm shadow-lg shadow-black/10">
                {/* Reading progress indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Reading Progress</span>
                    <span
                      className="text-[12px] font-semibold tabular-nums transition-all duration-200"
                      style={{
                        color: readingProgress >= 100 ? "#22d3ee" : readingProgress > 0 ? "#94a3b8" : "#64748b",
                      }}
                    >
                      {Math.round(readingProgress)}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-800/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150 ease-out"
                      style={{
                        width: `${Math.min(readingProgress, 100)}%`,
                        opacity: readingProgress > 0 ? 1 : 0,
                      }}
                    />
                  </div>
                  {/* Estimated time remaining */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <FiClock size={11} className="text-slate-500 shrink-0" />
                    <span
                      className="text-[11px] font-medium transition-all duration-200"
                      style={{
                        color: remainingTime === "Completed" ? "#22d3ee" : "#94a3b8",
                      }}
                    >
                      {remainingTime || "—"}
                    </span>
                  </div>
                </div>

                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 flex items-center gap-2">
                  <FiList size={14} className="text-cyan-400" />
                  On this page
                </h3>
                <nav
                  className="max-h-[calc(100vh-148px)] space-y-0.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-600/50 transition-colors"
                  role="list"
                  aria-label="Section navigation"
                >
                  {tocSections.map((section, sectionIdx) => {
                    const isExpanded = expandedSections.has(sectionIdx);
                    const hasChildren = section.children.length > 0;
                    const isH2Active = activeHeading === section.h2.id;
                    const isChildActive = section.children.some((c) => c.id === activeHeading);

                    return (
                      <div key={section.h2.id} className="overflow-hidden">
                        {/* H2 section header */}
                        <div className="mb-px">
                          <button
                            onClick={() => toggleSection(sectionIdx, section.h2.id)}
                            onKeyDown={handleSectionKeyDown(sectionIdx, section.h2.id)}
                            tabIndex={0}
                            role="listitem"
                            aria-current={isH2Active ? "true" : undefined}
                            aria-expanded={hasChildren ? isExpanded : undefined}
                            className={`group relative flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium leading-snug transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset ${
                              isH2Active
                                ? "bg-cyan-500/[0.08] text-cyan-300"
                                : isChildActive
                                ? "text-cyan-200/80"
                                : "text-slate-300 hover:bg-white/[0.03] hover:text-slate-200"
                            }`}
                          >
                            {/* Active indicator bar */}
                            <span
                              className={`absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                                isH2Active
                                  ? "bg-cyan-400 opacity-100 scale-y-100"
                                  : isChildActive
                                  ? "bg-cyan-400/50 opacity-100 scale-y-75"
                                  : "bg-cyan-400/30 opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-75"
                              }`}
                            />
                            <span className="flex-1 truncate">{section.h2.text}</span>
                            {hasChildren && (
                              <FiChevronRight
                                size={11}
                                className={`ml-1.5 shrink-0 transition-all duration-300 ${
                                  isExpanded ? "rotate-90 text-cyan-400" : "text-slate-500 group-hover:text-slate-400"
                                }`}
                              />
                            )}
                          </button>
                        </div>

                        {/* Nested H3/H4 children with animation */}
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            {section.children.map((child) => {
                              const isActive = activeHeading === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => scrollToHeading(child.id)}
                                  onKeyDown={handleTocKeyDown(child.id)}
                                  tabIndex={0}
                                  role="listitem"
                                  aria-current={isActive ? "true" : undefined}
                                  className={`group relative flex w-full items-center rounded-lg py-[7px] pr-3 text-left text-[13px] leading-snug transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset ${
                                    isActive
                                      ? "bg-cyan-500/[0.06] font-medium text-cyan-300"
                                      : child.level === 3
                                      ? "pl-[30px] text-slate-400 hover:bg-white/[0.03] hover:text-slate-300"
                                      : "pl-[42px] text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`absolute left-[18px] top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-r-full transition-all duration-200 ${
                                      isActive
                                        ? "bg-cyan-400/70 opacity-100 scale-y-100"
                                        : "bg-cyan-400/30 opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-75"
                                    }`}
                                  />
                                  {child.text}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            )}
          </aside>
        </div>

        {/* Back to Top */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 hover:shadow-cyan-400/30 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <FiChevronUp size={18} />
          </button>
        )}
      </article>

      {blog && <BlogComments slug={blog.slug} />}
    </>
  );
}