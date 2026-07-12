import { Link } from "react-router-dom";
import { FiArrowLeft, FiHome, FiRefreshCw, FiAlertTriangle, FiHelpCircle } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function ServerErrorPage() {
  const [countdown, setCountdown] = useState(15);
  const [retrying, setRetrying] = useState(false);
  
  useEffect(() => {
    document.title = "500 - Server Error | ToolSphere";
    
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    // Simulate retry attempt
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 text-center">
      
      {/* Error Code Badge */}
      <div className="animate-pulse rounded-full border border-rose-500/20 bg-rose-500/10 px-6 py-2 text-rose-300">
        Error 500
      </div>

      {/* Main Icon */}
      <div className="mt-8 flex h-32 w-32 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/5">
        <FiAlertTriangle className="text-6xl text-rose-400" />
      </div>

      {/* Title */}
      <h1 className="mt-8 text-5xl font-extrabold text-white sm:text-6xl">
        Server Error
      </h1>

      {/* Description */}
      <p className="mt-6 max-w-2xl text-lg text-slate-400">
        Something went wrong on our end. We're experiencing technical difficulties and our team has been notified.
      </p>

      {/* Auto-redirect Notice */}
      <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
        Redirecting to home in <span className="font-semibold">{countdown}</span> seconds...
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        
        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying..." : "Try Again"}
        </button>

        {/* Go Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 hover:border-cyan-500/40"
        >
          <FiArrowLeft />
          Go Back
        </button>

        {/* Home Button */}
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 hover:border-cyan-500/40"
        >
          <FiHome />
          Home
        </Link>
      </div>

      {/* Help Link */}
      <div className="mt-12">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition"
        >
          <FiHelpCircle />
          Report this issue or contact support
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-16 text-sm text-slate-500">
        © 2026 ToolSphere. All rights reserved.
      </div>

    </div>
  );
}