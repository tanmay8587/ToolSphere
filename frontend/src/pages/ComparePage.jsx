import { useState } from "react";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight, FiColumns, FiStar } from "react-icons/fi";
import { useComparison } from "../context/ComparisonContext";
import { getToolLogoProps } from "../utils/imageOptimization";
import EmptyState from "../components/common/EmptyState";

// Rows to compare. Each row pulls a value from a tool object.
// `present(t)` reports whether a given tool has a meaningful value for the
// field, so we can show only fields that are common to ALL selected tools.
const ROWS = [
  {
    label: "Category",
    get: (t) => t.category || "—",
    present: (t) => !!t.category,
  },
  {
    label: "Pricing",
    get: (t) => t.pricing || "—",
    present: (t) => !!t.pricing,
  },
  {
    label: "Rating",
    get: (t) => (t.rating ? `${t.rating} / 5` : "—"),
    present: (t) => !!t.rating,
  },
  {
    label: "Description",
    get: (t) => t.description || "—",
    present: (t) => !!t.description,
  },
  {
    label: "Features",
    get: (t) =>
      Array.isArray(t.features) && t.features.length ? t.features : null,
    isList: true,
    // Features are compared explicitly side-by-side even when not every tool
    // lists them, so missing values are shown gracefully instead of hiding
    // the whole row.
    always: true,
    present: (t) => Array.isArray(t.features) && t.features.length > 0,
  },
  {
    label: "Pros",
    get: (t) => (Array.isArray(t.pros) && t.pros.length ? t.pros : null),
    isList: true,
    present: (t) => Array.isArray(t.pros) && t.pros.length > 0,
  },
  {
    label: "Cons",
    get: (t) => (Array.isArray(t.cons) && t.cons.length ? t.cons : null),
    isList: true,
    present: (t) => Array.isArray(t.cons) && t.cons.length > 0,
  },
  {
    label: "Website",
    get: (t) => t.website || null,
    isLink: true,
    present: (t) => !!t.website,
  },
];

export default function ComparePage() {
  const { compareTools, removeFromCompare, clearCompare, maxCompare } = useComparison();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the URL is still in the address bar */
    }
  };

  if (compareTools.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">Compare Tools</h1>
        <div className="mt-10">
          <EmptyState
            type="tool"
            title="No tools selected"
            description="Browse the tools directory and use the “Compare” button on any tool to add it here. You can compare up to 3 tools at once."
          />
          <div className="mt-8 flex justify-center">
            <Link
              to="/tools"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Browse Tools
              <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show fields that every selected tool has (like-for-like comparison), plus
  // any rows explicitly marked `always` (e.g. Features) which are compared
  // side-by-side with graceful placeholders for missing values.
  const commonRows = ROWS.filter(
    (row) => row.always || compareTools.every((tool) => row.present(tool))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compare Tools</h1>
          <p className="mt-2 text-sm text-slate-400">
            Comparing {compareTools.length} of {maxCompare} selected tools.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className="self-start rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
        >
          {copied ? "Link copied!" : "Copy link"}
        </button>

        <button
          type="button"
          onClick={clearCompare}
          className="self-start rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
        >
          Clear all
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-slate-950 p-4 text-left align-bottom text-sm font-semibold text-slate-400">
                Feature
              </th>
              {compareTools.map((tool) => (
                <th
                  key={tool._id}
                  className="min-w-[220px] border-b border-white/10 bg-slate-950 p-4 text-left align-bottom"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        {...getToolLogoProps(
                          tool.logo || tool.coverImage,
                          tool.name
                        )}
                        onError={(e) => {
                          e.currentTarget.src = "/default-logo.png";
                        }}
                        className="h-10 w-10 rounded-xl object-cover border border-white/10 bg-white/5"
                      />
                      <div>
                        <Link
                          to={`/tools/${tool.slug}`}
                          className="block text-base font-semibold text-white transition hover:text-cyan-300"
                        >
                          {tool.name}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(tool._id)}
                      aria-label={`Remove ${tool.name} from comparison`}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commonRows.length === 0 ? (
              <tr>
                <td
                  colSpan={compareTools.length + 1}
                  className="border-b border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400"
                >
                  No common fields available to compare for the selected tools.
                </td>
              </tr>
            ) : (
              commonRows.map((row) => (
                <tr key={row.label}>
                  <td className="sticky left-0 z-10 border-b border-white/10 bg-slate-950 p-4 text-sm font-medium text-slate-300">
                    {row.label}
                  </td>
                  {compareTools.map((tool) => {
                    const value = row.get(tool);
                    return (
                      <td
                        key={tool._id}
                        className="border-b border-white/10 bg-slate-900/40 p-4 align-top text-sm text-slate-300"
                      >
                        {row.isList ? (
                          value ? (
                            <ul className="space-y-1">
                              {value.map((item, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-cyan-400">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                        ) : (
                          <span className="text-slate-500">Not specified</span>
                        )
                      ) : row.isLink ? (
                          value ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                            >
                              Visit
                              <FiArrowRight size={13} />
                            </a>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )
                        ) : row.label === "Rating" && tool.rating ? (
                          <span className="flex items-center gap-1">
                            <FiStar className="text-amber-400" size={14} />
                            {value}
                          </span>
                        ) : (
                          <span className="whitespace-pre-line">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/tools"
          className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <FiColumns size={16} />
          Add more tools
        </Link>
      </div>
    </div>
  );
}