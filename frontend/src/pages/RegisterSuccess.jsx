import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resendVerificationEmail } from "../services/userApi";
import { FiCheckCircle, FiMail, FiRefreshCw } from "react-icons/fi";

export default function RegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resendStatus, setResendStatus] = useState({ type: "", message: "" });
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem("registeredEmail") || "";

  useEffect(() => {
    // Store email in localStorage as backup
    if (location.state?.email) {
      localStorage.setItem("registeredEmail", location.state.email);
    }

    // Start countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, location.state?.email]);

  const handleResendVerification = async () => {
    if (!email || resending) return;

    setResending(true);
    setResendStatus({ type: "", message: "" });

    try {
      const response = await resendVerificationEmail(email);
      if (response.data.success) {
        setResendStatus({
          type: "success",
          message: "Verification email sent! Check your inbox.",
        });
        // Reset countdown
        setCountdown(60);
        setCanResend(false);
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

  const handleGoToLogin = () => {
    // Clean up localStorage
    localStorage.removeItem("registeredEmail");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <FiCheckCircle className="h-12 w-12 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Account created successfully!</h1>
        
        <div className="mb-6 flex items-center justify-center gap-2 text-slate-400">
          <FiMail className="h-5 w-5" />
          <span className="text-sm">
            We've sent a verification email to <strong className="text-cyan-400">{email}</strong>
          </span>
        </div>

        <p className="text-slate-400 mb-8">
          Please verify your email before logging in.
        </p>

        {resendStatus.message && (
          <p className={`mb-4 text-sm ${resendStatus.type === "success" ? "text-emerald-200" : "text-red-200"}`}>
            {resendStatus.message}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            Go to Login
          </button>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={!canResend || resending}
            className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white"></div>
                Sending...
              </>
            ) : canResend ? (
              <>
                <FiRefreshCw className="h-4 w-4" />
                Resend Verification Email
              </>
            ) : (
              `Resend available in ${countdown}s`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}