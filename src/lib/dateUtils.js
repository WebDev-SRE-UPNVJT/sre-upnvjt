/**
 * Standardized Date & Timezone Utilities for SRE UPNVJT (Asia/Jakarta • UTC+7 / WIB)
 */

/**
 * Parses any date string or Date object, ensuring that strings without timezone offsets
 * are treated as Asia/Jakarta (WIB = UTC+7).
 *
 * @param {string|Date|number} input - The input date or date string
 * @returns {Date|null}
 */
export function parseJakartaDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  let str = String(input).trim();
  if (!str) return null;

  // If string is already in standard ISO or has timezone offset (Z, +, -XX:XX)
  const hasTimezone = str.includes("Z") || str.includes("+") || /-\d{2}:\d{2}$/.test(str);
  if (!hasTimezone) {
    // If format is YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
      str += ":00+07:00";
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
      str += "+07:00";
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      str += "T00:00:00+07:00";
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converts a Date or ISO string into a local Jakarta formatted string "YYYY-MM-DDTHH:mm:00+07:00"
 * or "YYYY-MM-DDTHH:mm" for input components and API payloads.
 *
 * @param {string|Date|number} dateInput
 * @param {boolean} [withOffset=true] - Whether to include :00+07:00 offset
 * @returns {string}
 */
export function formatJakartaISO(dateInput, withOffset = true) {
  if (!dateInput) return "";
  const d = parseJakartaDate(dateInput);
  if (!d) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  const minute = getPart("minute");

  if (!year || !month || !day || !hour || !minute) return "";

  return withOffset
    ? `${year}-${month}-${day}T${hour}:${minute}:00+07:00`
    : `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Formats a Date/string into a human-readable string in Asia/Jakarta timezone.
 *
 * @param {string|Date|number} dateInput
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @param {string} [locale="id-ID"] - Locale code
 * @returns {string}
 */
export function formatJakartaDisplay(
  dateInput,
  options = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false },
  locale = "id-ID"
) {
  if (!dateInput) return "-";
  const d = parseJakartaDate(dateInput);
  if (!d) return "-";

  return d.toLocaleDateString(locale, {
    timeZone: "Asia/Jakarta",
    ...options,
  });
}
