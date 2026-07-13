import { createContext, useContext, useState, useCallback, useEffect } from "react";

const MAX_COMPARE = 3;
const STORAGE_KEY = "toolsphere:compare";

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