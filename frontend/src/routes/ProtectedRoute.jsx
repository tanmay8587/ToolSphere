import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdminLoggedIn } from "../utils/auth";

export default function ProtectedRoute({ children, redirectTo = "/admin/login" }) {
  const isProtectedAdmin = redirectTo === "/admin/login";
  const authorized = isProtectedAdmin ? isAdminLoggedIn() : isLoggedIn();

  if (!authorized) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
