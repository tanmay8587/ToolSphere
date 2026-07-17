
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLogOut, FiChevronDown, FiX, FiFolder, FiPlusCircle } from "react-icons/fi";

import { logout as clearUserSession } from "../../utils/auth";
import { getCollections } from "../../services/collectionsService";

/**
 * UserMenu
 * Dropdown shown in the public navbar for authenticated (verified) users.
 * Reuses the existing auth utilities (utils/auth) and does NOT create a new
 * authentication system.
 */
export default function UserMenu({ user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // User collections fetched from the API and stored in component state
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Load the user's collections from the API whenever the menu is opened
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadCollections = async () => {
      setCollectionsLoading(true);
      try {
        const data = await getCollections();
        if (!cancelled && data.success) {
          setCollections(data.data || []);
        }
      } catch (err) {
        // Collections are optional content; ignore failures silently
      } finally {
        if (!cancelled) setCollectionsLoading(false);
      }
    };

    loadCollections();
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

  const handleLogout = () => {
    clearUserSession();
    close();
    // Notify other components (e.g. across tabs) that the session changed
    window.dispatchEvent(new Event("auth-change"));
    navigate("/");
  };

  const displayName =
    user?.name || user?.email?.split("@")[0] || "Account";
  const initial = (displayName?.[0] || "U").toUpperCase();

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={toggle}
        className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-cyan-300 transition hover:bg-cyan-500/20"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-xs font-bold text-white">
          {initial}
        </div>

        <span className="hidden text-sm font-medium sm:block">
          {displayName}
        </span>

        <FiChevronDown
          size={14}
          className={`hidden text-cyan-300 transition-transform duration-200 sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
            className="absolute right-0 top-full z-50 mt-3 w-56 origin-top-right rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-white">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </h4>
                  {user?.email && (
                    <p className="truncate text-xs text-slate-400">
                      {user.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={close}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/profile"
                onClick={close}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                role="menuitem"
              >
                <FiUser size={16} className="text-slate-500" />
                <span>My Profile</span>
              </Link>


              <Link
                to="/collections"
                onClick={close}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                role="menuitem"
              >
                <FiFolder size={16} className="text-slate-500" />
                <span>My Collections</span>
                {!collectionsLoading && collections.length > 0 && (
                  <span className="ml-auto rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                    {collections.length}
                  </span>
                )}
              </Link>

              <Link
                to="/submit-tool"
                onClick={close}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                role="menuitem"
              >
                <FiPlusCircle size={16} className="text-slate-500" />
                <span>Submit a Tool</span>
              </Link>

              {/* User's collections list */}
              {collectionsLoading ? (
                <div className="px-4 py-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-800/60" />
                </div>
              ) : (
                collections.length > 0 && (
                  <div className="max-h-48 overflow-y-auto px-2 py-1">
                    {collections.map((collection) => (
                      <Link
                        key={collection._id}
                        to="/collections"
                        onClick={close}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                        role="menuitem"
                      >
                        <FiFolder size={14} className="shrink-0 text-slate-500" />
                        <span className="truncate">{collection.name}</span>
                        <span className="ml-auto text-xs text-slate-500">
                          {collection.tools?.length || 0}
                        </span>
                      </Link>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Logout */}
            <div className="py-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLogout();
                  }
                }}
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}