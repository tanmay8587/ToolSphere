import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMaintenanceStatus } from "../services/maintenanceService";
import { FiTool, FiClock, FiAlertCircle } from "react-icons/fi";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState({
    isEnabled: false,
    message: "We'll be back soon! The website is currently under maintenance.",
    estimatedTime: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const result = await getMaintenanceStatus();
        if (result.success) {
          setMaintenance({
            isEnabled: result.isEnabled,
            message: result.message,
            estimatedTime: result.estimatedTime,
          });
        }
      } catch (err) {
        console.error("Failed to fetch maintenance status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500 mx-auto"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 shadow-2xl shadow-cyan-500/20">
            <FiTool className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-lg text-slate-300 mb-8">
          {maintenance.message}
        </p>

        {/* Estimated Time */}
        {maintenance.estimatedTime && (
          <div className="mb-8 flex items-center justify-center gap-2 text-slate-400">
            <FiClock className="h-5 w-5" />
            <span>Estimated time: {maintenance.estimatedTime}</span>
          </div>
        )}

        {/* Admin Login Link */}
        <div className="mb-8">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600"
          >
            <FiAlertCircle className="h-5 w-5" />
            Admin Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-sm text-slate-500">
          Thank you for your patience. We're working hard to improve your experience.
        </p>
      </div>
    </div>
  );
}