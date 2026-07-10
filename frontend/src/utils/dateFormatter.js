/**
 * Reusable date formatting utilities for the ToolSphere frontend.
 *
 * All backend dates are stored and transmitted in UTC (ISO-8601 strings ending
 * in "Z"). These helpers consistently render them in India Standard Time
 * (Asia/Kolkata, UTC+5:30) so the UI, emails, and stored values stay aligned.
 */

const INDIA_TIME_ZONE = "Asia/Kolkata";

/**
 * Format a UTC date string into India Standard Time.
 *
 * @param {string|Date|number} dateInput - UTC date from the backend (ISO string,
 *   Date object, or timestamp). Invalid/missing input returns an empty string.
 * @returns {string} Formatted date, e.g. "11 Jul 2026, 01:18 AM"
 */
export function formatToIndiaTime(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a UTC date string into India Standard Time (date only).
 *
 * @param {string|Date|number} dateInput - UTC date from the backend.
 * @returns {string} Formatted date, e.g. "11 Jul 2026"
 */
export function formatToIndiaDate(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a UTC date string into India Standard Time (time only).
 *
 * @param {string|Date|number} dateInput - UTC date from the backend.
 * @returns {string} Formatted time, e.g. "01:18 AM"
 */
export function formatToIndiaTimeOnly(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default formatToIndiaTime;