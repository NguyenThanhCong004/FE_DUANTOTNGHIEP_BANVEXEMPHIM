/** Chuẩn hóa releaseDate từ BE (LocalDate → string hoặc mảng). */
export function releaseDateToYmd(releaseDate) {
  if (releaseDate == null) return null;
  if (typeof releaseDate === "string") return releaseDate.slice(0, 10);
  if (Array.isArray(releaseDate) && releaseDate.length >= 3) {
    const [y, m, d] = releaseDate;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

/** Dữ liệu cho MovieCard */
export function mapMovieForCard(m) {
  const ymd = releaseDateToYmd(m.releaseDate);
  const releaseLabel = ymd
    ? new Date(ymd + "T12:00:00").toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
  // Phân loại dựa vào status: 1=Đang chiếu, 2=Sắp chiếu
  const type = m.status === 2 ? "soon" : "now";
  return {
    id: m.id,
    title: m.title ?? "",
    posterUrl: m.posterUrl || m.poster || "",
    banner: m.banner || null,
    genre: m.genre ?? "",
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
