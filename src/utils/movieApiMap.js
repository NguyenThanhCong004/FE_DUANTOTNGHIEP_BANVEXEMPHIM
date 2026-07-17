import { formatDate, toDateInputValue } from "./formatters";

/** Chuẩn hóa releaseDate từ BE (LocalDate → string hoặc mảng). */
export function releaseDateToYmd(releaseDate) {
  return toDateInputValue(releaseDate) || null;
}

/** Dữ liệu cho MovieCard */
export function mapMovieForCard(m) {
  const ymd = releaseDateToYmd(m.releaseDate);
  const releaseLabel = ymd ? formatDate(ymd, { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  // Phân loại dựa vào status: 1=Đang chiếu, 2=Sắp chiếu
  const type = m.status === 2 ? "soon" : "now";
  const genres = Array.isArray(m.genres) ? m.genres : [];
  return {
    id: m.id,
    title: m.title ?? "",
    posterUrl: m.posterUrl || m.poster || "",
    banner: m.banner || null,
    genre: genres.join(", "),
    genres,
    ageLimit: m.ageLimit ?? 0,
    releaseDate: releaseLabel,
    /** Phân loại danh sách */
    releaseYmd: ymd,
    status: m.status,
    type: type,
  };
}

export function splitNowAndSoon(movies) {
  /** Hiển thị phim đang chiếu (status 1) và sắp chiếu (status 2) */
  const active = (movies || []).filter((m) => m.status === 1 || m.status === 2);
  const mapped = active.map(mapMovieForCard);
  const byNewest = (a, b) => {
    const ad = a.releaseYmd || "";
    const bd = b.releaseYmd || "";
    if (ad !== bd) return bd.localeCompare(ad);
    return Number(b.id || 0) - Number(a.id || 0);
  };
  const nowShowing = mapped.filter((m) => m.type === "now").sort(byNewest);
  const comingSoon = mapped.filter((m) => m.type === "soon").sort(byNewest);
  return { nowShowing, comingSoon };
}
