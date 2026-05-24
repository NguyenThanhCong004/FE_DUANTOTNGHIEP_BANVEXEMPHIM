export const STATUS_CODES = {
  INACTIVE: 0,
  ACTIVE: 1,
  UPCOMING: 2,
};

export const ADMIN_STATUS_KEYS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  UPCOMING: "Upcoming",
};

export const STAFF_STATUS_KEYS = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Khóa",
};

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ");
}

export function statusToCode(value, { allowUpcoming = true } = {}) {
  if (value === true) return STATUS_CODES.ACTIVE;
  if (value === false) return STATUS_CODES.INACTIVE;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).trim() !== "") {
    if (allowUpcoming && numeric === STATUS_CODES.UPCOMING) return STATUS_CODES.UPCOMING;
    return numeric === STATUS_CODES.ACTIVE ? STATUS_CODES.ACTIVE : STATUS_CODES.INACTIVE;
  }

  const text = normalizeText(value);
  if (allowUpcoming && ["upcoming", "scheduled", "sap chieu", "sap khai truong", "cho phat hanh"].includes(text)) {
    return STATUS_CODES.UPCOMING;
  }
  if (["active", "hoat dong", "dang hoat dong", "dang chieu", "dang ban", "cong khai", "dang phat hanh"].includes(text)) {
    return STATUS_CODES.ACTIVE;
  }
  return STATUS_CODES.INACTIVE;
}

export function codeToAdminStatus(value, { allowUpcoming = true } = {}) {
  const code = statusToCode(value, { allowUpcoming });
  if (allowUpcoming && code === STATUS_CODES.UPCOMING) return ADMIN_STATUS_KEYS.UPCOMING;
  return code === STATUS_CODES.ACTIVE ? ADMIN_STATUS_KEYS.ACTIVE : ADMIN_STATUS_KEYS.INACTIVE;
}

export function adminStatusToCode(value, options) {
  return statusToCode(value, options);
}

export function codeToStaffStatus(value) {
  return statusToCode(value, { allowUpcoming: false }) === STATUS_CODES.ACTIVE
    ? STAFF_STATUS_KEYS.ACTIVE
    : STAFF_STATUS_KEYS.INACTIVE;
}

export function staffStatusToCode(value) {
  return statusToCode(value, { allowUpcoming: false });
}

export function isActiveStatus(value) {
  return statusToCode(value, { allowUpcoming: false }) === STATUS_CODES.ACTIVE;
}
