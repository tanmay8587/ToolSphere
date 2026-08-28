import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "apiSecret",
  "authorization",
  "cookie",
  "set-cookie",
  "emailVerificationToken",
  "resetToken",
]);

const maskString = (value) => {
  if (typeof value !== "string") return value;
  if (value.length <= 6) return "[REDACTED]";
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
};

const sanitizeValue = (value, depth = 0) => {
  if (value == null) return value;

  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  }

  if (typeof value !== "object") return value;

  if (depth > 3) return "[Depth limit reached]";

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => {
      if (SENSITIVE_KEYS.has(key) || /password|token|secret|cookie|authorization/i.test(key)) {
        return [key, "[REDACTED]"];
      }
      return [key, sanitizeValue(val, depth + 1)];
    })
  );
};

export const redactLogData = (data) => sanitizeValue(data);

export const redactReason = (reason) => {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: isProduction ? undefined : reason.stack,
    };
  }

  return redactLogData(reason);
};

export const sanitizeRequestForLog = (req) => ({
  method: req.method,
  path: req.originalUrl || req.url,
  ip: req.ip,
  userAgent: req.get?.("user-agent"),
  requestId: req.id,
  user: req.user
    ? {
        id: req.user.id || req.user._id,
        role: req.user.role,
      }
    : undefined,
  params: redactLogData(req.params),
  query: redactLogData(req.query),
  body: redactLogData(req.body),
});

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "ai-tools-directory" },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;