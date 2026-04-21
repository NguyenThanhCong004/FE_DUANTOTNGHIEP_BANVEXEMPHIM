import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Spinner, Badge } from "react-bootstrap";
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
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return ymd; }
}

function normalizeShowtime(st) {
  const id = st.id ?? st.showtimeId;
  const movieId = st.movie_id ?? st.movieId;
  return {
    id, date: st.date, time: st.time, movieId,
    movieTitle: st.movie_title ?? st.movieTitle,
    roomName: st.room_name ?? st.roomName,
    status: st.status,
    price: st.price != null ? Number(st.price) : null,
  };
}

function getTodayYmd() {
  const d = new Date();
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

function getMaxDateYmd(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('sv-SE');
}

function extractSortedDates(showtimes, minDate = null, maxDate = null) {
  const set = new Set();
  for (const s of showtimes || []) {
    if (s.date && String(s.date).trim()) {
      const ymd = String(s.date).slice(0, 10);
      // Chỉ lấy ngày trong khoảng minDate đến maxDate
      if (minDate && ymd < minDate) continue;
      if (maxDate && ymd > maxDate) continue;
      set.add(ymd);
    }
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
  } catch { return ymd; }
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
  const [selectedDateYmd, setSelectedDateYmd] = useState("");

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) {
      setError("Mã phim không hợp lệ"); setLoading(false); return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await apiFetch(MOVIES.BY_ID(movieId));
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) { setError(body?.message || "Không tìm thấy phim"); setMovie(null); }
        else setMovie(body?.data || null);
      } catch { if (!cancelled) { setError("Không kết nối được máy chủ."); setMovie(null); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [movieId]);

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) { setIsFavorite(false); return; }
    const token = getAccessToken();
    if (!token) { setIsFavorite(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(ME.FAVORITES);
        const body = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;
        const rows = Array.isArray(body?.data) ? body.data : [];
        setIsFavorite(rows.some((r) => Number(r.movieId) === movieId));
      } catch { if (!cancelled) setIsFavorite(false); }
    })();
    return () => { cancelled = true; };
  }, [movieId]);

  const toggleFavorite = async () => {
    if (!Number.isFinite(movieId) || movieId <= 0) return;
    if (!getAccessToken()) { navigate("/login", { state: { from: `/movie/${movieId}` } }); return; }
    setFavBusy(true);
    try {
      if (isFavorite) {
        const res = await apiFetch(ME.FAVORITE_BY_MOVIE(movieId), { method: "DELETE" });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await apiFetch(ME.FAVORITES, { method: "POST", body: JSON.stringify({ movieId }) });
        if (res.ok) setIsFavorite(true);
      }
    } finally { setFavBusy(false); }
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
      } catch { if (!cancelled) setCinemas([]); }
      finally { if (!cancelled) setCinemasLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(movieId) || movieId <= 0) return;
    if (!selectedCinemaId) { setShowtimes([]); setSlotsError(null); setSelectedDateYmd(""); return; }
    const cid = Number(selectedCinemaId);
    let cancelled = false;
    (async () => {
      setSlotsLoading(true); setSlotsError(null);
      try {
        const q = `?movieId=${movieId}&cinemaId=${cid}`;
        const res = await apiFetch(`${SHOWTIMES.LIST}${q}`);
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) { setSlotsError(body?.message || "Không tải được suất chiếu"); setShowtimes([]); return; }
        const raw = Array.isArray(body?.data) ? body.data : [];
        const mapped = raw.map(normalizeShowtime).filter((s) => s.id != null);
        mapped.sort((a, b) => (`${a.date || ""} ${a.time || ""}`).localeCompare(`${b.date || ""} ${b.time || ""}`));
        setShowtimes(mapped);
      } catch { if (!cancelled) { setSlotsError("Lỗi mạng khi tải suất chiếu"); setShowtimes([]); } }
      finally { if (!cancelled) setSlotsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [movieId, selectedCinemaId]);

  const todayYmd = useMemo(() => getTodayYmd(), []);
  const maxDateYmd = useMemo(() => getMaxDateYmd(7), []);
  const availableDates = useMemo(() => extractSortedDates(showtimes, todayYmd, maxDateYmd), [showtimes, todayYmd, maxDateYmd]);

  useEffect(() => {
    if (availableDates.length === 0) { setSelectedDateYmd(""); return; }
    setSelectedDateYmd((prev) => (prev && availableDates.includes(prev) ? prev : availableDates[0]));
  }, [availableDates]);

  const showtimesForSelectedDate = useMemo(() => {
    if (!selectedDateYmd) return [];
    const now = new Date();
    const currentYmd = now.toLocaleDateString('sv-SE'); // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return showtimes.filter((s) => {
      const ymd = String(s.date || "").slice(0, 10);
      const time = String(s.time || "").slice(0, 5);
      
      // Filter by date range
      if (ymd !== selectedDateYmd || ymd < todayYmd || ymd > maxDateYmd) {
        return false;
      }
      
      // For today's showtimes, filter out those that have already ended
      if (ymd === currentYmd) {
        // Check if showtime has ended (time has passed)
        if (time < currentTime) {
          return false;
        }
        // Also check status if available
        if (s.status === "Đã chiếu") {
          return false;
        }
      }
      
      return true;
    });
  }, [showtimes, selectedDateYmd, todayYmd, maxDateYmd]);

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        .md-page {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
        }

        .md-page {
          min-height: 100vh;
          background: var(--navy);
          padding: 80px 0 60px;
        }

        /* ── BACK ── */
        .md-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: border-color .25s, background .25s, color .25s;
          margin-bottom: 36px;
        }
        .md-back:hover { border-color: var(--yellow); background: rgba(212,255,0,0.05); color: var(--yellow); }

        /* ── STOPPED BANNER ── */
        .md-stopped {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: rgba(240,240,255,0.5);
          padding: 12px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          margin-bottom: 28px;
        }
        .md-stopped strong { color: var(--yellow); }

        /* ── LOADING ── */
        .md-loading {
          display: flex; flex-direction: column;
          align-items: center; padding: 80px 0; gap: 12px;
        }
        .md-loading p {
          font-family: 'Syne', sans-serif; font-size: 13px;
          font-weight: 600; color: rgba(240,240,255,0.35); margin: 0;
        }

        /* ── LAYOUT ── */
        .md-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 767px) { .md-layout { grid-template-columns: 1fr; } }

        /* ── POSTER ── */
        .md-poster {
          width: 100%; aspect-ratio: 2/3; object-fit: cover;
          border-radius: 16px;
          border: 1px solid rgba(212,255,0,0.12);
          box-shadow: 0 0 40px rgba(139,0,255,0.2);
          display: block;
        }
        .md-poster-empty {
          width: 100%; aspect-ratio: 2/3;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 13px;
          color: rgba(240,240,255,0.2); font-weight: 600;
        }

        /* ── CONTENT ── */
        .md-strip {
          height: 3px; width: 60px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          border-radius: 2px; margin-bottom: 16px;
        }

        .md-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(26px, 4vw, 44px);
          letter-spacing: 3px;
          color: var(--off-white);
          line-height: 1.1;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .md-fav-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.12);
          color: var(--off-white);
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .25s; white-space: nowrap;
          flex-shrink: 0;
        }
        .md-fav-btn:hover:not(:disabled) { border-color: var(--pink); color: var(--pink); background: rgba(255,45,120,0.06); }
        .md-fav-btn.active { border-color: var(--pink); color: var(--pink); background: rgba(255,45,120,0.1); }
        .md-fav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .md-meta {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          color: rgba(240,240,255,0.35);
          margin-bottom: 16px;
          letter-spacing: 0.3px;
        }

        .md-info-row {
          display: flex; align-items: baseline; gap: 8px;
          font-family: 'Syne', sans-serif; font-size: 13px;
          margin-bottom: 8px;
        }
        .md-info-label { color: rgba(240,240,255,0.4); font-weight: 600; flex-shrink: 0; }
        .md-info-value { color: var(--off-white); font-weight: 700; }
        .md-info-value.accent { color: var(--yellow); }

        .md-section-label {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--pink); margin-bottom: 8px;
        }

        .md-desc {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 500;
          line-height: 1.8; color: rgba(240,240,255,0.55);
          white-space: pre-line; margin-bottom: 24px;
        }

        /* ── BOOKING PANEL ── */
        .md-booking-panel {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(212,255,0,0.12);
          border-radius: 16px;
          padding: 24px 28px;
          margin-top: 8px;
        }

        .md-panel-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px; letter-spacing: 2px;
          color: var(--off-white); margin: 0 0 6px;
          display: flex; align-items: center; gap: 10px;
        }
        .md-panel-title i { color: var(--pink); font-size: 16px; }

        .md-panel-hint {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
          color: rgba(240,240,255,0.35); margin-bottom: 20px;
        }
        .md-panel-hint a { color: var(--yellow); text-decoration: none; font-weight: 800; }
        .md-panel-hint a:hover { color: var(--pink); }

        /* Steps breadcrumb */
        .md-steps-bar {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 20px; flex-wrap: wrap;
        }
        .md-step-pill {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          padding: 5px 12px; border-radius: 20px;
          background: rgba(255,255,255,0.05);
          color: rgba(240,240,255,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all .2s;
        }
        .md-step-pill.active {
          background: rgba(255,45,120,0.12);
          color: var(--pink);
          border-color: rgba(255,45,120,0.3);
        }
        .md-step-arrow { color: rgba(240,240,255,0.2); font-size: 12px; }

        /* Select */
        .md-step-label {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: rgba(240,240,255,0.4); margin-bottom: 8px; display: block;
        }

        .md-select {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: var(--off-white);
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          padding: 11px 16px;
          outline: none;
          transition: border-color .3s, box-shadow .3s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(240,240,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
          margin-bottom: 20px;
          cursor: pointer;
        }
        .md-select:focus { border-color: var(--yellow); box-shadow: 0 0 16px rgba(212,255,0,0.1); }
        .md-select option { background: #0d0d2b; color: var(--off-white); }

        /* Date chips */
        .md-date-row {
          display: flex; flex-nowrap: nowrap; gap: 8px;
          overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px;
          -webkit-overflow-scrolling: touch;
        }
        .md-date-chip {
          flex-shrink: 0;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          padding: 8px 16px; border-radius: 20px; cursor: pointer;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: rgba(240,240,255,0.55);
          transition: all .2s; white-space: nowrap;
        }
        .md-date-chip:hover { border-color: rgba(255,45,120,0.4); color: var(--pink); }
        .md-date-chip.active {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-color: transparent; color: #fff;
          box-shadow: 0 0 16px rgba(255,45,120,0.3);
        }

        /* Showtime cards */
        .md-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        .md-slot-card {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(212,255,0,0.12);
          border-radius: 12px; padding: 16px;
          display: flex; flex-direction: column;
          transition: border-color .2s, box-shadow .2s;
        }
        .md-slot-card:hover { border-color: rgba(255,45,120,0.3); box-shadow: 0 0 20px rgba(255,45,120,0.1); }
        .md-slot-card.ended {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.06);
          opacity: 0.55;
        }

        .md-slot-time {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px; letter-spacing: 2px;
          color: var(--yellow); line-height: 1; margin-bottom: 4px;
        }
        .md-slot-room {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
          color: rgba(240,240,255,0.4); margin-bottom: 4px;
        }
        .md-slot-price {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          color: var(--off-white); margin-bottom: 8px;
        }

        .md-slot-badge {
          display: inline-block;
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          padding: 3px 10px; border-radius: 20px; margin-bottom: 10px;
          align-self: flex-start;
        }
        .md-slot-badge.showing { background: rgba(212,255,0,0.12); color: var(--yellow); border: 1px solid rgba(212,255,0,0.25); }
        .md-slot-badge.upcoming { background: rgba(139,0,255,0.12); color: #b67fff; border: 1px solid rgba(139,0,255,0.25); }
        .md-slot-badge.ended-badge { background: rgba(255,255,255,0.06); color: rgba(240,240,255,0.3); border: 1px solid rgba(255,255,255,0.08); }

        .md-book-btn {
          width: 100%; padding: 9px;
          border: none; border-radius: 8px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 1.5px;
          cursor: pointer; text-decoration: none; display: block; text-align: center;
          transition: box-shadow .25s, transform .2s;
          box-shadow: 0 0 16px rgba(255,45,120,0.25);
          margin-top: auto;
        }
        .md-book-btn:hover { box-shadow: 0 0 28px rgba(255,45,120,0.5); transform: translateY(-1px); color: #fff; }

        .md-hint-text {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
          color: rgba(240,240,255,0.3); margin: 0;
        }

        .md-slots-error {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          color: var(--pink); padding: 12px 16px;
          background: rgba(255,45,120,0.08); border: 1px solid rgba(255,45,120,0.2);
          border-radius: 10px;
        }

        .md-loading-inline {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          color: rgba(240,240,255,0.35);
        }
      `}</style>

      <div className="md-page">
        <div className="container">
          <Link to="/movies" className="md-back">
            <i className="fas fa-arrow-left" /> Quay lại danh sách phim
          </Link>

          {/* Loading */}
          {loading && (
            <div className="md-loading">
              <Spinner animation="border" style={{ color: "var(--pink)" }} />
              <p>Đang tải phim…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <EmptyState title="Không tải được phim" subtitle={error} />
          )}

          {/* Content */}
          {!loading && movie && (
            <>
              {isStopped && (
                <div className="md-stopped">
                  Phim này đã <strong>ngừng chiếu</strong> — không hiển thị trên trang chủ / banner.
                </div>
              )}

              <div className="md-layout">
                {/* Poster */}
                <div>
                  {poster
                    ? <img src={poster} alt={movie.title} className="md-poster" />
                    : <div className="md-poster-empty">Chưa có poster</div>
                  }
                </div>

                {/* Info */}
                <div>
                  <div className="md-strip" />

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                    <h1 className="md-title">{movie.title}</h1>
                    <button
                      type="button"
                      className={`md-fav-btn${isFavorite ? " active" : ""}`}
                      disabled={favBusy}
                      onClick={toggleFavorite}
                    >
                      {isFavorite ? "♥ Đã thích" : "♡ Yêu thích"}
                    </button>
                  </div>

                  {metaLine && <p className="md-meta">{metaLine}</p>}

                  <div className="md-info-row">
                    <span className="md-info-label">Khởi chiếu:</span>
                    <span className="md-info-value accent">{formatReleaseLabel(movie.releaseDate)}</span>
                  </div>
                  {movie.author && (
                    <div className="md-info-row">
                      <span className="md-info-label">Đạo diễn:</span>
                      <span className="md-info-value">{movie.author}</span>
                    </div>
                  )}
                  {movie.basePrice != null && (
                    <div className="md-info-row" style={{ marginBottom: 20 }}>
                      <span className="md-info-label">Giá gốc vé:</span>
                      <span className="md-info-value accent">{Number(movie.basePrice).toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}

                  {movie.description && (
                    <div style={{ marginBottom: 16 }}>
                      <p className="md-section-label">Giới thiệu</p>
                      <p className="md-desc">{movie.description}</p>
                    </div>
                  )}
                  {movie.content && (
                    <div style={{ marginBottom: 16 }}>
                      <p className="md-section-label">Nội dung</p>
                      <p className="md-desc">{movie.content}</p>
                    </div>
                  )}

                  {/* ── BOOKING PANEL ── */}
                  <div className="md-booking-panel">
                    <h5 className="md-panel-title">
                      <i className="fas fa-ticket-alt" /> Đặt vé theo rạp — ngày — suất
                    </h5>
                    <p className="md-panel-hint">
                      Muốn chỉ mua{" "}
                      <Link to="/foodorder">bắp nước</Link>
                      {" "}(PayOS, nhận tại quầy)? Hoặc thêm món khi đặt vé ở bước chọn ghế.
                    </p>

                    {/* Steps bar */}
                    <div className="md-steps-bar">
                      <span className={`md-step-pill${selectedCinemaId ? " active" : ""}`}>1. Chọn rạp</span>
                      <span className="md-step-arrow">→</span>
                      <span className={`md-step-pill${selectedCinemaId && !slotsLoading && availableDates.length > 0 && selectedDateYmd ? " active" : ""}`}>
                        2. Chọn ngày
                      </span>
                      <span className="md-step-arrow">→</span>
                      <span className={`md-step-pill${selectedDateYmd && showtimesForSelectedDate.length > 0 ? " active" : ""}`}>
                        3. Chọn suất
                      </span>
                    </div>

                    {/* Step 1 — Cinema */}
                    {cinemaLoading ? (
                      <Spinner size="sm" animation="border" style={{ color: "var(--off-white)" }} />
                    ) : (
                      <>
                        <span className="md-step-label">Bước 1 — Rạp</span>
                        <select
                          className="md-select"
                          value={selectedCinemaId}
                          onChange={(e) => { setSelectedCinemaId(e.target.value); setSelectedDateYmd(""); }}
                        >
                          <option value="">— Chọn rạp —</option>
                          {cinemas.map((c) => {
                            const cid = c.cinemaId ?? c.id;
                            return (
                              <option key={cid} value={cid}>
                                {c.name}{c.address ? ` — ${c.address}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </>
                    )}

                    {/* Step 2 + 3 */}
                    {!selectedCinemaId ? (
                      <p className="md-hint-text">Chọn rạp để xem các ngày và suất chiếu.</p>
                    ) : slotsLoading ? (
                      <div className="md-loading-inline">
                        <Spinner size="sm" animation="border" style={{ color: "var(--pink)" }} />
                        Đang tải lịch chiếu…
                      </div>
                    ) : slotsError ? (
                      <div className="md-slots-error">{slotsError}</div>
                    ) : showtimes.length === 0 ? (
                      <p className="md-hint-text">Chưa có suất chiếu cho phim này tại rạp đã chọn.</p>
                    ) : (
                      <>
                        {/* Step 2 — Dates */}
                        <span className="md-step-label">Bước 2 — Ngày chiếu</span>
                        <div className="md-date-row">
                          {availableDates.map((ymd) => (
                            <button
                              key={ymd}
                              type="button"
                              className={`md-date-chip${ymd === selectedDateYmd ? " active" : ""}`}
                              onClick={() => setSelectedDateYmd(ymd)}
                            >
                              {formatDateChipVi(ymd)}
                            </button>
                          ))}
                        </div>

                        {/* Step 3 — Showtimes */}
                        <span className="md-step-label">Bước 3 — Suất chiếu</span>
                        {!selectedDateYmd ? (
                          <p className="md-hint-text">Chọn một ngày ở trên.</p>
                        ) : showtimesForSelectedDate.length === 0 ? (
                          <p className="md-hint-text">Không có suất trong ngày này.</p>
                        ) : (
                          <div className="md-slots-grid">
                            {showtimesForSelectedDate.map((s) => {
                              const ended = s.status === "Đã chiếu";
                              return (
                                <div key={s.id} className={`md-slot-card${ended ? " ended" : ""}`}>
                                  <div className="md-slot-time">{s.time || "—"}</div>
                                  <div className="md-slot-room">{s.roomName || "Phòng"}</div>
                                  <div className="md-slot-price">
                                    {s.price != null ? `${s.price.toLocaleString("vi-VN")} đ` : "—"}
                                  </div>
                                  {/* Ẩn trạng thái */}
                                  {/* <span className={`md-slot-badge ${badgeClass}`}>{s.status || "—"}</span> */}
                                  {ended
                                    ? <p className="md-hint-text" style={{ marginTop: "auto" }}>Hết suất</p>
                                    : (
                                      <Link to={`/booking/${s.id}`} className="md-book-btn">
                                        Đặt vé
                                      </Link>
                                    )
                                  }
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MovieDetail;