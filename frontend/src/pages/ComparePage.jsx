import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight, FiColumns, FiStar, FiDownload, FiPrinter, FiCheck, FiXCircle } from "react-icons/fi";
import { useComparison } from "../context/ComparisonContext";
import { getToolLogoProps } from "../utils/imageOptimization";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

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
  const [exportFormat, setExportFormat] = useState("json");
  const { addToast } = useToast();

  // Show fields that every selected tool has (like-for-like comparison), plus
  // any rows explicitly marked `always` (e.g. Features) which are compared
  // side-by-side with graceful placeholders for missing values.
  const displayTools = compareTools.slice(0, maxCompare);

  const commonRows = ROWS.filter(
    (row) => row.always || displayTools.every((tool) => row.present(tool))
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("Comparison link copied to clipboard", "success");
    } catch {
      /* clipboard may be unavailable; the URL is still in the address bar */
    }
  };

  // Compare values across tools to identify differences and similarities
  const compareValues = useMemo(() => {
    if (displayTools.length < 2) return null;

    const comparisons = {};
    
    commonRows.forEach((row) => {
      const values = displayTools.map((tool) => {
        const val = row.get(tool);
        if (row.isList && Array.isArray(val)) {
          return JSON.stringify(val.sort());
        }
        if (row.isLink && val) {
          return val;
        }
        return val || "—";
      });

      const allSame = values.every((v) => v === values[0]);
      const allMissing = values.every((v) => v === "—" || v === null || v === undefined);
      
      comparisons[row.label] = {
        values,
        allSame,
        allMissing,
        hasDifference: !allSame && !allMissing,
        hasSimilarity: allSame && !allMissing,
      };
    });

    return comparisons;
  }, [displayTools, commonRows]);

  const handleExport = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        tools: displayTools.map((tool) => ({
          name: tool.name,
          slug: tool.slug,
          category: tool.category,
          pricing: tool.pricing,
          rating: tool.rating,
          description: tool.description,
          features: tool.features || [],
          pros: tool.pros || [],
          cons: tool.cons || [],
          website: tool.website,
        })),
        comparison: compareValues,
      };

      let content, filename, mimeType;

      if (exportFormat === "json") {
        content = JSON.stringify(exportData, null, 2);
        filename = `tool-comparison-${Date.now()}.json`;
        mimeType = "application/json";
      } else {
        // CSV export
        const headers = ["Feature", ...displayTools.map((t) => t.name)];
        const rows = commonRows.map((row) => {
          const vals = displayTools.map((tool) => {
            const val = row.get(tool);
            if (row.isList && Array.isArray(val)) {
              return val.join("; ");
            }
            return val || "—";
          });
          return [row.label, ...vals];
        });
        
        const csvContent = [
          headers.join(","),
          ...rows.map((row) => 
            row.map((cell) => 
              `"${String(cell).replace(/"/g, '""')}"`
            ).join(",")
          ),
        ].join("\n");
        
        content = csvContent;
        filename = `tool-comparison-${Date.now()}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Comparison exported as ${exportFormat.toUpperCase()}`, "success");
    } catch (error) {
      addToast("Failed to export comparison", "error");
      console.error("Export error:", error);
    }
  };

  const handlePrint = () => {
    // Add timestamp for print footer
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    document.body.setAttribute("data-timestamp", timestamp);
    
    // Add print-specific class to body
    document.body.classList.add("printing-comparison");
    window.print();
    
    // Clean up after print dialog closes
    setTimeout(() => {
      document.body.classList.remove("printing-comparison");
      document.body.removeAttribute("data-timestamp");
    }, 100);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compare Tools</h1>
          <p className="mt-2 text-sm text-slate-400">
            Comparing {compareTools.length} of {maxCompare} selected tools.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="self-start rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {copied ? "Link copied!" : "Copy link"}
          </button>

          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 focus:border-cyan-400 focus:outline-none"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="self-start inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <FiDownload size={16} />
              Export
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="self-start inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-500/20"
          >
            <FiPrinter size={16} />
            Print
          </button>

          <button
            type="button"
            onClick={clearCompare}
            className="self-start rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-28 bg-slate-950 p-3 text-left align-bottom text-sm font-semibold text-slate-400 sm:w-40 sm:p-4">
                Feature
              </th>
              {displayTools.map((tool) => (
                <th
                  key={tool._id}
                  className="min-w-[160px] border-b border-white/10 bg-slate-950 p-3 text-left align-bottom sm:min-w-[220px] sm:p-4"
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
                        className="h-9 w-9 rounded-xl object-cover border border-white/10 bg-white/5 sm:h-10 sm:w-10"
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
                   colSpan={displayTools.length + 1}
                  className="border-b border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400"
                >
                  No common fields available to compare for the selected tools.
                </td>
              </tr>
            ) : (
              commonRows.map((row) => {
                const comparison = compareValues?.[row.label];
                return (
                  <tr key={row.label}>
                    <td className="sticky left-0 z-10 w-28 border-b border-white/10 bg-slate-950 p-3 text-sm font-medium text-slate-300 sm:w-40 sm:p-4">
                      {row.label}
                    </td>
                    {displayTools.map((tool, idx) => {
                      const value = row.get(tool);
                      
                      // Determine cell styling based on comparison
                      let cellClassName = "border-b border-white/10 bg-slate-900/40 p-4 align-top text-sm transition ";
                      if (comparison) {
                        if (comparison.allSame && !comparison.allMissing) {
                          cellClassName += "bg-emerald-500/10 text-emerald-200 ";
                        } else if (comparison.hasDifference) {
                          cellClassName += "bg-amber-500/10 text-amber-200 ";
                        } else if (comparison.allMissing) {
                          cellClassName += "text-slate-500 ";
                        }
                      }

                      return (
                        <td
                          key={tool._id}
                          className={cellClassName}
                        >
                          {comparison && comparison.hasDifference && displayTools.length > 1 && (
                            <div className="mb-1 flex items-center gap-1 text-xs text-amber-400">
                              <FiXCircle size={12} />
                              <span>Different</span>
                            </div>
                          )}
                          {comparison && comparison.allSame && !comparison.allMissing && displayTools.length > 1 && (
                            <div className="mb-1 flex items-center gap-1 text-xs text-emerald-400">
                              <FiCheck size={12} />
                              <span>Same</span>
                            </div>
                          )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {displayTools.length < maxCompare ? (
        <div className="mt-8 flex justify-center">
          <Link
            to="/tools"
            className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <FiColumns size={16} />
            Add more tools
          </Link>
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-slate-500">
          You've reached the maximum of {maxCompare} tools. Remove one to
          compare another.
        </p>
      )}

      {/* Legend */}
      {compareValues && displayTools.length > 1 && (
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Comparison Legend</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-emerald-500/20 border border-emerald-400/40"></div>
              <span className="text-slate-400">Similar - Same value across all tools</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-500/20 border border-amber-400/40"></div>
              <span className="text-slate-400">Different - Values vary across tools</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
