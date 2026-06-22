/** Thư viện màu có số (đồng bộ chọn loại ghế / ẩn màu đã dùng). */
export const SEAT_COLOR_PALETTE = [
  { n: 1, hex: "#0d6efd" },
  { n: 2, hex: "#ffc107" },
  { n: 3, hex: "#dc3545" },
  { n: 4, hex: "#198754" },
  { n: 5, hex: "#6f42c1" },
  { n: 6, hex: "#20c997" },
  { n: 7, hex: "#fd7e14" },
  { n: 8, hex: "#0dcaf0" },
  { n: 9, hex: "#d63384" },
  { n: 10, hex: "#6610f2" },
  { n: 11, hex: "#0aa2c0" },
  { n: 12, hex: "#e83e8c" },
  { n: 13, hex: "#6c757d" },
  { n: 14, hex: "#343a40" },
  { n: 15, hex: "#ffcd39" },
  { n: 16, hex: "#5c7cfa" },
];

/** Chuẩn hóa #RRGGBB in hoa để so sánh màu đã chọn (hỗ trợ #RGB). */
export function normalizeHex(hex) {
  if (hex == null || String(hex).trim() === "") return "";
  let s = String(hex).trim();
  if (!s.startsWith("#")) s = `#${s}`;
  const m6 = /^#([0-9a-fA-F]{6})$/.exec(s);
  if (m6) return `#${m6[1].toUpperCase()}`;
  const m3 = /^#([0-9a-fA-F]{3})$/.exec(s);
  if (m3) {
    const [a, b, c] = m3[1].split("");
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return "";
}

/** Chuẩn hóa tên loại ghế để khớp API (khoảng trắng, Unicode NFKC, không phân biệt hoa thường). */
export function normalizeSeatTypeKey(name) {
  try {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .normalize("NFKC")
      .toLowerCase();
  } catch {
    return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
  }
}

/** Ghế đôi / couple — nhận diện theo tên (dùng chung admin / booking / sales). */
export function isCoupleTypeName(type) {
  const s = String(type || "").toLowerCase();
  return s.includes("đôi") || s.includes("sweet") || s.includes("couple") || s.includes("double");
}

const NORMAL_SEAT_NAME_RE = /^(thường|thuong|standard|regular|normal|economy)$/i;

/** Gợi ý màu theo tên loại ghế khi API chưa truyền màu. */
const SEAT_HEX_THUONG = "#0d6efd";
const SEAT_HEX_VIP = "#ffc107";
const SEAT_HEX_DOI = "#dc3545";

/** Loại mới: sắc độ quanh 3 màu bản. */
const SEAT_EXTRA_TINTS = [
  "#0a58ca",
  "#3d8bfd",
  "#6ea8fe",
  "#9ec5fe",
  "#997404",
  "#cc9a06",
  "#ffcd39",
  "#ffda6a",
  "#b02a37",
  "#c82333",
  "#e35d6d",
  "#f5c2c7",
];

/** Màu nền ghế theo tên loại (khớp admin SeatManagement). */
export function hexColorForSeatTypeName(name) {
  const s = String(name || "").trim();
  if (!s) return SEAT_HEX_THUONG;
  if (isCoupleTypeName(s)) return SEAT_HEX_DOI;
  if (/vip/i.test(s)) return SEAT_HEX_VIP;
  if (NORMAL_SEAT_NAME_RE.test(s) || /thường|thuong/i.test(s)) return SEAT_HEX_THUONG;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return SEAT_EXTRA_TINTS[h % SEAT_EXTRA_TINTS.length];
}

/** Chữ đậm / trắng trên nền hex (#RRGGBB). */
export function contrastTextColorForHex(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || "").trim());
  if (!m) return "#fff";
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#212529" : "#fff";
}

/** Ưu tiên màu từ API seatTypes (khớp tên đã chuẩn hóa), không có thì theo tên loại. */
export function resolveSeatTypeColor(typeName, seatTypes = []) {
  const name = String(typeName || "").trim();
  const list = Array.isArray(seatTypes) ? seatTypes : [];
  const key = normalizeSeatTypeKey(name);
  const st = key ? list.find((s) => s && normalizeSeatTypeKey(s.name) === key) : null;
  const fromDb = st?.color != null && String(st.color).trim() !== "" ? normalizeHex(st.color) : "";
  if (fromDb) return fromDb;
  return hexColorForSeatTypeName(name);
}

/**
 * Màu hiển thị ô ghế: ưu tiên màu gắn trực tiếp từ API ghế (SeatDTO.seatTypeColor),
 * sau đó mới tra theo danh sách loại ghế + fallback theo tên.
 */
export function resolveSeatDisplayColor(typeName, seatTypes, explicitHex) {
  const fromSeat = normalizeHex(explicitHex);
  if (fromSeat) return fromSeat;
  return resolveSeatTypeColor(typeName, seatTypes);
}
