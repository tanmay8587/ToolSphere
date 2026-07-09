import { Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

export default function VerifyEmailSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <FiCheckCircle className="h-12 w-12 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
        <p className="text-slate-400 mb-8">
          Your email address has been successfully verified. You can now sign in to your account.
        </p>

        <Link
          to="/login"
          className="inline-block w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
        >
          Continue to Login
        </Link>
      </div>
    </div>
  );
}