import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

import { getTools } from "../services/toolsService";

const MAX_COMPARE = 3;
const STORAGE_KEY = "toolsphere:compare";

// Query-param key used to make a comparison shareable via the URL.
const COMPARE_URL_PARAM = "tools";

// Read the list of tool IDs encoded in the current URL (?tools=id1,id2,id3).
function readIdsFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(COMPARE_URL_PARAM);
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

// Encode the selected tool IDs into the URL (without a history entry) so the
// current comparison can be copied/shared.
function writeIdsToUrl(ids) {
  try {
    const url = new URL(window.location.href);
    if (ids.length > 0) {
      url.searchParams.set(COMPARE_URL_PARAM, ids.join(","));
    } else {
      url.searchParams.delete(COMPARE_URL_PARAM);
    }
    window.history.replaceState({}, "", url.toString());
  } catch {
    /* ignore URL write failures (e.g. unsupported environments) */
  }
}

const ComparisonContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function ComparisonProvider({ children }) {
  const [compareTools, setCompareTools] = useState(loadInitial);

  // Persist selection across navigations / reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareTools));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [compareTools]);

  // Load a comparison shared via the URL (?tools=id1,id2,id3) on first mount,
  // so a visitor opening a shared link sees the exact same tools.
  useEffect(() => {
    const ids = readIdsFromUrl();
    if (ids.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await getTools({ limit: 1000 });
        const allTools = data?.tools || [];
        const byId = new Map(allTools.map((t) => [t._id, t]));
        const selected = ids
          .map((id) => byId.get(id))
          .filter(Boolean)
          .slice(0, MAX_COMPARE);
        if (!cancelled && selected.length > 0) {
          setCompareTools(selected);
        }
      } catch {
        /* ignore — keep any existing selection from localStorage */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the URL in sync with the current selection so it stays shareable.
  // Skip the initial mount so the URL-load effect above owns the first sync.
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }
    writeIdsToUrl(compareTools.map((t) => t._id));
  }, [compareTools]);

  const isComparing = useCallback(
    (toolId) => compareTools.some((t) => t._id === toolId),
    [compareTools]
  );

  // Returns one of: "added" | "removed" | "max"
  const toggleCompare = useCallback(
    (tool) => {
      if (!tool || !tool._id) return "max";

      const exists = compareTools.some((t) => t._id === tool._id);
      if (exists) {
        setCompareTools((prev) => prev.filter((t) => t._id !== tool._id));
        return "removed";
      }
      if (compareTools.length >= MAX_COMPARE) {
        return "max";
      }
      setCompareTools((prev) => [...prev, tool]);
      return "added";
    },
    [compareTools]
  );

  const addToCompare = useCallback(
    (tool) => {
      if (!tool || !tool._id) return false;
      if (compareTools.some((t) => t._id === tool._id)) return true;
      if (compareTools.length >= MAX_COMPARE) return false;
      setCompareTools((prev) => [...prev, tool]);
      return true;
    },
    [compareTools]
  );

  const removeFromCompare = useCallback((toolId) => {
    setCompareTools((prev) => prev.filter((t) => t._id !== toolId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareTools([]);
  }, []);

  const value = {
    compareTools,
    isComparing,
    toggleCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    maxCompare: MAX_COMPARE,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return ctx;
}

export { MAX_COMPARE };