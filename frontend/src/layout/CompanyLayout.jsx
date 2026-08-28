import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  FiGrid,
  FiTool,
  FiBarChart2,
  FiUsers,
  FiX,
  FiMenu,
  FiArrowLeft,
} from "react-icons/fi";

const navItems = [
  { name: "Overview", path: "/company", end: true, icon: FiGrid },
  { name: "My Tools", path: "/company/tools", end: false, icon: FiTool },
  { name: "Analytics", path: "/company/analytics", end: false, icon: FiBarChart2 },
  { name: "Team", path: "/company/team", end: false, icon: FiUsers },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
    isActive
      ? "bg-cyan-500/15 text-cyan-300"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

export default function CompanyLayout() {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-slate-950/40">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">Company Dashboard</p>
          <p className="text-xs text-slate-500">Manage your claimed tools</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 lg:hidden"
          aria-label="Close menu"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-sm font-semibold text-white">Company Dashboard</p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20">{sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 overflow-y-auto md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}

      {/* Content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
