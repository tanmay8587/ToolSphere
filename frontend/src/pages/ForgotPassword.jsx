import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../services/userApi";
import { FiMail, FiArrowLeft } from "react-icons/fi";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await forgotPassword({ email });
      if (data.success) {
        setSuccess(data.message);
        setEmailSent(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <FiArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white text-center">
          Forgot Password?
        </h1>
        <p className="text-center text-slate-400 mt-2 mb-8">
          Enter your email and we'll send you a reset link
        </p>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pl-10 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
            <p className="text-slate-300 mb-4">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Please check your email and click the link to reset your password. The link will expire in 1 hour.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}