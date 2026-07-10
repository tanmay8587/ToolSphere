import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FiLoader, FiCheckCircle, FiAlertCircle, FiMail } from "react-icons/fi";
import { verifyContact } from "../services/contactService";

export default function VerifyContact() {
  const { token } = useParams();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate verification calls (React.StrictMode runs useEffect twice in dev)
    if (verifiedRef.current) return;

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification link is invalid or expired.");
        return;
      }

      // Set ref BEFORE the API call to prevent duplicate requests from StrictMode
      verifiedRef.current = true;

      try {
        const response = await verifyContact(token);

        if (response.success) {
          setStatus("success");
          setMessage(
            response.message ||
              "Your email has been verified successfully. We will get back to you soon."
          );
        } else {
          setStatus("error");
          setMessage(response.message || "Verification link is invalid or expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            err.message ||
            "Verification link is invalid or expired."
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-10 shadow-2xl text-center">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-500/10">
              <FiLoader className="h-12 w-12 animate-spin text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Verifying your email...</h1>
            <p className="text-slate-400">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <FiCheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Email Verified!
            </h1>
            <p className="text-slate-400 mb-8">
              Your email has been verified successfully. We will get back to you soon.
            </p>
            <Link
              to="/"
              className="inline-block w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Back to Home
            </Link>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <FiAlertCircle className="h-12 w-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Verification Failed
            </h1>
            <p className="text-slate-400 mb-8">
              Verification link is invalid or expired.
            </p>

            <div className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <FiMail className="h-4 w-4" />
              <span>
                If you did not submit a contact request, you can safely ignore this email.
              </span>
            </div>

            <Link
              to="/contact"
              className="inline-block w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
            >
              Back to Contact
            </Link>
          </>
        )}
      </div>
    </div>
  );
}