import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiGrid,
  FiPlusCircle,
  FiSettings,
  FiUser,
  FiLock,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiMail,
  FiSend,
} from "react-icons/fi";
import { useState, useEffect } from "react";

import { clearAdminToken } from "../../utils/auth";
import { getUnreadContactCount } from "../../services/contactService";

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check for mobile and collapsed state from localStorage
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setCollapsed(!isMobile && savedCollapsed);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Save collapsed state
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed, isMobile]);

  // Fetch unread contact count for badge
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadContactCount();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // Silently fail - badge just won't show
      }
    };

    fetchUnreadCount();
  }, []);

  const handleLogout = () => {
    clearAdminToken();
    navigate("/admin/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: <FiHome size={20} />,
      path: "/admin/dashboard",
    },
    {
      name: "Tools",
      icon: <FiGrid size={20} />,
      path: "/admin/tools",
    },
    {
      name: "Add Tool",
      icon: <FiPlusCircle size={20} />,
      path: "/admin/tools/add",
    },
    {
      name: "Users",
      icon: <FiUsers size={20} />,
      path: "/admin/users",
    },
    {
      name: "Contact Messages",
      icon: <FiMail size={20} />,
      path: "/admin/contact-messages",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      name: "Newsletter Subscribers",
      icon: <FiSend size={20} />,
      path: "/admin/newsletter-subscribers",
    },
    {
      name: "Settings",
      icon: <FiSettings size={20} />,
      path: "/admin/settings",
    },
    {
      name: "My Profile",
      icon: <FiUser size={20} />,
      path: "/admin/profile",
    },
    {
      name: "Change Password",
      icon: <FiLock size={20} />,
      path: "/admin/change-password",
    },
  ];

  const sidebarWidth = collapsed ? "w-20" : "w-72";

  return (
    <aside 
      className={`
        ${sidebarWidth}
        flex-shrink-0 h-screen flex-col border-r border-white/10 bg-slate-950 transition-all duration-300
      `}
    >
      {/* LOGO / HEADER */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className={`${collapsed ? "hidden" : "block"}`}>
            <h1 className="text-2xl font-bold text-cyan-400">
              ToolSphere
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Admin Dashboard
            </p>
          </div>
          
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center px-3" : ""}`
            }
          >
            <span className="flex-shrink-0 transition-colors text-slate-400 group-hover:text-cyan-300">
              {item.icon}
            </span>
            
            {!collapsed && <span>{item.name}</span>}
            
            {/* Badge for unread count */}
            {!collapsed && item.badge && (
              <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <span className="absolute left-full ml-2 hidden rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap">
                {item.name}
                {item.badge && ` (${item.badge > 99 ? "99+" : item.badge})`}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER / LOGOUT */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className={`
            flex w-full items-center justify-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white
            ${collapsed ? "px-3" : ""}
          `}
        >
          <FiLogOut size={20} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}