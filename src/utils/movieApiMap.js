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
    type: ymd && ymd > new Date().toISOString().slice(0, 10) ? "soon" : "now",
  };
}

export function splitNowAndSoon(movies) {
  const today = new Date().toISOString().slice(0, 10);
  /** status === 1: đang chiếu (admin); khác 1 = ngừng chiếu — không hiển thị */
  const active = (movies || []).filter((m) => m.status === 1);
  const mapped = active.map(mapMovieForCard);
  const nowShowing = mapped.filter((m) => !m.releaseYmd || m.releaseYmd <= today);
  const comingSoon = mapped.filter((m) => m.releaseYmd && m.releaseYmd > today);
  return { nowShowing, comingSoon };
}
