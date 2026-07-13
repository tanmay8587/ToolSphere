import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  getAdminNotifications,
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
  // Generic category fallbacks (user / tool / review / contact)
  user: {
    icon: FiUserPlus,
    color: "bg-violet-500/10 text-violet-400",
  },
  tool: {
    icon: FiTool,
    color: "bg-blue-500/10 text-blue-400",
  },
  contact: {
    icon: FiMessageSquare,
    color: "bg-cyan-500/10 text-cyan-400",
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
   NOTIFICATION -> ADMIN PAGE MAPPING
   Maps a notification type to its related admin route.
   Unknown types resolve to null so we never navigate/crash.
========================================== */

const NOTIFICATION_ROUTES = {
  user: "/admin/users",
  tool: "/admin/tools",
  review: "/admin/reviews",
  contact: "/admin/contact-messages",
};

const getNotificationPath = (type) => NOTIFICATION_ROUTES[type] || null;

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
  const inFlightRef = useRef(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const navigate = useNavigate();

  /* ==========================================
     FETCH NOTIFICATIONS
  ========================================== */

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      // Use the admin-wide endpoint (latest 20 notifications across the platform)
      const data = await getAdminNotifications();
      if (data.success) {
        const list = data.notifications || [];
        setNotifications((prev) => (append ? [...prev, ...list] : list));
        setHasMore(false); // admin endpoint returns a fixed latest-20 window
        setPage(pageNum);
        // Derive unread count from the returned list (per-user count is 0 for these)
        setUnreadCount(list.filter((n) => n.isRead === false).length);
      }
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
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
      AUTO REFRESH (every POLL_INTERVAL)
      Refreshes the notification list AND the unread badge count from
      the existing API. Does not reload the page, keeps the dropdown
      open if it is, and guards against overlapping requests.
  ========================================== */

  useEffect(() => {
    // Initial fetch so the badge reflects existing notifications
    // (count of items where isRead === false).
    fetchNotifications(1, false);

    pollingRef.current = setInterval(() => {
      // Prevent duplicate/overlapping requests
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      fetchNotifications(1, false).finally(() => {
        inFlightRef.current = false;
      });
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

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
     NOTIFICATION CLICK -> NAVIGATE
     Marks unread as read (optimistic + API) and navigates
     to the related admin page, then closes the dropdown.
     No-op (no crash) if there is no valid destination.
  ========================================== */

  const handleNotificationClick = useCallback(
    (notification) => {
      const path = getNotificationPath(notification.type);
      if (!path) return; // No valid destination - do nothing

      if (notification.isRead === false || notification.read === false) {
        handleMarkAsRead(notification._id);
      }

      close();
      navigate(path);
    },
    [close, navigate, handleMarkAsRead]
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

  const handleDeleteClick = useCallback((e, id) => {
    e.stopPropagation();
    setConfirmingId(id);
  }, []);

  const handleCancelDelete = useCallback((e) => {
    e.stopPropagation();
    setConfirmingId(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (e, id, wasUnread) => {
      e.stopPropagation();
      setConfirmingId(null);

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

    // Midnight timestamps for day-level comparisons
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (
      diffHours < 24 &&
      startOfDate.getTime() === startOfToday.getTime()
    )
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (startOfDate.getTime() === startOfYesterday.getTime())
      return "Yesterday";
    if (diffMs < 7 * 86400000) {
      const diffDays = Math.floor(diffMs / 86400000);
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
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
        className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
                    className="text-xs text-cyan-400 transition hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={close}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
                    className="rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
                <div className="space-y-2 p-3">
                  {notifications.map((notification, index) => {
                    const config = getConfig(notification.type);
                    const Icon = config.icon;
                    const colorClass = config.color;
                    const isUnread =
                      notification.isRead === false ||
                      notification.read === false;

                    return (
                      <div
                        key={notification._id}
                        className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                          isUnread
                            ? "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/[0.15]"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06]"
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Unread left accent bar */}
                        {isUnread && (
                          <span className="absolute inset-y-0 left-0 w-1 bg-cyan-400" />
                        )}

                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="flex w-full gap-3 px-4 py-3 pl-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
                          role="menuitem"
                        >
                          {/* Type icon */}
                          <div
                            className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                          >
                            <Icon size={16} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`truncate text-sm ${
                                  isUnread
                                    ? "font-semibold text-white"
                                    : "font-medium text-slate-200"
                                }`}
                              >
                                {notification.title}
                              </p>
                              {isUnread && (
                                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                                {notification.message}
                              </p>
                            )}
                            <p className="mt-1.5 text-[11px] text-slate-500">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </button>

                        {/* Delete / Confirm */}
                        {confirmingId === notification._id ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 p-1 shadow-lg shadow-black/40"
                          >
                            <span className="px-1 text-[11px] text-slate-300">
                              Delete?
                            </span>
                            <button
                              onClick={(e) =>
                                handleConfirmDelete(
                                  e,
                                  notification._id,
                                  isUnread
                                )
                              }
                              className="rounded-md bg-red-500/90 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                              aria-label="Confirm delete"
                            >
                              Yes
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                              aria-label="Cancel delete"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) =>
                              handleDeleteClick(e, notification._id)
                            }
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            aria-label="Delete notification"
                            title="Delete notification"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
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
                  className="text-xs text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
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