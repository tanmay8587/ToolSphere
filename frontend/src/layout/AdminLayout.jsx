import { useState } from "react";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { ToastContainer, useToast } from "../components/common/Toast";

export default function AdminLayout({ children }) {
  const { toasts, removeToast } = useToast();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* Sidebar */}
      <Sidebar />

      {/* Right Side */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <Topbar />

        {/* Content - Only this area should scroll */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
}