import { Link } from "react-router-dom";
import { FiCalendar, FiClock, FiEye, FiStar } from "react-icons/fi";

const calculateReadingTime = (html = "") => {
  const text = html ? html.replace(/<[^>]*>/g, "") : "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* =====================================
   BLOG CARD (reusable)
   ===================================== */
export default function BlogCard({ blog }) {
  if (!blog) return null;

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {blog.coverImage && (
        <div className="h-40 overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          {blog.category ? (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              {blog.category}
            </span>
          ) : (
            <span />
          )}
          {blog.featured && (
            <span className="text-xs text-fuchsia-400 flex items-center gap-1">
              <FiStar size={10} />
              Featured
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
          {blog.title}
        </h2>
        <p className="text-sm text-slate-400 line-clamp-2">
          {blog.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <FiCalendar size={12} />
            {formatDate(blog.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={12} />
            {blog.readingTime || calculateReadingTime(blog.content)} min
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={12} />
            {blog.views || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}