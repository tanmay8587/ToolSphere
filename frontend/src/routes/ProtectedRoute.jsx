import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn, isAdminLoggedIn, logout } from "../utils/auth";
import { getProfile } from "../services/userApi";

/**
 * Reusable route guard.
 *
 * Props:
 *  - children: the protected element(s) to render when authorized
 *  - role:     "user"  (default) -> requires a verified user session,
 *                          redirects unauthenticated users to /login
 *                        while preserving the intended destination.
 *             "admin"        -> requires an admin session,
 *                          redirects to /admin/login.
 *
 * Uses the existing auth utilities in ../utils/auth (no new auth system).
 */
export default function ProtectedRoute({ children, role = "user" }) {
  const location = useLocation();

  // For admin routes, keep the existing logic (no backend check)
  if (role === "admin") {
    if (!isAdminLoggedIn()) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  // For user routes, verify the session is still valid on the backend.
  // This catches cases where an admin deleted the user's account.
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        await getProfile();
        if (!cancelled) setValid(true);
      } catch {
        // Profile fetch failed (401/User account not found) — clear session
        if (!cancelled) {
          logout();
          setValid(false);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };

    if (isLoggedIn()) {
      verify();
    } else {
      setVerifying(false);
      setValid(false);
    }

    return () => { cancelled = true; };
  }, []);

  if (verifying) {
    // Show nothing while verifying (prevents flash of content)
    return null;
  }

  if (!valid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
