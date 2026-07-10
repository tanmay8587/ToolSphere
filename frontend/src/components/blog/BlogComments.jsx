import { useEffect, useState, useCallback } from "react";
import { FiMessageSquare, FiSend, FiCornerDownRight, FiUser, FiLoader } from "react-icons/fi";
import { getBlogComments, postBlogComment } from "../../services/blogCommentService";
import { isLoggedIn, getUser, getToken } from "../../utils/auth";
import { formatToIndiaDate } from "../../utils/dateFormatter";
import EmptyState from "../common/EmptyState";

/* =====================================
   Avatar
   ===================================== */
const Avatar = ({ name, src }) => {
  const initials = (name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-white">
      {initials}
    </div>
  );
};

/* =====================================
   Single Comment
   ===================================== */
const CommentItem = ({ comment, blogSlug, onReplyPosted, depth = 0 }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await postBlogComment(blogSlug, {
        content: replyText.trim(),
        parentComment: comment._id,
      });
      setReplyText("");
      setReplying(false);
      onReplyPosted();
    } catch (err) {
      setError(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l border-slate-800 pl-4" : ""}>
      <div className="flex gap-3 py-4">
        <Avatar name={comment.authorName} src={comment.authorAvatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{comment.authorName}</span>
            {comment.isGuest && (
              <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Guest
              </span>
            )}
            <span className="text-xs text-slate-500">
              {formatToIndiaDate(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">
            {comment.content}
          </p>

          {isLoggedIn() && depth === 0 && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
            >
              <FiCornerDownRight size={13} />
              Reply
            </button>
          )}

          {replying && (
            <form onSubmit={handleReply} className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Write a reply..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  {submitting ? <FiLoader className="animate-spin" size={13} /> : <FiSend size={13} />}
                  Post Reply
                </button>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies (one level) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              blogSlug={blogSlug}
              onReplyPosted={onReplyPosted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =====================================
   Comment Form (top-level)
   ===================================== */
const CommentForm = ({ blogSlug, onPosted }) => {
  const loggedIn = isLoggedIn();
  const user = getUser();
  const token = getToken();

  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    const payload = { content: content.trim() };
    if (!loggedIn) {
      if (!guestName.trim()) {
        setError("Please enter your name");
        return;
      }
      if (!guestEmail.trim()) {
        setError("Please enter your email");
        return;
      }
      payload.guestName = guestName.trim();
      payload.guestEmail = guestEmail.trim();
    }

    setSubmitting(true);
    try {
      await postBlogComment(blogSlug, payload);
      setContent("");
      setGuestName("");
      setGuestEmail("");
      setSuccess("Your comment has been submitted and is awaiting moderation.");
      onPosted();
    } catch (err) {
      setError(err.message || "Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!loggedIn && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          />
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="Your email"
            maxLength={200}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          />
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder={loggedIn ? "Share your thoughts..." : "Share your thoughts (as a guest)..."}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {loggedIn
            ? `Posting as ${user?.name || "user"}`
            : "Posting as guest — your email is never shown."}
        </p>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {submitting ? <FiLoader className="animate-spin" size={15} /> : <FiSend size={15} />}
          Post Comment
        </button>
      </div>
    </form>
  );
};

/* =====================================
   Main Section
   ===================================== */
export default function BlogComments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBlogComments(slug);
      if (data.success) {
        setComments(data.comments || []);
      } else {
        setError("Failed to load comments");
      }
    } catch (err) {
      setError(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) loadComments();
  }, [slug, loadComments]);

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <section className="mt-12 border-t border-slate-800 pt-10">
      <div className="mb-6 flex items-center gap-2">
        <FiMessageSquare className="text-cyan-400" size={22} />
        <h2 className="text-2xl font-bold text-white">
          Comments {!loading && <span className="text-slate-400">({totalCount})</span>}
        </h2>
      </div>

      {/* Comment form */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <CommentForm blogSlug={slug} onPosted={loadComments} />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3 py-4">
              <div className="h-9 w-9 rounded-full bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-800" />
                <div className="h-3 w-3/4 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-red-200">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && comments.length === 0 && (
        <EmptyState
          type="search"
          title="No comments yet"
          description="Be the first to share your thoughts on this article."
        />
      )}

      {/* Comment list */}
      {!loading && !error && comments.length > 0 && (
        <div className="divide-y divide-slate-800">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              blogSlug={slug}
              onReplyPosted={loadComments}
            />
          ))}
        </div>
      )}
    </section>
  );
}