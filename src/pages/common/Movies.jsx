import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import MovieCard from "../../components/common/MovieCard";
import EmptyState from "../../components/common/EmptyState";
import PublicPagination from "../../components/common/PublicPagination";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { GENRES, MOVIES } from "../../constants/apiEndpoints";
import { mapMovieForCard } from "../../utils/movieApiMap";

const MOVIES_PAGE_SIZE = 12;

const Movies = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState({ keyword: "", genre: "", status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allMovies, setAllMovies] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setFilter((f) => ({ ...f, keyword: q }));
  }, [searchParams]);

  useEffect(() => {
    let m = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(withQuery(MOVIES.LIST, { search: filter.keyword }));
        const json = await res.json().catch(() => null);
        if (!m) return;
        if (!res.ok) {
          setError(json?.message || "Không tải được danh sách phim");
          setAllMovies([]);
          return;
        }
        const list = Array.isArray(json?.data) ? json.data : [];
        // Hiển thị phim đang chiếu (status 1) và sắp chiếu (status 2)
        setAllMovies(list.filter((x) => x.status === 1 || x.status === 2).map(mapMovieForCard));
      } catch {
        if (m) {
          setError("Không kết nối được máy chủ.");
          setAllMovies([]);
        }
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => { m = false; };
  }, [filter.keyword]);

  useEffect(() => {
    setPage(1);
  }, [filter.keyword, filter.genre, filter.status]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(GENRES.LIST);
        const json = await res.json().catch(() => null);
        if (!mounted || !res.ok) return;
        const names = (Array.isArray(json?.data) ? json.data : [])
          .map((g) => String(g.name ?? g.genreName ?? "").trim())
          .filter(Boolean);
        setGenreOptions([...new Set(names)].sort((a, b) => a.localeCompare(b, "vi")));
      } catch {
        if (mounted) setGenreOptions([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const genreFilterOptions = useMemo(() => {
    const fromMovies = allMovies.flatMap((movie) => movie.genres || []);
    return [...new Set([...genreOptions, ...fromMovies].map((g) => String(g).trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi"));
  }, [allMovies, genreOptions]);

  const filteredMovies = useMemo(() => {
    const list = allMovies.filter((movie) => {
      const matchGenre   = filter.genre === "" || (movie.genres || []).includes(filter.genre);
      const matchStatus  =
        filter.status === "all" ||
        (filter.status === "now"  && movie.type === "now") ||
        (filter.status === "soon" && movie.type === "soon");
      return matchGenre && matchStatus;
    });
    return list.sort((a, b) => {
      const ad = a.releaseYmd || "";
      const bd = b.releaseYmd || "";
      if (ad !== bd) return bd.localeCompare(ad);
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [allMovies, filter]);

  const movieTotalPages = Math.max(1, Math.ceil(filteredMovies.length / MOVIES_PAGE_SIZE));

  useEffect(() => {
    if (page > movieTotalPages) setPage(movieTotalPages);
  }, [page, movieTotalPages]);

  const pagedMovies = useMemo(() => {
    const start = (page - 1) * MOVIES_PAGE_SIZE;
    return filteredMovies.slice(start, start + MOVIES_PAGE_SIZE);
  }, [filteredMovies, page]);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card:   rgba(20,22,50,0.92);
        }

        .mv-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 40px 0 80px;
        }

        /* ── HEADER ── */
        .mv-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .mv-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(28px, 5vw, 44px);
          letter-spacing: 4px;
          color: #fff;
          line-height: 1;
          margin: 0 0 10px;
        }
        .mv-title span { color: var(--yellow); }
        .mv-title-bar {
          height: 3px;
          width: 56px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink));
        }
        .mv-count {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          margin-top: 8px;
          letter-spacing: 0.3px;
        }

        /* ── FILTER BOX ── */
        .mv-filters {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          flex: 1;
          min-width: 0;
          max-width: 680px;
        }

        /* search */
        .mv-search-wrap {
          position: relative;
          flex: 1;
          min-width: 160px;
        }
        .mv-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          font-size: 13px;
          pointer-events: none;
        }
        .mv-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 10px 14px 10px 36px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s;
        }
        .mv-input::placeholder { color: rgba(255,255,255,0.25); }
        .mv-input:focus { border-color: var(--yellow); }

        /* select */
        .mv-select {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 400;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          min-width: 150px;
        }
        .mv-select option { background: #1a1b3a; color: #fff; }
        .mv-select:focus { border-color: var(--yellow); }

        /* status toggle */
        .mv-toggle {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
          flex-shrink: 0;
        }
        .mv-toggle-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.4px;
          padding: 7px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .mv-toggle-btn.active {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          box-shadow: 0 0 12px rgba(233,30,140,0.3);
        }
        .mv-toggle-btn:hover:not(.active) { color: rgba(255,255,255,0.7); }

        /* ── LOADING ── */
        .mv-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          gap: 16px;
        }
        .mv-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(123,31,162,0.3);
          border-top-color: var(--pink);
          border-radius: 50%;
          animation: mvSpin 0.7s linear infinite;
        }
        @keyframes mvSpin { to { transform: rotate(360deg); } }
        .mv-loading p {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }

        /* ── ERROR ── */
        .mv-error {
          padding: 16px 20px;
          border-radius: 12px;
          background: rgba(233,30,140,0.08);
          border: 1px solid rgba(233,30,140,0.25);
          color: #e91e8c;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ── EMPTY ── */
        .mv-empty {
          text-align: center;
          padding: 64px 0;
        }
        .mv-empty-icon  { font-size: 40px; opacity: 0.2; margin-bottom: 14px; }
        .mv-empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .mv-empty-sub   { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.2); }

        @media (max-width: 767px) {
          .mv-header { flex-direction: column; align-items: flex-start; }
          .mv-filters { max-width: 100%; width: 100%; }
        }
      `}</style>

      <div className="mv-page mt-4">
        <div className="container">

          {/* ── HEADER ── */}
          <div className="mv-header">
            <div>
              <div className="mv-title">Danh Sách <span>Phim</span></div>
              <div className="mv-title-bar" />
              {!loading && !error && (
                <div className="mv-count">{filteredMovies.length} phim{filter.keyword || filter.genre || filter.status !== "all" ? " phù hợp" : ""}</div>
              )}
            </div>

            <div className="mv-filters">
              {/* Search */}
              <div className="mv-search-wrap">
                <span className="mv-search-icon">
                  <i className="fas fa-search" />
                </span>
                <input
                  type="text"
                  className="mv-input"
                  placeholder="Tìm tên phim..."
                  value={filter.keyword}
                  onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                />
              </div>

              {/* Genre */}
              <select
                className="mv-select"
                value={filter.genre}
                onChange={(e) => setFilter({ ...filter, genre: e.target.value })}
              >
                <option value="">Tất cả thể loại</option>
                {genreFilterOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Status toggle */}
              <div className="mv-toggle">
                {[
                  { key: "all",  label: "Tất cả" },
                  { key: "now",  label: "Đang chiếu" },
                  { key: "soon", label: "Sắp chiếu" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`mv-toggle-btn${filter.status === key ? " active" : ""}`}
                    onClick={() => setFilter({ ...filter, status: key })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          {loading ? (
            <div className="mv-loading">
              <div className="mv-spinner" />
              <p>Đang tải danh sách phim…</p>
            </div>
          ) : error ? (
            <div className="mv-error">⚠ {error}</div>
          ) : filteredMovies.length > 0 ? (
            <>
              <div className="row g-4">
                {pagedMovies.map((movie) => (
                  <div key={movie.id} className="col-6 col-md-3">
                    <MovieCard movie={movie} isComingSoon={movie.type === "soon"} />
                  </div>
                ))}
              </div>
              <PublicPagination
                page={page}
                totalItems={filteredMovies.length}
                pageSize={MOVIES_PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="mv-empty">
              <div className="mv-empty-icon">🎬</div>
              <div className="mv-empty-title">Không có phim phù hợp</div>
              <div className="mv-empty-sub">Thử đổi bộ lọc hoặc thêm phim trên admin.</div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Movies;
