import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn, isAdminLoggedIn } from "../utils/auth";

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

  if (role === "admin") {
    if (!isAdminLoggedIn()) {
      // Admin not authenticated -> send to admin login (no need to preserve route)
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  // Default: user role
  if (!isLoggedIn()) {
    // User not authenticated -> send to /login and remember where they
    // were trying to go so we can return them after a successful login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}