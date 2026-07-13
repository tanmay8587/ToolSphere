import { FiFolder } from "react-icons/fi";

/**
 * CollectionSelector
 * Displays the user's collections and allows selecting a single one.
 *
 * @param {Array}  collections   - List of collections (each with _id, name, tools[]).
 * @param {boolean} loading       - Whether the collections are still loading.
 * @param {string}  selectedId    - The currently selected collection id (optional).
 * @param {function} onSelect     - Called with the selected collection object.
 * @param {string}  emptyMessage  - Message shown when there are no collections.
 */
export default function CollectionSelector({
  collections = [],
  loading = false,
  selectedId = null,
  onSelect,
  emptyMessage = "You don't have any collections yet.",
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {collections.map((collection) => {
        const isSelected = collection._id === selectedId;
        return (
          <button
            key={collection._id}
            type="button"
            onClick={() => onSelect?.(collection)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
              isSelected
                ? "border-cyan-400/60 bg-cyan-500/10 text-white"
                : "border-white/10 bg-slate-800/60 text-white hover:border-cyan-400/40 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <FiFolder className="shrink-0 text-slate-400" />
              <span className="truncate">{collection.name}</span>
            </span>
            <span className="shrink-0 text-xs text-slate-400">
              {collection.tools?.length || 0} tools
            </span>
          </button>
        );
      })}
    </div>
  );
}