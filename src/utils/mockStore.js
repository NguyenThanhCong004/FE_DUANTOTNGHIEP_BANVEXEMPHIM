/**
 * Trạng thái cục bộ (localStorage) cho màn admin chưa nối API — không còn dữ liệu mẫu.
 * Khi nối BE, thay dần bằng gọi API; có thể xóa key localStorage cũ.
 */
const STORAGE_KEY = "cinetoon_admin_super_state_v2";

const SHIFT_SLOT_META = {
  ca1: { key: "ca1", label: "Ca 1", start: "08:00", end: "13:00" },
  ca2: { key: "ca2", label: "Ca 2", start: "13:00", end: "18:00" },
  ca3: { key: "ca3", label: "Ca 3", start: "18:00", end: "23:00" },
};

const ROLE_OPTIONS = ["Check ve", "Dung quay", "Don dep"];

function emptyState() {
  return {
    staff: [],
    users: [],
    promotions: [],
    rooms: [],
    invoices: [],
    productsForSale: [],
    productsDraft: [],
    cinemas: [],
    vouchers: [],
    news: [],
    shiftEmployees: [],
    shiftSlots: [],
    showtimeMovies: [],
    showtimeEvents: [],
    seatLayouts: {},
  };
}

export function getMockState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = emptyState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    const seed = emptyState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function setMockState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function updateMockState(updater) {
  const current = getMockState();
  const next = updater(current);
  setMockState(next);
  return next;
}

export function resetMockState() {
  const seed = emptyState();
  setMockState(seed);
  return seed;
}

export function getShiftSlotMeta() {
  return SHIFT_SLOT_META;
}

export function getShiftRoleOptions() {
  return ROLE_OPTIONS;
}

export function upsertById(moduleKey, item, idKey = "id") {
  return updateMockState((prev) => {
    const next = structuredClone(prev);
    const arr = Array.isArray(next[moduleKey]) ? next[moduleKey] : [];
    const idx = arr.findIndex((x) => String(x[idKey]) === String(item[idKey]));
    if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
    else arr.unshift(item);
    next[moduleKey] = arr;
    return next;
  });
}

export function getById(moduleKey, id, idKey = "id") {
  const state = getMockState();
  const arr = Array.isArray(state[moduleKey]) ? state[moduleKey] : [];
  return arr.find((x) => String(x[idKey]) === String(id)) || null;
}

export function removeById(moduleKey, id, idKey = "id") {
  return updateMockState((prev) => {
    const next = structuredClone(prev);
    const arr = Array.isArray(next[moduleKey]) ? next[moduleKey] : [];
    next[moduleKey] = arr.filter((x) => String(x[idKey]) !== String(id));
    return next;
  });
}
