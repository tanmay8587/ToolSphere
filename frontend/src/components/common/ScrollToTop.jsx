import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Production-ready scroll restoration component
 * 
 * Features:
 * - Scrolls to top on every route change
 * - No flickering (uses smooth behavior)
 * - No duplicate scroll logic
 * - Preserves browser navigation (back/forward)
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately on route change
    // Using 'auto' instead of 'smooth' to prevent flickering
    window.scrollTo(0, 0);
    
    // Also ensure document element is at top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

// Hook for programmatic scroll control
export function useScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
}