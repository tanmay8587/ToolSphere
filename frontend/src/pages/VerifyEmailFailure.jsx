import { useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiMail } from "react-icons/fi";
import { resendVerificationEmail } from "../services/userApi";

export default function VerifyEmailFailure() {
  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ type: "", message: "" });
  const [resending, setResending] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setResendStatus({ type: "error", message: "Please enter your email address." });
      return;
    }

    setResending(true);
    setResendStatus({ type: "", message: "" });

    try {
      const response = await resendVerificationEmail(email);
      if (response.data.success) {
        setResendStatus({
          type: "success",
          message: "A new verification email has been sent. Please check your inbox.",
        });
        setEmail("");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <FiAlertCircle className="h-12 w-12 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Verification Failed</h1>
        <p className="text-slate-400 mb-8">
          The verification link is invalid or has expired. Please request a new verification email below.
        </p>

        {resendStatus.message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm ${
              resendStatus.type === "success"
                ? "bg-emerald-500/10 text-emerald-200"
                : "bg-red-500/10 text-red-200"
            }`}
          >
            {resendStatus.message}
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={resending}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}