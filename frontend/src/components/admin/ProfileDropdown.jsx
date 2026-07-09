import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiSettings,
  FiLock,
  FiLogOut,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

import { clearAdminToken } from "../../utils/auth";

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close handler
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Toggle handler
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Click outside + ESC handler
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

  const handleLogout = () => {
    clearAdminToken();
    navigate("/admin/login");
  };

  const menuItems = [
    {
      label: "My Profile",
      icon: FiUser,
      action: () => {
        close();
        navigate("/admin/profile");
      },
    },
    {
      label: "Account Settings",
      icon: FiSettings,
      action: () => {
        close();
        navigate("/admin/settings");
      },
    },
    {
      label: "Change Password",
      icon: FiLock,
      action: () => {
        close();
        navigate("/admin/change-password");
      },
    },
  ];

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={toggle}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
        aria-label="Admin profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white">
          <FiUser size={16} />
        </div>

        <div className="hidden sm:block text-left">
          <h4 className="text-sm font-semibold text-white">Administrator</h4>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>

        <FiChevronDown
          size={14}
          className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
            className="absolute right-0 top-full z-50 mt-3 w-56 origin-top-right animate-dropdown-in rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white">
                  <FiUser size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">
                    Administrator
                  </h4>
                  <p className="text-xs text-slate-400">Super Admin</p>
                </div>
                <button
                  onClick={close}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close profile menu"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        item.action();
                      }
                    }}
                  >
                    <Icon size={16} className="text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Logout */}
            <div className="py-2">
              <button
                onClick={() => {
                  close();
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    close();
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