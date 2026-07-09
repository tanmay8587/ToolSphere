import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiBell,
  FiX,
  FiCheckCircle,
  FiMail,
  FiAlertTriangle,
  FiStar,
  FiUserPlus,
  FiInfo,
  FiTrash2,
  FiRefreshCw,
  FiTool,
  FiMessageSquare,
  FiSpeaker,
  FiFileText,
} from "react-icons/fi";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notificationService";

/* ==========================================
   NOTIFICATION TYPE CONFIG
   Extend this mapping for new notification types
========================================== */

const notificationConfig = {
  tool_updated: {
    icon: FiTool,
    color: "bg-blue-500/10 text-blue-400",
  },
  new_ai_tool: {
    icon: FiStar,
    color: "bg-green-500/10 text-green-400",
  },
  saved_tool_updated: {
    icon: FiRefreshCw,
    color: "bg-indigo-500/10 text-indigo-400",
  },
  review_approved: {
    icon: FiCheckCircle,
    color: "bg-emerald-500/10 text-emerald-400",
  },
  contact_reply: {
    icon: FiMessageSquare,
    color: "bg-cyan-500/10 text-cyan-400",
  },
  system_announcement: {
    icon: FiSpeaker,
    color: "bg-purple-500/10 text-purple-400",
  },
  newsletter_update: {
    icon: FiFileText,
    color: "bg-amber-500/10 text-amber-400",
  },
  admin_message: {
    icon: FiMail,
    color: "bg-rose-500/10 text-rose-400",
  },
  message: {
    icon: FiMail,
    color: "bg-blue-500/10 text-blue-400",
  },
  report: {
    icon: FiAlertTriangle,
    color: "bg-red-500/10 text-red-400",
  },
  review: {
    icon: FiStar,
    color: "bg-yellow-500/10 text-yellow-400",
  },
  subscriber: {
    icon: FiUserPlus,
    color: "bg-green-500/10 text-green-400",
  },
  alert: {
    icon: FiInfo,
    color: "bg-purple-500/10 text-purple-400",
  },
  default: {
    icon: FiCheckCircle,
    color: "bg-slate-500/10 text-slate-400",
  },
};

/* ==========================================
   POLLING INTERVAL
========================================== */

const POLL_INTERVAL = 30000; // 30 seconds

/* ==========================================
   NOTIFICATION DROPDOWN COMPONENT
========================================== */

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const pollingRef = useRef(null);

  /* ==========================================
     FETCH NOTIFICATIONS
  ========================================== */

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications({ page: pageNum, limit: 20 });
      const data = res.data;
      if (data.success) {
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================
     FETCH UNREAD COUNT
  ========================================== */

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      const data = res.data;
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      // Silently fail - count is non-critical
    }
  }, []);

  /* ==========================================
     LOAD MORE (LAZY LOADING)
  ========================================== */

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  /* ==========================================
     POLLING FOR UNREAD COUNT
  ========================================== */

  useEffect(() => {
    fetchUnreadCount();
    pollingRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchUnreadCount]);

  /* ==========================================
     FETCH WHEN DROPDOWN OPENS
  ========================================== */

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, false);
    }
  }, [isOpen, fetchNotifications]);

  /* ==========================================
     CLOSE HANDLERS
  ========================================== */

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /* ==========================================
     CLICK OUTSIDE & ESC HANDLER
  ========================================== */

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
      if (e.key === "Escape") {
        close();
      }
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

  /* ==========================================
     MARK SINGLE AS READ
  ========================================== */

  const handleMarkAsRead = useCallback(
    async (id) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markAsRead(id);
      } catch (err) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: false, read: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    []
  );

  /* ==========================================
     MARK ALL AS READ
  ========================================== */

  const handleMarkAllAsRead = useCallback(async () => {
    const currentCount = unreadCount;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, read: true }))
    );
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch (err) {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: false, read: false }))
      );
      setUnreadCount(currentCount);
    }
  }, [unreadCount]);

  /* ==========================================
     DELETE NOTIFICATION
  ========================================== */

  const handleDelete = useCallback(
    async (e, id, wasUnread) => {
      e.stopPropagation();

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await deleteNotification(id);
      } catch (err) {
        // Revert on failure - refetch
        fetchNotifications(page, false);
      }
    },
    [page, fetchNotifications]
  );

  /* ==========================================
     HELPERS
  ========================================== */

  const getConfig = (type) => {
    return notificationConfig[type] || notificationConfig.default;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
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

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={toggle}
        className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-badge-in items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white transition-all">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={close}
            aria-hidden="true"
          />

          <div
            ref={dropdownRef}
            role="menu"
            className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] sm:w-96 origin-top-right animate-dropdown-in rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-base font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-cyan-400 transition hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={close}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close notifications"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              className="max-h-[400px] overflow-y-auto"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop - clientHeight < 50) {
                  loadMore();
                }
              }}
            >
              {/* Loading State */}
              {loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800">
                    <FiRefreshCw className="h-7 w-7 animate-spin text-slate-500" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-white">
                    Loading notifications...
                  </h4>
                  <p className="max-w-[220px] text-xs text-slate-400">
                    Please wait while we fetch your notifications.
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                    <FiAlertTriangle className="h-7 w-7 text-red-400" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-white">
                    Failed to load
                  </h4>
                  <p className="mb-4 max-w-[220px] text-xs text-slate-400">
                    {error}
                  </p>
                  <button
                    onClick={() => fetchNotifications(1, false)}
                    className="rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/30"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800">
                    <FiBell className="h-7 w-7 text-slate-500" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-white">
                    No notifications yet
                  </h4>
                  <p className="max-w-[220px] text-xs text-slate-400">
                    When you receive notifications, they will appear here.
                  </p>
                </div>
              )}

              {/* Notification List */}
              {notifications.length > 0 && (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification, index) => {
                    const config = getConfig(notification.type);
                    const Icon = config.icon;
                    const colorClass = config.color;
                    const isUnread =
                      notification.isRead === false || notification.read === false;

                    return (
                      <div
                        key={notification._id}
                        className={`group relative transition-all ${
                          isUnread ? "bg-cyan-500/5" : ""
                        }`}
                        style={{
                          animationDelay: `${index * 30}ms`,
                        }}
                      >
                        <button
                          onClick={() => {
                            if (isUnread) {
                              handleMarkAsRead(notification._id);
                            }
                          }}
                          className={`flex w-full gap-3 px-5 py-4 pr-12 text-left transition hover:bg-white/5 ${
                            isUnread
                              ? "font-semibold text-white"
                              : "text-slate-300"
                          }`}
                          role="menuitem"
                        >
                          <div
                            className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm ${
                                isUnread
                                  ? "font-semibold text-white"
                                  : "text-slate-300"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {notification.message}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-slate-500">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) =>
                            handleDelete(e, notification._id, isUnread)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Delete notification"
                          title="Delete notification"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Loading more indicator */}
                  {loading && notifications.length > 0 && (
                    <div className="flex items-center justify-center px-5 py-4">
                      <FiRefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                      <span className="ml-2 text-xs text-slate-500">
                        Loading more...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && !loading && (
              <div className="border-t border-white/10 px-5 py-3 text-center">
                <button
                  onClick={() => {
                    // Navigate to notifications page (future feature)
                  }}
                  className="text-xs text-slate-400 transition hover:text-white"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}