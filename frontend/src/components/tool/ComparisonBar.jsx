import { Link } from "react-router-dom";
import { FiX, FiColumns, FiArrowRight } from "react-icons/fi";
import { useComparison } from "../../context/ComparisonContext";
import { getToolLogoProps } from "../../utils/imageOptimization";

export default function ComparisonBar() {
  const { compareTools, removeFromCompare, clearCompare, maxCompare } = useComparison();

  if (compareTools.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-300">
            <FiColumns size={16} />
            Compare
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-200">
              {compareTools.length}/{maxCompare}
            </span>
          </span>

          <div className="flex items-center gap-2">
            {compareTools.map((tool) => (
              <div
                key={tool._id}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 py-1 pl-1 pr-2"
              >
                <img
                  {...getToolLogoProps(tool.logo || tool.coverImage, tool.name)}
                  onError={(e) => {
                    e.currentTarget.src = "/default-logo.png";
                  }}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="max-w-[120px] truncate text-xs text-slate-200">
                  {tool.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(tool._id)}
                  aria-label={`Remove ${tool.name} from comparison`}
                  className="rounded-full p-0.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5"
          >
            Clear
          </button>
          <Link
            to="/compare"
            className="flex items-center gap-1 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            Compare
            <FiArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}