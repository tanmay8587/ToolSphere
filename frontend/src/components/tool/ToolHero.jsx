import {
  FiArrowRight,
  FiBookmark,
  FiShare2,
  FiStar,
} from "react-icons/fi";

export default function ToolHero({
  tool,
  isBookmarked,
  bookmarkLoading,
  onBookmark,
  onShare,
}) {
  if (!tool) return null;

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/96x96?text=No+Image";
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl">

      {tool.coverImage && (
        <img
          src={tool.coverImage}
          alt={tool.name}
          className="h-64 w-full object-cover"
          onError={handleImageError}
        />
      )}

      <div className="p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-5">

             <img
               src={tool.logo || tool.coverImage || "https://placehold.co/96x96?text=No+Image"}
               alt={tool.name}
               className="h-24 w-24 rounded-3xl border border-white/10 bg-white object-cover p-2"
               onError={handleImageError}
             />

            <div>

              <h1 className="text-4xl font-bold text-white">
                {tool.name}
              </h1>

              <p className="mt-2 text-slate-400">
                {tool.category}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">

                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-amber-400">
                  <FiStar />
                  {tool.rating || 0}
                </span>

                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-cyan-300">
                  {tool.pricing}
                </span>

                {tool.featured && (
                  <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-300">
                    Featured
                  </span>
                )}

              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={onBookmark}
              disabled={bookmarkLoading}
              className="rounded-2xl border border-white/10 bg-slate-800 px-5 py-3 text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <FiBookmark className="mr-2 inline" />
              {isBookmarked ? "Saved" : "Save"}
            </button>

            <button
              onClick={onShare}
              className="rounded-2xl border border-white/10 bg-slate-800 px-5 py-3 text-white transition hover:bg-slate-700"
            >
              <FiShare2 className="mr-2 inline" />
              Share
            </button>

            {tool.website && (
              <a
                href={tool.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:scale-105"
              >
                Visit Website
                <FiArrowRight className="ml-2 inline" />
              </a>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}