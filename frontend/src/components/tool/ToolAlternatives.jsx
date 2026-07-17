import { memo } from 'react';
import { Link } from 'react-router-dom';
import { getToolLogoProps } from '../../utils/imageOptimization';

const AlternativeCard = memo(({ tool }) => {
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
            className="h-10 w-10 rounded-xl object-cover"
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

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tool.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-xs text-slate-500"
          >
            {tag}
          </span>
        ))}
        {(tool.tags?.length || 0) > 3 && (
          <span className="text-xs text-slate-600">+{tool.tags.length - 3} more</span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
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

export default function ToolAlternatives({ tools, loading, currentToolId }) {
  // Filter out the current tool if it somehow appears
  const filteredTools = tools.filter((t) => t._id !== currentToolId);

  if (!loading && filteredTools.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="mb-6 text-2xl font-bold text-white">Alternatives</h2>
      <p className="mb-6 text-sm text-slate-400">
        Similar tools based on category, tags, and pricing
      </p>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-800 rounded" />
              <div className="h-4 w-2/3 bg-slate-800 rounded" />
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-slate-800 rounded-full" />
                <div className="h-4 w-16 bg-slate-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.slice(0, 6).map((tool) => (
            <AlternativeCard key={tool._id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}