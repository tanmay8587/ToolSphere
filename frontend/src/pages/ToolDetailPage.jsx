import ToolDetailSkeleton from '../components/skeletons/ToolDetailSkeleton';
import ToolHero from "../components/tool/ToolHero";
import ToolGallery from "../components/tool/ToolGallery";
import ToolFeatures from "../components/tool/ToolFeatures";
import ReportToolModal from "../components/tool/ReportToolModal";

import { useEffect, useState, memo } from 'react';
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowRight, FiBookmark, FiShare2, FiStar, FiFlag, FiFolder, FiX, FiColumns } from 'react-icons/fi';
import { getToolBySlug, getRelatedTools } from '../services/toolsService';
import { bookmarkTool, getProfile, reviewTool } from '../services/userApi';
import { addViewedTool } from '../services/recentlyViewedService';
import { getCollections, addToolToCollection } from '../services/collectionsService';
import { isLoggedIn } from '../utils/auth';
import EmptyState from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import { useComparison } from '../context/ComparisonContext';
import CollectionSelector from '../components/collection/CollectionSelector';
import {
  getToolImage,
  generateToolOgTags,
  generateToolTwitterTags,
} from '../utils/socialMeta';
import {
  getToolLogoProps,
} from '../utils/imageOptimization';

const RECENTLY_VIEWED_KEY = 'recentlyViewedTools';
const MAX_RECENT_TOOLS = 8;
const DISPLAY_RECENT_TOOLS = 6;

// Memoized related tool card
const RelatedToolCard = memo(({ tool }) => {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            {...getToolLogoProps(
              tool.logo || tool.coverImage,
              tool.name
            )}
            onError={(e) => {
              e.currentTarget.src = "/default-logo.png";
            }}
          />
          <span className="text-xs text-slate-400">
            {tool.category}
          </span>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {tool.pricing}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-300 transition">
        {tool.name}
      </h3>

      <p className="mt-2 text-sm text-slate-400 line-clamp-2">
        {tool.description}
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          ⭐ {tool.rating || 4.5}
        </span>

        <span className="text-xs text-cyan-400 group-hover:underline">
          View Tool →
        </span>
      </div>
    </Link>
  );
});

// Memoized recently viewed tool card
const RecentlyViewedCard = memo(({ tool }) => {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            {...getToolLogoProps(
              tool.logo || tool.coverImage,
              tool.name
            )}
            onError={(e) => {
              e.currentTarget.src = "/default-logo.png";
            }}
          />
          <span className="text-xs text-slate-400">
            {tool.category}
          </span>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {tool.pricing}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-300 transition">
        {tool.name}
      </h3>

      <p className="mt-2 text-sm text-slate-400 line-clamp-2">
        {tool.description}
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-cyan-400 group-hover:underline">
          View Tool →
        </span>
      </div>
    </Link>
  );
});

