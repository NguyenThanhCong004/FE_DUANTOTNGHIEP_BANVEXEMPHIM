const VI_LOCALE = "vi-VN";
const EMPTY_TEXT = "—";

function toValidDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = value;
    const date = new Date(y, m - 1, d, hh, mm, ss);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const text = String(value);
  const date = new Date(text.length === 10 ? `${text}T12:00:00` : text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumber(value, fallback = EMPTY_TEXT) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString(VI_LOCALE);
}

export function formatVnd(value, { compact = false, fallback = EMPTY_TEXT, space = "" } = {}) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return fallback;
  if (compact) {
    return new Intl.NumberFormat(VI_LOCALE, { style: "currency", currency: "VND" }).format(number);
  }
  return `${number.toLocaleString(VI_LOCALE)}${space}đ`;
}

export function formatPercent(value, fallback = EMPTY_TEXT) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toLocaleString(VI_LOCALE)}%`;
}

export function formatDate(value, options = {}) {
  const date = toValidDate(value);
  if (!date) return options.fallback ?? EMPTY_TEXT;
  const { fallback, ...dateOptions } = options;
  if (Object.keys(dateOptions).length === 0) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getFullYear()}`;
  }
  return date.toLocaleDateString(VI_LOCALE, dateOptions);
}

export function formatDateTime(value, options = {}) {
  const date = toValidDate(value);
  if (!date) return options.fallback ?? EMPTY_TEXT;
  const { fallback, ...dateOptions } = options;
  if (Object.keys(dateOptions).length === 0) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${date.getFullYear()} ${hh}:${min}:${ss}`;
  }
  return date.toLocaleString(VI_LOCALE, dateOptions);
}

export function formatTime(value, options = {}) {
  const date = toValidDate(value);
  if (!date) return options.fallback ?? EMPTY_TEXT;
  const { fallback, ...timeOptions } = options;
  return date.toLocaleTimeString(VI_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    ...timeOptions,
  });
}

export function toDateInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const date = toValidDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayInputValue() {
  return toDateInputValue(new Date());
}
