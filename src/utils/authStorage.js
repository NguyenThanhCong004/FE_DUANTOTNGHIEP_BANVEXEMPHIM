import { getJwtExpirationMs, isJwtExpired } from "./jwt";

const STORAGE_KEYS = {
  accessToken: "cinemax_accessToken",
  refreshToken: "cinemax_refreshToken",
  user: "cinemax_user",
  staff: "cinemax_staff",
  activeShift: "cinemax_activeShift",
};

export const AUTH_SESSION_CHANGED = "cinemax:auth-session-changed";

function emitAuthSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
  }
}

export function setAuthSession({ accessToken, refreshToken, user, staff, activeShift } = {}) {
  if (accessToken !== undefined) {
    if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    else localStorage.removeItem(STORAGE_KEYS.accessToken);
  }
  if (refreshToken !== undefined) {
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    else localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
  if (user !== undefined) {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }
  if (staff !== undefined) {
    if (staff) localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(staff));
    else localStorage.removeItem(STORAGE_KEYS.staff);
  }
  if (activeShift) {
    localStorage.setItem(STORAGE_KEYS.activeShift, JSON.stringify(activeShift));
  } else if (activeShift === null) {
    localStorage.removeItem(STORAGE_KEYS.activeShift);
  }
  emitAuthSessionChanged();
}

export function setActiveShift(shift) {
  if (shift) {
    localStorage.setItem(STORAGE_KEYS.activeShift, JSON.stringify(shift));
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeShift);
  }
  emitAuthSessionChanged();
}

export function getActiveShift() {
  const raw = localStorage.getItem(STORAGE_KEYS.activeShift);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredStaff() {
  const raw = localStorage.getItem(STORAGE_KEYS.staff);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAuthSession() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const user = getStoredUser();
  const staff = getStoredStaff();

  const hasIdentity = Boolean(user || staff);
  const accessValid = Boolean(accessToken && !isJwtExpired(accessToken));
  const refreshValid = Boolean(refreshToken && !isJwtExpired(refreshToken));
  const isAuthenticated = hasIdentity && (accessValid || refreshValid);

  if ((accessToken || refreshToken || hasIdentity) && !isAuthenticated) {
    clearAuthSession();
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      staff: null,
      isAuthenticated: false,
      accessValid: false,
      refreshValid: false,
      sessionExpiresAt: null,
    };
  }

  const sessionExpiresAt = refreshValid
    ? getJwtExpirationMs(refreshToken)
    : accessValid
      ? getJwtExpirationMs(accessToken)
      : null;

  return {
    accessToken,
    refreshToken,
    user,
    staff,
    isAuthenticated,
    accessValid,
    refreshValid,
    sessionExpiresAt,
  };
}

export function hasValidAuthSession() {
  return getAuthSession().isAuthenticated;
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.staff);
  localStorage.removeItem(STORAGE_KEYS.activeShift);
  emitAuthSessionChanged();
}
