import { useState, useEffect, useRef, useCallback } from "react";
import { FiBell, FiX, FiCheck, FiCheckCheck, FiTrash2 } from "react-icons/fi";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "../../services/notificationService";

/**
 * NotificationDropdown
 * Dropdown shown in the navbar for authenticated users.
 * Displays notifications with title, message, timestamp, and unread indicator.
 */
export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const [notifResult, countResult] = await Promise.all([
          getNotifications({ page: 1, limit: 20 }),
          getUnreadCount(),
        ]);

        if (!cancelled) {
          if (notifResult.success) {
            setNotifications(notifResult.notifications || []);
          }
          if (countResult.success) {
            setUnreadCount(countResult.count || 0);
          }
        }
      } catch (err) {
        // Silently fail - notifications are optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        close();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") close();
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      // Refresh unread count from server
      const countResult = await getUnreadCount();
      if (countResult.success) {
        setUnreadCount(countResult.count || 0);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Refresh unread count from server
      const countResult = await getUnreadCount();
      if (countResult.success) {
        setUnreadCount(countResult.count || 0);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Silently fail
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={toggle}
        className="relative flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-3 text-cyan-300 transition hover:bg-cyan-500/20"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={close}
            aria-hidden="true"
          />

          <div
            ref={dropdownRef}
            role="menu"
            className="absolute right-0 top-full z-50 mt-3 w-80 origin-top-right rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="rounded-lg p-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/10"
                    aria-label="Mark all as read"
                    title="Mark all as read"
                  >
                    <FiCheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={close}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close notifications"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-slate-800/60" />
                      <div className="mt-2 h-3 w-full rounded bg-slate-800/60" />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <FiBell className="mx-auto h-8 w-8 text-slate-600" />
                  <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`group relative border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${
                        !notification.isRead ? "bg-cyan-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h4
                            className={`text-sm font-medium ${
                              !notification.isRead ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {notification.title}
                          </h4>

                          {/* Message */}
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Timestamp */}
                          <p className="mt-1.5 text-xs text-slate-500">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification._id)}
                              className="rounded p-1.5 text-cyan-300 transition hover:bg-cyan-500/10"
                              aria-label="Mark as read"
                              title="Mark as read"
                            >
                              <FiCheck size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification._id)}
                            className="rounded p-1.5 text-red-400 transition hover:bg-red-500/10"
                            aria-label="Delete notification"
                            title="Delete"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}