// Modal that lets the user pick a collection to add the current tool to
function CollectionPickerModal({ isOpen, collections, loading, addLoading, toolName, onSelect, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Add to Collection</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {toolName && (
          <p className="mt-1 text-sm text-slate-400 truncate">Add “{toolName}” to one of your collections.</p>
        )}

        <div className="mt-5">
          <CollectionSelector
            collections={collections}
            loading={loading}
            onSelect={(collection) => onSelect(collection._id)}
            emptyMessage="You don't have any collections yet. Create one from the Collections page."
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ToolDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isComparing, toggleCompare, maxCompare } = useComparison();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [relatedTools, setRelatedTools] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Collections (for "Add to collection")
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [addToCollectionLoading, setAddToCollectionLoading] = useState(false);

  useEffect(() => {
    const loadTool = async () => {
      setLoading(true);
      try {
        const data = await getToolBySlug(slug);

        if (!data?.tool) {
          setTool(null);
          return;
        }

        setTool(data.tool);

      } catch (err) {
        setTool(null);
      } finally {
        setLoading(false);
      }
    };

    loadTool();
  }, [slug]);

  useEffect(() => {
    if (!tool) return;

    const addToRecentlyViewed = async () => {
      try {
        // If user is logged in, save to backend
        if (isLoggedIn()) {
          await addViewedTool(tool._id);
        }

        // Also save to localStorage for guest users and quick access
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        let history = stored ? JSON.parse(stored) : [];

        // Remove current tool if already in history
        history = history.filter((item) => item._id !== tool._id);

        // Add current tool to the beginning
        history.unshift({
          _id: tool._id,
          name: tool.name,
          slug: tool.slug,
          logo: tool.logo,
          coverImage: tool.coverImage,
          category: tool.category,
          pricing: tool.pricing,
          description: tool.description,
        });

        // Keep only the latest MAX_RECENT_TOOLS
        history = history.slice(0, MAX_RECENT_TOOLS);

        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(history));
        setRecentlyViewed(history);
      } catch (err) {
        console.error('Failed to update recently viewed tools:', err);
      }
    };

    addToRecentlyViewed();
  }, [tool]);

  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (stored) {
          const history = JSON.parse(stored);
          setRecentlyViewed(history);
        }
      } catch (err) {
        console.error('Failed to load recently viewed tools:', err);
      }
    };

    loadRecentlyViewed();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const loadRelatedTools = async () => {
      if (!slug) return;

      setRelatedLoading(true);
      try {
        const data = await getRelatedTools(slug);
        setRelatedTools(data.tools || []);
      } catch (err) {
        setRelatedTools([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    loadRelatedTools();
  }, [slug]);

  useEffect(() => {
    if (!tool?._id) return;

    let cancelled = false;

    const loadRecommendations = async () => {
      setRecommendationsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/tools/${tool._id}/recommendations`
        );
        const data = await response.json().catch(() => null);

        if (!cancelled && data?.success) {
          setRecommendations(data.tools || []);
        }
      } catch (err) {
        // Recommendations are optional; ignore failures here
      } finally {
        if (!cancelled) setRecommendationsLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [tool]);

  useEffect(() => {
    if (!tool || !isLoggedIn()) {
      return;
    }

    let cancelled = false;

    const loadUserToolState = async () => {
      try {
        const { data } = await getProfile();

        if (!cancelled && data.success) {
          const bookmarked = data.bookmarks?.some(
            (item) => item._id === tool._id || item?.tool === tool._id
          );
          setIsBookmarked(!!bookmarked);

          const review = data.reviews?.find(
            (item) => item.tool?._id === tool._id || item.tool === tool._id
          );

          if (review) {
            setUserReview(review);
            setReviewRating(review.rating || 5);
            setReviewComment(review.comment || '');
          }
        }
      } catch (err) {
        // ignore profile fetch errors here
      }
    };

    loadUserToolState();

    return () => {
      cancelled = true;
    };
  }, [tool]);

  // Load the user's collections so they can be added to from this page
  useEffect(() => {
    if (!tool || !isLoggedIn()) {
      setCollections([]);
      return;
    }

    let cancelled = false;
    const loadCollections = async () => {
      setCollectionsLoading(true);
      try {
        const data = await getCollections();
        if (!cancelled && data.success) {
          setCollections(data.data || []);
        }
      } catch (err) {
        // Collections are optional; ignore failures here
      } finally {
        if (!cancelled) setCollectionsLoading(false);
      }
    };

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, [tool]);

  const refreshCollections = async () => {
    try {
      const data = await getCollections();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch (err) {
      // ignore refresh failures
    }
  };

  const handleAddToCollection = async (collectionId) => {
    if (!tool || !ensureLoggedIn()) {
      return;
    }

    try {
      setAddToCollectionLoading(true);
      const { data } = await addToolToCollection(collectionId, tool._id);

      if (data.success) {
        addToast(`Added to "${data.data?.name || "collection"}"`, "success");
        // Refresh collection data to reflect the updated tool list
        await refreshCollections();
        setShowCollectionModal(false);
      } else {
        addToast(data.message || "Failed to add tool to collection.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to add tool to collection.", "error");
    } finally {
      setAddToCollectionLoading(false);
    }
  };

  const ensureLoggedIn = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleBookmark = async () => {
    if (!tool || !ensureLoggedIn()) {
      return;
    }

    try {
      setBookmarkLoading(true);
      setFeedback('');
      const { data } = await bookmarkTool(tool._id);

      if (data.success) {
        setIsBookmarked(data.bookmarked);
        if (data.bookmarked) {
          setSaveAnim(true);
          setTimeout(() => setSaveAnim(false), 220);
          addToast('Saved to your bookmarks', 'success');
        } else {
          addToast('Removed from bookmarks', 'success');
        }
      } else {
        setFeedback(data.message || 'Unable to update bookmark.');
      }
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Unable to update bookmark.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    if (!tool) return;

    const shareData = {
      title: tool.name,
      text: tool.description,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        addToast("Tool shared successfully!", "success");
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      addToast("Link copied to clipboard!", "success");

    } catch (err) {
      // Agar user ne share dialog cancel kiya to kuch mat dikhao
      if (err.name !== "AbortError") {
        console.error("Share Error:", err);
        addToast("Unable to share. Please try again.", "error");
      }
    }
  };

  const handleCompareToggle = () => {
    if (!tool) return;
    const result = toggleCompare(tool);
    if (result === "max") {
      addToast(`You can compare up to ${maxCompare} tools.`, "error");
    } else if (result === "added") {
      addToast(`Added "${tool.name}" to comparison.`, "success");
    } else if (result === "removed") {
      addToast(`Removed "${tool.name}" from comparison.`, "info");
    }
  };

  const comparing = tool ? isComparing(tool._id) : false;

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!tool || !ensureLoggedIn()) {
      return;
    }

    try {
      setReviewLoading(true);
      setFeedback('');
      const { data } = await reviewTool(tool._id, {
        rating: reviewRating,
        comment: reviewComment,
      });

      if (data.success) {
        setUserReview(data.review);

        if (data.reviews?.length) {
          const average =
            data.reviews.reduce((sum, item) => sum + item.rating, 0) /
            data.reviews.length;
          setTool((prev) => ({ ...prev, rating: Number(average.toFixed(1)) }));
        }

        setFeedback('Review submitted successfully.');
      } else {
        setFeedback(data.message || 'Unable to save review.');
      }
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Unable to save review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <ToolDetailSkeleton />;
  }

  if (!tool) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        Tool not found.
      </div>
    );
  }

  const toolUrl = window.location.href;
  
  // Generate social meta tags
  const ogTags = generateToolOgTags(tool);
  const twitterTags = generateToolTwitterTags(tool);
  const toolImage = getToolImage(tool);
  
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "description": tool.seoDescription || tool.description,
    "url": tool.website || toolUrl,
    "image": toolImage,
    "applicationCategory": tool.category || "AI Tool",
    "operatingSystem": "Web-based",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": tool.pricing || "Free"
    },
    "aggregateRating": tool.rating ? {
      "@type": "AggregateRating",
      "ratingValue": tool.rating,
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": tool.reviewCount || 1
    } : undefined,
    "publisher": {
      "@type": "Organization",
      "name": "ToolSphere"
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {tool.seoTitle || `${tool.name} | AI Tools Directory`}
        </title>

        <meta
          name="description"
          content={
            tool.seoDescription ||
            tool.description?.substring(0, 160)
          }
        />

        <meta
          name="keywords"
          content={
            Array.isArray(tool.seoKeywords)
              ? tool.seoKeywords.join(", ")
              : tool.seoKeywords || ""
          }
        />

        {tool.canonicalUrl && (
          <link
            rel="canonical"
            href={tool.canonicalUrl}
          />
        )}

        {/* Open Graph */}
        <meta
          property="og:title"
          content={ogTags.title}
        />

        <meta
          property="og:description"
          content={ogTags.description}
        />

        <meta
          property="og:image"
          content={ogTags.image}
        />

        <meta
          property="og:image:width"
          content={ogTags.imageWidth}
        />

        <meta
          property="og:image:height"
          content={ogTags.imageHeight}
        />

        <meta
          property="og:image:alt"
          content={ogTags.title}
        />

        <meta
          property="og:type"
          content={ogTags.type}
        />

        <meta
          property="og:url"
          content={ogTags.url}
        />

        <meta
          property="og:site_name"
          content={ogTags.siteName}
        />

        {/* Twitter Card */}
        <meta
          name="twitter:card"
          content={twitterTags.card}
        />

        <meta
          name="twitter:title"
          content={twitterTags.title}
        />

        <meta
          name="twitter:description"
          content={twitterTags.description}
        />

        <meta
          name="twitter:image"
          content={twitterTags.image}
        />

        <meta
          name="twitter:image:alt"
          content={twitterTags.imageAlt}
        />

        <meta
          name="twitter:site"
          content={twitterTags.site}
        />

        <script type="application/ld+json">
          {JSON.stringify(toolJsonLd)}
        </script>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Desktop Sticky Actions */}
        <div className="hidden lg:flex fixed right-6 top-1/3 z-50 flex-col gap-3" role="toolbar" aria-label="Tool actions">
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              isBookmarked
                ? "bg-white border border-white text-slate-900 hover:bg-slate-100"
                : "bg-slate-900/90 border border-white/10 text-white hover:bg-slate-800"
            } ${saveAnim ? "scale-110" : "scale-100"}`}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this tool"}
            aria-pressed={isBookmarked}
          >
            <FiBookmark fill={isBookmarked ? "currentColor" : "none"} />
            {isBookmarked ? "Saved" : "Save"}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Share this tool"
          >
            <FiShare2 />
            Share
          </button>

          <button
            onClick={() => setShowCollectionModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Add this tool to a collection"
          >
            <FiFolder />
            Save
          </button>

          <button
            onClick={handleCompareToggle}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              comparing
                ? "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-600"
                : "bg-slate-900/90 border-white/10 text-white hover:bg-slate-800"
            }`}
            aria-label={comparing ? `Remove ${tool.name} from comparison` : `Add ${tool.name} to comparison`}
            aria-pressed={comparing}
          >
            <FiColumns />
            {comparing ? "Comparing" : "Compare"}
          </button>

          {tool?.website && (
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 text-white font-semibold"
              aria-label={`Visit ${tool.name} website (opens in new tab)`}
            >
              <FiArrowRight />
              Visit
            </a>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Report this tool"
          >
            <FiFlag />
            Report
          </button>
        </div>

        {/* Mobile Bottom Bar */}
        {!loading && tool && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur flex justify-around py-3" role="toolbar" aria-label="Tool actions">

            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={`flex flex-col items-center rounded-2xl px-3 py-1 text-xs disabled:opacity-50 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                isBookmarked ? "bg-white text-slate-900" : "text-white"
              } ${saveAnim ? "scale-110" : "scale-100"}`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this tool"}
              aria-pressed={isBookmarked}
            >
              <FiBookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
              {isBookmarked ? "Saved" : "Save"}
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center text-white text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Share this tool"
            >
              <FiShare2 size={18} />
              Share
            </button>

            <button
              onClick={() => setShowCollectionModal(true)}
              className="flex flex-col items-center text-white text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Add this tool to a collection"
            >
              <FiFolder size={18} />
              Save
            </button>

            <button
              onClick={handleCompareToggle}
              className={`flex flex-col items-center text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                comparing ? "text-cyan-300" : "text-white"
              }`}
              aria-label={comparing ? `Remove ${tool.name} from comparison` : `Add ${tool.name} to comparison`}
              aria-pressed={comparing}
            >
              <FiColumns size={18} />
              Compare
            </button>

            {tool?.website && (
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-xs text-cyan-400"
                aria-label={`Visit ${tool.name} website (opens in new tab)`}
              >
                <FiArrowRight size={18} />
                Visit
              </a>
            )}

          </div>
        )}


      </div>

      {/* HERO SECTION */}
      <ToolHero
        tool={tool}
        isBookmarked={isBookmarked}
        bookmarkLoading={bookmarkLoading}
        bookmarkAnim={saveAnim}
        onBookmark={handleBookmark}
        onShare={handleShare}
      />

      <ToolGallery tool={tool} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">Overview</h2>
            <p className="text-lg leading-8 text-slate-300">
              {tool.description || 'No description available.'}
            </p>
          </div>

          <ToolFeatures tool={tool} />

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tool.tags?.length ? (
                tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">No tags available</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
            <p className="mt-4 text-sm text-slate-400">
              This listing is sourced from the database-backed AI tools catalog.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">Your Review</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add or update your rating and comments for this tool.
            </p>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-200">Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Write your thoughts..."
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {userReview ? 'Update Review' : 'Submit Review'}
              </button>
            </form>

            {feedback && <p className="mt-4 text-sm text-cyan-300">{feedback}</p>}

            {userReview && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Your last review</p>
                <div className="mt-2 flex items-center gap-2 text-amber-400">
                  <FiStar />
                  <span>{userReview.rating} / 5</span>
                </div>
                <p className="mt-3 text-slate-300">
                  {userReview.comment || 'No comment provided.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDED TOOLS */}
      {(recommendationsLoading || recommendations.length > 0) && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-white">Recommended Tools</h2>

          {recommendationsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-800" />
                    <div className="h-3 w-20 bg-slate-800 rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-800 rounded" />
                  <div className="h-4 w-2/3 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((recommendedTool) => (
                <RelatedToolCard
                  key={recommendedTool._id}
                  tool={recommendedTool}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* RELATED TOOLS */}
      <div className="mt-16">
        <h2 className="mb-6 text-2xl font-bold text-white">Related Tools</h2>

        {relatedLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-800" />
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-800 rounded" />
                <div className="h-4 w-2/3 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : relatedTools.length === 0 ? (
          <EmptyState
            type="tool"
            title="No related tools found"
            description="There are no other tools in this category yet. Check back later for more AI tools."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((relatedTool) => (
              <RelatedToolCard 
                key={relatedTool._id} 
                tool={relatedTool} 
              />
            ))}
          </div>
        )}
      </div>

      {/* RECENTLY VIEWED TOOLS */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-white">Recently Viewed Tools</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyViewed.slice(0, DISPLAY_RECENT_TOOLS).map((recentTool) => (
              <RecentlyViewedCard 
                key={recentTool._id} 
                tool={recentTool} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Report Tool Modal */}
      <ReportToolModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        tool={tool}
      />

      {/* Add to Collection Modal */}
      <CollectionPickerModal
        isOpen={showCollectionModal}
        collections={collections}
        loading={collectionsLoading}
        addLoading={addToCollectionLoading}
        toolName={tool?.name}
        onSelect={handleAddToCollection}
        onClose={() => setShowCollectionModal(false)}
      />
    </>
  );
}
