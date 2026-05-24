export const TOAST_TYPES = {
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  INFO: "info",
};

const TYPE_ALIASES = {
  error: TOAST_TYPES.DANGER,
  danger: TOAST_TYPES.DANGER,
  fail: TOAST_TYPES.DANGER,
  failed: TOAST_TYPES.DANGER,
  success: TOAST_TYPES.SUCCESS,
  warning: TOAST_TYPES.WARNING,
  warn: TOAST_TYPES.WARNING,
  info: TOAST_TYPES.INFO,
};

export const MESSAGES = {
  noChanges: "Không có thay đổi để cập nhật",
  networkError: "Không thể kết nối máy chủ",
  loadFailed: "Không tải được dữ liệu",
  saveFailed: "Lưu dữ liệu thất bại",
  deleteFailed: "Xóa dữ liệu thất bại",
};

export function normalizeToastType(type = TOAST_TYPES.SUCCESS) {
  return TYPE_ALIASES[String(type || "").trim().toLowerCase()] || TOAST_TYPES.INFO;
}

export function apiMessage(json, fallback = MESSAGES.saveFailed) {
  return json?.message || fallback;
}

export function isNoChangeMessage(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes("khong co thay doi");
}

export function resultToastType(message, fallback = TOAST_TYPES.SUCCESS) {
  return isNoChangeMessage(message) ? TOAST_TYPES.WARNING : normalizeToastType(fallback);
}
