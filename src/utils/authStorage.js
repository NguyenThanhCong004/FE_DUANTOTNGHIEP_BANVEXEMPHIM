const STORAGE_KEYS = {
  accessToken: "cinemax_accessToken",
  refreshToken: "cinemax_refreshToken",
  user: "cinemax_user",
  staff: "cinemax_staff",
  activeShift: "cinemax_activeShift",
};

export function setAuthSession({ accessToken, refreshToken, user, staff, activeShift } = {}) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  if (staff) localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(staff));
  if (activeShift) {
    localStorage.setItem(STORAGE_KEYS.activeShift, JSON.stringify(activeShift));
  } else if (activeShift === null) {
    localStorage.removeItem(STORAGE_KEYS.activeShift);
  }
}

export function setActiveShift(shift) {
  if (shift) {
    localStorage.setItem(STORAGE_KEYS.activeShift, JSON.stringify(shift));
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeShift);
  }
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

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.staff);
  localStorage.removeItem(STORAGE_KEYS.activeShift);
}

