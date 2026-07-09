import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, registerUser, googleAuth, resendVerificationEmail } from "../services/userApi";
import { saveToken, saveUser } from "../utils/auth";
import PasswordInput from "../components/common/PasswordInput";
import { FiMail, FiRefreshCw } from "react-icons/fi";

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Allow navbar "Register" button (and /register route) to open the register form
  const [mode, setMode] = useState(
    location.state?.mode === "register" || location.pathname === "/register"
      ? "register"
      : "login"
  );
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ type: "", message: "" });
  const [resending, setResending] = useState(false);
  const googleButtonRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear validation error when user types
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleLoginResponse = (data) => {
    // DEBUG LOGGING - Frontend Login
    console.log("=== FRONTEND LOGIN DEBUG ===");
    console.log("Login response data:", data);
    console.log("data.success:", data.success);
    console.log("data.user?.isVerified:", data.user?.isVerified);

    if (data.success) {
      // Only save token and navigate if user is verified
      if (data.user?.isVerified === true) {
        saveToken(data.token);
        saveUser(data.user);
        // Return to the page the user was trying to reach (if any),
        // otherwise go to the home page.
        const destination = location.state?.from?.pathname || "/";
        navigate(destination, { replace: true });
      } else {
        // User is verified in DB but isVerified is not true in response
        // This can happen if the backend returns an unexpected response
        console.log("isVerified is not true, setting error");
        setError("Email verification issue. Please try again or contact support.");
      }
    } else {
      setError(data.message || "Login failed.");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (mode === "register") {
      if (!form.name.trim()) errors.name = "Name is required";
      if (!form.password) errors.password = "Password is required";
      else if (form.password.length < 6) errors.password = "Password must be at least 6 characters";
      if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
      else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    }

    if (!form.email) errors.email = "Email is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const payload = { email: form.email, password: form.password };
      
      if (mode === "register") {
        const response = await registerUser({ ...payload, name: form.name });
        
        if (response.data.success) {
          navigate("/register-success", { state: { email: form.email } });
        }
      } else {
        const response = await loginUser(payload);
        handleLoginResponse(response.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setNeedsVerification(true);
        setVerificationEmail(form.email);
      }
      setError(err.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setResending(true);
    setResendStatus({ type: "", message: "" });

    try {
      const response = await resendVerificationEmail(verificationEmail);
      if (response.data.success) {
        setResendStatus({
          type: "success",
          message: "Verification email sent! Check your inbox.",
        });
      } else {
        setResendStatus({
          type: "error",
          message: response.data.message || "Failed to send verification email.",
        });
      }
    } catch (err) {
      setResendStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to send verification email. Please try again.",
      });
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const profile = parseJwt(credentialResponse.credential);
    if (!profile) {
      setError("Google login failed.");
      return;
    }

    try {
      setLoading(true);
      const response = await googleAuth({
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        googleId: profile.sub,
      });
      handleLoginResponse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center">
          {mode === "register" ? "Create Account" : "Sign In"}
        </h1>
        <p className="text-center text-slate-400 mt-2 mb-8">
          Access the AI tools directory with secure authentication.
        </p>

        {error && <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
          />

          <PasswordInput
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            error={validationErrors.password}
            required
            className="rounded-2xl border border-slate-700 bg-slate-950"
          />
          {validationErrors.password && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
          )}

          {mode === "register" && (
            <>
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={validationErrors.confirmPassword}
                required
                className="rounded-2xl border border-slate-700 bg-slate-950"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.confirmPassword}</p>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            )}
            {loading ? "Working..." : mode === "register" ? "Register" : "Login"}
          </button>
        </form>

        {needsVerification && (
          <div className="mt-4 rounded-2xl bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200 mb-3">
              Your email is not verified. Please check your inbox or request a new verification email.
            </p>
            {resendStatus.message && (
              <p className={`text-xs mb-2 ${resendStatus.type === "success" ? "text-emerald-200" : "text-red-200"}`}>
                {resendStatus.message}
              </p>
            )}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          </div>
        )}

        <div className="mt-4 text-center text-sm text-slate-400">
          {mode === "login" && (
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="font-semibold text-cyan-400 hover:text-cyan-300 underline"
            >
              Forgot Password?
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-slate-400">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-semibold text-white underline"
          >
            {mode === "login" ? "Create a new account" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6">
          <div ref={googleButtonRef} />
        </div>
      </div>
    </div>
  );
}