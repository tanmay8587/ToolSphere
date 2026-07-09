import { Link } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { useEffect } from "react";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "404 - Page Not Found | AI Tools Directory";
  }, []);

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 text-center">

      <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-6 py-2 text-cyan-300">
        Error 404
      </div>

      <h1 className="mt-8 text-6xl font-extrabold text-white sm:text-7xl">
        Page Not Found
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-slate-400">
        The page you are looking for doesn't exist, may have been moved,
        or the URL is incorrect.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:scale-105"
        >
          <FiArrowLeft />
          Back to Home
        </Link>

        <Link
          to="/tools"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          <FiSearch />
          Browse AI Tools
        </Link>

      </div>

      <div className="mt-16 text-slate-500">
        AI Tools Directory © 2026
      </div>

    </div>
  );
}