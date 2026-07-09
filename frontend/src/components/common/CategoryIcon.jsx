/**
 * CategoryIcon - Reusable component for displaying category icons.
 *
 * Features:
 * - Shows custom uploaded icon if available
 * - Falls back to a default emoji based on category name
 * - Handles image load errors gracefully
 * - Consistent across all pages
 */

const DEFAULT_ICONS = {
  "ai chat": "💬",
  "ai image": "🎨",
  "ai video": "🎬",
  "ai audio": "🎧",
  "ai code": "💻",
  "ai writing": "✍️",
  "ai productivity": "⚡",
  "ai business": "🏢",
  writing: "✍️",
  coding: "💻",
  image: "🎨",
  video: "🎬",
  audio: "🎧",
  marketing: "📈",
  productivity: "⚡",
  education: "📚",
  business: "🏢",
  design: "🖌️",
  research: "🔬",
  finance: "💰",
};

function getDefaultIcon(categoryName) {
  if (!categoryName) return "🧠";
  const key = categoryName.toLowerCase().trim();
  return DEFAULT_ICONS[key] || "🧠";
}

export default function CategoryIcon({
  category,
  icon,
  className = "",
  size = "md",
  fallback = "🧠",
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-lg",
    md: "h-10 w-10 text-xl",
    lg: "h-12 w-12 text-2xl",
    xl: "h-14 w-14 text-3xl",
  };

  const resolvedSize = sizeClasses[size] || sizeClasses.md;
  const defaultIcon = getDefaultIcon(category) || fallback;

  // If a custom icon URL exists, render it with fallback
  if (icon && icon.startsWith("http")) {
    return (
      <div className={`${resolvedSize} relative ${className}`}>
        <img
          src={icon}
          alt={`${category || "category"} icon`}
          className={`${resolvedSize} rounded-xl object-cover border border-slate-700 bg-slate-800 absolute inset-0`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
        />
        <div
          className={`${resolvedSize} flex items-center justify-center rounded-xl bg-slate-800`}
          style={{ display: "none" }}
        >
          <span className="leading-none">{defaultIcon}</span>
        </div>
      </div>
    );
  }

  // Otherwise render the default emoji icon
  return (
    <div
      className={`${resolvedSize} flex items-center justify-center rounded-xl bg-slate-800 ${className}`}
    >
      <span className="leading-none">{defaultIcon}</span>
    </div>
  );
}