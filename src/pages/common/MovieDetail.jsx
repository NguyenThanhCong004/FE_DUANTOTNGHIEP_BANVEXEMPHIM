import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Form, Spinner, Badge } from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch } from "../../utils/apiClient";
import { MOVIES, CINEMAS, SHOWTIMES, ME } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";
import { releaseDateToYmd } from "../../utils/movieApiMap";

function formatReleaseLabel(releaseDate) {
  const ymd = releaseDateToYmd(releaseDate);
  if (!ymd) return "—";
  try {
    return new Date(ymd + "T12:00:00").toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return ymd;
  }
}

function normalizeShowtime(st) {
  const id = st.id ?? st.showtimeId;
  const movieId = st.movie_id ?? st.movieId;
  return {
    id,
    date: st.date,
    time: st.time,
    movieId,
    movieTitle: st.movie_title ?? st.movieTitle,
    roomName: st.room_name ?? st.roomName,
    status: st.status,
    price: st.price != null ? Number(st.price) : null,
  };
}

/** Các ngày yyyy-MM-dd có suất, sắp xếp tăng dần */
function extractSortedDates(showtimes) {
  const set = new Set();
  for (const s of showtimes || []) {
    if (s.date && String(s.date).trim()) set.add(String(s.date).slice(0, 10));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function formatDateChipVi(ymd) {
  if (!ymd) return "";
  try {
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    const wd = d.toLocaleDateString("vi-VN", { weekday: "short" });
    const rest = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${wd}, ${rest}`;
  } catch {
    return ymd;
  }
}

const MovieDetail = () => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const movieId = Number(idParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movie, setMovie] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const [cinemas, setCinemas] = useState([]);
  const [cinemaLoading, setCinemasLoading] = useState(true);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  /** yyyy-MM-dd — chỉ hiện suất của ngày này */
  const [selectedDateYmd, setSelectedDateYmd] = useState("");

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) {
      setError("Mã phim không hợp lệ");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(MOVIES.BY_ID(movieId));
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.message || "Không tìm thấy phim");
          setMovie(null);
        } else {
          setMovie(body?.data || null);
        }
      } catch {
        if (!cancelled) {
          setError("Không kết nối được máy chủ.");
          setMovie(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) {
      setIsFavorite(false);
      return;
    }
    const token = getAccessToken();
    if (!token) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(ME.FAVORITES);
        const body = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;
        const rows = Array.isArray(body?.data) ? body.data : [];
        setIsFavorite(rows.some((r) => Number(r.movieId) === movieId));
      } catch {
        if (!cancelled) setIsFavorite(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  const toggleFavorite = async () => {
    if (!Number.isFinite(movieId) || movieId <= 0) return;
    if (!getAccessToken()) {
      navigate("/login", { state: { from: `/movie/${movieId}` } });
      return;
    }
    setFavBusy(true);
    try {
      if (isFavorite) {
        const res = await apiFetch(ME.FAVORITE_BY_MOVIE(movieId), { method: "DELETE" });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await apiFetch(ME.FAVORITES, {
          method: "POST",
          body: JSON.stringify({ movieId }),
        });
        if (res.ok) setIsFavorite(true);
      }
    } finally {
      setFavBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCinemasLoading(true);
      try {
        const res = await apiFetch(CINEMAS.LIST);
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        const list = Array.isArray(body?.data) ? body.data : [];
        const active = list.filter((c) => c.status === 1 || c.status == null);
        setCinemas(active.length ? active : list);
      } catch {
        if (!cancelled) setCinemas([]);
      } finally {
        if (!cancelled) setCinemasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) return;
    if (!selectedCinemaId) {
      setShowtimes([]);
      setSlotsError(null);
      setSelectedDateYmd("");
      return;
    }
    const cid = Number(selectedCinemaId);
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const q = `?movieId=${movieId}&cinemaId=${cid}`;
        const res = await apiFetch(`${SHOWTIMES.LIST}${q}`);
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setSlotsError(body?.message || "Không tải được suất chiếu");
          setShowtimes([]);
          return;
        }
        const raw = Array.isArray(body?.data) ? body.data : [];
        const mapped = raw.map(normalizeShowtime).filter((s) => s.id != null);
        mapped.sort((a, b) => {
          const da = `${a.date || ""} ${a.time || ""}`;
          const db = `${b.date || ""} ${b.time || ""}`;
          return da.localeCompare(db);
        });
        setShowtimes(mapped);
      } catch {
        if (!cancelled) {
          setSlotsError("Lỗi mạng khi tải suất chiếu");
          setShowtimes([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId, selectedCinemaId]);

  const availableDates = useMemo(() => extractSortedDates(showtimes), [showtimes]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDateYmd("");
      return;
    }
    setSelectedDateYmd((prev) => (prev && availableDates.includes(prev) ? prev : availableDates[0]));
  }, [availableDates]);

  const showtimesForSelectedDate = useMemo(() => {
    if (!selectedDateYmd) return [];
    return showtimes.filter((s) => String(s.date || "").slice(0, 10) === selectedDateYmd);
  }, [showtimes, selectedDateYmd]);

  const poster = movie?.posterUrl || movie?.poster || "";
  const isStopped = movie && movie.status !== 1;

  const metaLine = useMemo(() => {
    if (!movie) return "";
    const parts = [];
    if (movie.genre) parts.push(movie.genre);
    if (movie.duration) parts.push(`${movie.duration} phút`);
    if (movie.ageLimit != null) parts.push(`T${movie.ageLimit}`);
    if (movie.nation) parts.push(movie.nation);
    return parts.join(" · ");
  }, [movie]);

  if (!Number.isFinite(movieId) || movieId <= 0) {
    return (
      <Layout>
        <div className="container py-5 mt-5">
          <EmptyState title="Mã phim không hợp lệ" subtitle="Quay lại danh sách phim." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4 mt-4 text-white">
        <div className="mb-4">
          <Link to="/movies" className="btn btn-outline-light rounded-pill btn-sm fw-bold">
            <i className="fas fa-arrow-left me-2" /> Quay lại
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 small opacity-75 mb-0">Đang tải phim…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <EmptyState title="Không tải được phim" subtitle={error} />
        ) : null}

        {!loading && movie ? (
          <>
            {isStopped ? (
              <div className="alert alert-secondary border-0 shadow-sm mb-4">
                Phim này đã <strong>ngừng chiếu</strong> — không hiển thị trên trang chủ / banner.
              </div>
            ) : null}

            <div className="row g-4 align-items-start">
              <div className="col-md-4 col-lg-3">
                <div className="rounded-4 overflow-hidden shadow-lg bg-dark">
                  {poster ? (
                    <img src={poster} alt={movie.title} className="w-100" style={{ aspectRatio: "2/3", objectFit: "cover" }} />
                  ) : (
                    <div className="ratio ratio-2x3 bg-secondary d-flex align-items-center justify-content-center text-white-50 small p-3">
                      Chưa có poster
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-8 col-lg-9">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                  <h1 className="fw-black text-uppercase m-0" style={{ letterSpacing: "0.04em" }}>
                    {movie.title}
                  </h1>
                  <button
                    type="button"
                    className="btn btn-outline-light rounded-pill btn-sm fw-bold"
                    disabled={favBusy}
                    onClick={toggleFavorite}
                    title={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
                  >
                    {isFavorite ? "♥ Đã thích" : "♡ Yêu thích"}
                  </button>
                </div>
                <p className="text-white-50 small mb-3">{metaLine}</p>
                <p className="small mb-2">
                  <span className="text-white-50">Khởi chiếu:</span>{" "}
                  <strong className="text-white">{formatReleaseLabel(movie.releaseDate)}</strong>
                </p>
                {movie.author ? (
                  <p className="small mb-2">
                    <span className="text-white-50">Đạo diễn:</span> <strong>{movie.author}</strong>
                  </p>
                ) : null}
                {movie.basePrice != null ? (
                  <p className="small mb-3">
                    <span className="text-white-50">Giá gốc vé:</span>{" "}
                    <strong>{Number(movie.basePrice).toLocaleString("vi-VN")} đ</strong>
                  </p>
                ) : null}

                {movie.description ? (
                  <div className="mb-3">
                    <h6 className="text-danger fw-bold text-uppercase small mb-2">Giới thiệu</h6>
                    <p className="text-white-75 small mb-0" style={{ whiteSpace: "pre-line" }}>
                      {movie.description}
                    </p>
                  </div>
                ) : null}
                {movie.content ? (
                  <div className="mb-4">
                    <h6 className="text-danger fw-bold text-uppercase small mb-2">Nội dung</h6>
                    <p className="text-white-75 small mb-0" style={{ whiteSpace: "pre-line" }}>
                      {movie.content}
                    </p>
                  </div>
                ) : null}

                <div className="border border-secondary border-opacity-25 rounded-4 p-3 p-md-4 bg-dark bg-opacity-40">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="fas fa-ticket-alt text-danger" /> Đặt vé theo rạp — ngày — suất
                  </h5>
                  <p className="small text-white-50 mb-3">
                    Muốn chỉ mua{" "}
                    <Link to="/foodorder" className="text-warning fw-bold text-decoration-none">
                      bắp nước
                    </Link>{" "}
                    (PayOS, nhận tại quầy)? Hoặc thêm món khi đặt vé ở bước chọn ghế.
                  </p>

                  <div className="d-flex flex-wrap gap-2 small text-white-50 mb-3">
                    <span className={`rounded-pill px-2 py-1 ${selectedCinemaId ? "bg-danger bg-opacity-25 text-white" : "bg-secondary bg-opacity-25"}`}>
                      1. Chọn rạp
                    </span>
                    <span className="opacity-50">→</span>
                    <span
                      className={`rounded-pill px-2 py-1 ${
                        selectedCinemaId && !slotsLoading && availableDates.length > 0 && selectedDateYmd
                          ? "bg-danger bg-opacity-25 text-white"
                          : "bg-secondary bg-opacity-25"
                      }`}
                    >
                      2. Chọn ngày
                    </span>
                    <span className="opacity-50">→</span>
                    <span
                      className={`rounded-pill px-2 py-1 ${
                        selectedDateYmd && showtimesForSelectedDate.length > 0 ? "bg-danger bg-opacity-25 text-white" : "bg-secondary bg-opacity-25"
                      }`}
                    >
                      3. Chọn suất
                    </span>
                  </div>

                  {cinemaLoading ? (
                    <Spinner size="sm" animation="border" variant="light" />
                  ) : (
                    <Form.Group className="mb-4" controlId="cinemaPick">
                      <Form.Label className="small text-white-50 fw-bold">Bước 1 — Rạp</Form.Label>
                      <Form.Select
                        className="bg-dark text-white border-secondary"
                        value={selectedCinemaId}
                        onChange={(e) => {
                          setSelectedCinemaId(e.target.value);
                          setSelectedDateYmd("");
                        }}
                      >
                        <option value="">— Chọn rạp —</option>
                        {cinemas.map((c) => {
                          const cid = c.cinemaId ?? c.id;
                          return (
                            <option key={cid} value={cid}>
                              {c.name}
                              {c.address ? ` — ${c.address}` : ""}
                            </option>
                          );
                        })}
                      </Form.Select>
                    </Form.Group>
                  )}

                  {!selectedCinemaId ? (
                    <p className="small text-white-50 mb-0">Chọn rạp để xem các ngày và suất chiếu.</p>
                  ) : slotsLoading ? (
                    <div className="d-flex align-items-center gap-2 small text-white-50">
                      <Spinner size="sm" animation="border" variant="danger" /> Đang tải lịch chiếu…
                    </div>
                  ) : slotsError ? (
                    <div className="alert alert-warning py-2 small mb-0">{slotsError}</div>
                  ) : showtimes.length === 0 ? (
                    <p className="small text-white-50 mb-0">Chưa có suất chiếu cho phim này tại rạp đã chọn.</p>
                  ) : (
                    <>
                      <div className="mb-4">
                        <Form.Label className="small text-white-50 fw-bold d-block mb-2">Bước 2 — Ngày chiếu</Form.Label>
                        <div
                          className="d-flex flex-nowrap gap-2 pb-1 movie-detail-date-row"
                          style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
                          role="tablist"
                          aria-label="Chọn ngày chiếu"
                        >
                          {availableDates.map((ymd) => {
                            const active = ymd === selectedDateYmd;
                            return (
                              <button
                                key={ymd}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                className={`btn btn-sm rounded-pill fw-bold px-3 flex-shrink-0 ${
                                  active ? "btn-danger" : "btn-outline-light border-opacity-25"
                                }`}
                                onClick={() => setSelectedDateYmd(ymd)}
                              >
                                {formatDateChipVi(ymd)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Form.Label className="small text-white-50 fw-bold d-block mb-2">Bước 3 — Suất chiếu</Form.Label>
                        {!selectedDateYmd ? (
                          <p className="small text-white-50 mb-0">Chọn một ngày ở trên.</p>
                        ) : showtimesForSelectedDate.length === 0 ? (
                          <p className="small text-white-50 mb-0">Không có suất trong ngày này.</p>
                        ) : (
                          <div className="row g-2 g-md-3">
                            {showtimesForSelectedDate.map((s) => {
                              const ended = s.status === "Đã chiếu";
                              return (
                                <div key={s.id} className="col-6 col-sm-4 col-lg-3">
                                  <div
                                    className={`h-100 rounded-3 p-3 border d-flex flex-column ${
                                      ended ? "border-secondary border-opacity-25 bg-black bg-opacity-25 opacity-60" : "border-danger border-opacity-40 bg-dark"
                                    }`}
                                  >
                                    <div className="fs-4 fw-black text-danger mb-1">{s.time || "—"}</div>
                                    <div className="small text-white-50 mb-1">{s.roomName || "Phòng"}</div>
                                    <div className="small text-white mb-2">
                                      {s.price != null ? `${s.price.toLocaleString("vi-VN")} đ` : "—"}
                                    </div>
                                    <Badge
                                      bg={ended ? "secondary" : s.status === "Đang chiếu" ? "success" : "warning"}
                                      className="align-self-start mb-2"
                                    >
                                      {s.status || "—"}
                                    </Badge>
                                    <div className="mt-auto">
                                      {ended ? (
                                        <span className="small text-white-50">Hết suất</span>
                                      ) : (
                                        <Link
                                          to={`/booking/${s.id}`}
                                          className="btn btn-sm btn-danger w-100 rounded-pill fw-bold"
                                        >
                                          Đặt vé
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default MovieDetail;
