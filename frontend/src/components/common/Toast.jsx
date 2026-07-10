import { useEffect, useState, useCallback } from "react"; // added useCallback to memoize toast handlers (root-cause fix for infinite fetch loop)
import { FiX, FiCheck, FiAlertCircle, FiInfo } from "react-icons/fi";

const toastTypes = {
  success: {
    icon: FiCheck,
    className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    iconClassName: "text-emerald-400",
  },
  error: {
    icon: FiAlertCircle,
    className: "bg-red-500/10 border-red-500/30 text-red-300",
    iconClassName: "text-red-400",
  },
  info: {
    icon: FiInfo,
    className: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    iconClassName: "text-cyan-400",
  },
};

export default function Toast({ message, type = "info", duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!duration) return;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = toastTypes[type] || toastTypes.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm
        transition-all duration-300 transform
        ${visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
        ${config.className}
      `}
    >
      <Icon className={`h-5 w-5 ${config.iconClassName}`} />
      <span className="whitespace-pre-line text-sm font-medium leading-snug">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-auto rounded-full p-1 hover:bg-white/10 transition"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast Hook
let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // Memoized with useCallback + empty deps so the function reference is
  // STABLE across renders. Previously addToast was recreated every render,
  // which made any useCallback depending on it (e.g. fetchSubscribers in
  // NewsletterSubscribers) also change every render and retrigger its
  // data-fetching useEffect in an infinite loop.
  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []); // empty deps: addToast uses no external/props/state values

  // Memoized for the same stability reason as addToast.
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []); // empty deps: removeToast uses no external values

  return { toasts, addToast, removeToast };
}
