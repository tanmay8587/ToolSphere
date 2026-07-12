import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword, verifyResetToken } from "../services/userApi";
import PasswordInput from "../components/common/PasswordInput";
import { FiLock, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Token verification states
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Verify the reset token with the backend on page load
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!token) {
        if (!cancelled) {
          setVerifying(false);
          setTokenValid(false);
          setTokenError("Invalid reset link. No token was provided.");
        }
        return;
      }

      try {
        const { data } = await verifyResetToken(token);
        if (cancelled) return;

        if (data.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(data.message || "This reset link is invalid.");
        }
      } catch (err) {
        if (cancelled) return;
        setTokenValid(false);
        setTokenError(
          err.response?.data?.message ||
            "This password reset link is invalid or has expired."
        );
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const validate = () => {
    const errors = {};

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/\d/.test(formData.password)) {
      errors.password = "Password must contain at least one number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear validation error when user types
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await resetPassword(token, { password: formData.password });
      if (data.success) {
        setSuccess(data.message);
        // Auto redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          <div className="text-center">
            <FiLoader className="mx-auto text-cyan-400 mb-4 animate-spin" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying link…</h1>
            <p className="text-slate-400">Please wait while we validate your reset link.</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          <div className="text-center">
            <FiAlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h1 className="text-3xl font-bold text-white mb-4">Invalid Link</h1>
            <p className="text-slate-400 mb-6">
              {tokenError ||
                "This password reset link is invalid or has expired."}
            </p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Request New Link
            </button>
            <button
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <div className="mb-8">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            ← Back to Login
          </button>
        </div>

        <h1 className="text-3xl font-bold text-white text-center">
          Reset Password
        </h1>
        <p className="text-center text-slate-400 mt-2 mb-8">
          Enter your new password below
        </p>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200 flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" size={16} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 flex items-start gap-2">
            <FiCheckCircle className="mt-0.5 flex-shrink-0" size={16} />
            <div>
              {success}
              <p className="mt-1 text-xs">Redirecting to login...</p>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                placeholder="Enter new password"
                className="rounded-2xl border border-slate-700 bg-slate-950"
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirm New Password
              </label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={validationErrors.confirmPassword}
                placeholder="Confirm new password"
                className="rounded-2xl border border-slate-700 bg-slate-950"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resetting...
                </>
              ) : (
                <>
                  <FiLock size={16} />
                  Reset Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}