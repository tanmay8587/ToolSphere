const isProduction = import.meta.env.PROD;

const SENSITIVE_KEYS = /password|token|secret|cookie|authorization|email/i;

const maskValue = (value) => {
  if (typeof value !== "string") return value;
  if (value.length <= 6) return "[REDACTED]";
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
};

const sanitize = (value, depth = 0) => {
  if (value == null) return value;
  if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  if (typeof value !== "object") return value;
  if (depth > 2) return "[Depth limit reached]";

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => sanitize(entry, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (SENSITIVE_KEYS.test(key)) {
        return [key, "[REDACTED]"];
      }
      return [key, sanitize(entryValue, depth + 1)];
    })
  );
};

const logToConsole = (level, message, details) => {
  if (!isProduction) return;
  const payload = details ? sanitize(details) : undefined;
  const fn = console[level] || console.log;
  fn.call(console, `[monitoring] ${message}`, payload || "");
};

export const reportFrontendError = (error, extra = {}) => {
  logToConsole("error", "frontend error", {
    message: error?.message,
    name: error?.name,
    stack: error?.stack,
    ...sanitize(extra),
  });
};

export const setupGlobalFrontendMonitoring = () => {
  if (!isProduction || typeof window === "undefined") return () => {};

  const onError = (event) => {
    reportFrontendError(event.error || new Error(event.message || "Window error"), {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  };

  const onUnhandledRejection = (event) => {
    reportFrontendError(event.reason instanceof Error ? event.reason : new Error("Unhandled promise rejection"), {
      reason: sanitize(event.reason),
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
};
