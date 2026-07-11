import { useState, useCallback } from "react";
import { FiShare2, FiLink } from "react-icons/fi";
import { SiX, SiFacebook, SiTelegram, SiWhatsapp } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { useToast, ToastContainer } from "../common/Toast";

/**
 * SocialShare
 * ------------
 * A single, professional "Share this article" section.
 *
 * Behaviour:
 *  - A primary "Share" button uses the native Web Share API when supported.
 *  - Explicit platform buttons (Copy Link, WhatsApp, Facebook, X, LinkedIn,
 *    Telegram) are always rendered and act as the automatic fallback when the
 *    Web Share API is unavailable (and as a convenience on desktop).
 *  - "Copy Link" writes the URL to the clipboard and shows a success toast.
 *
 * The component is self-contained: it owns its toast state and renders its own
 * ToastContainer so the success toast always appears regardless of where the
 * component is mounted.
 */
export default function SocialShare({ url, title, text }) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || "";
  const shareText = text || title || "";

  const { toasts, addToast, removeToast } = useToast();
  const [nativeSupported] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function"
  );

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  const platforms = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: SiWhatsapp,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      className: "hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: SiFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300",
    },
    {
      key: "x",
      label: "X",
      icon: SiX,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "hover:border-slate-300/40 hover:bg-white/10 hover:text-white",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: FaLinkedin,
      href: `https://www.linkedin.com/sharing/share-office?url=${encodedUrl}`,
      className: "hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300",
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: SiTelegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      className: "hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300",
    },
  ];

  const handleNativeShare = useCallback(async () => {
    if (!nativeSupported) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User aborted the native share sheet — no-op.
    }
  }, [nativeSupported, shareTitle, shareText, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      if (navigator.share) {
        // Prefer the native share sheet when available (mobile).
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      // Fall through to clipboard copy if the user dismisses the sheet.
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast("Link copied to clipboard!", "success");
    } catch {
      addToast("Unable to copy link. Please copy it manually.", "error");
    }
  }, [shareTitle, shareText, shareUrl, addToast]);

  const openPlatform = (href) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FiShare2 className="text-cyan-400" size={18} />
            <span className="text-sm font-semibold text-white">Share this article</span>
          </div>

          {/* Primary native share (only when supported) */}
          {nativeSupported && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600"
              aria-label="Share this article"
            >
              <FiShare2 size={16} />
              Share
            </button>
          )}
        </div>

        {/* Platform buttons — always available (fallback + desktop convenience) */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-cyan-300"
            aria-label="Copy link"
            title="Copy link"
          >
            <FiLink size={16} />
            <span>Copy Link</span>
          </button>

          {platforms.map(({ key, label, icon: Icon, href, className }) => (
            <button
              key={key}
              type="button"
              onClick={() => openPlatform(href)}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition ${className}`}
              aria-label={`Share on ${label}`}
              title={`Share on ${label}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Self-contained toast container so the success toast always renders */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}