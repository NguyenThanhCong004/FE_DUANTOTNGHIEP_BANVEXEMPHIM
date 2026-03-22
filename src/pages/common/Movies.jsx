import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import MovieCard from "../../components/common/MovieCard";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch } from "../../utils/apiClient";
import { MOVIES } from "../../constants/apiEndpoints";
import { mapMovieForCard } from "../../utils/movieApiMap";

const Movies = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState({ keyword: "", genre: "", status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allMovies, setAllMovies] = useState([]);

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
        const res = await apiFetch(MOVIES.LIST);
        const json = await res.json().catch(() => null);
        if (!m) return;
        if (!res.ok) {
          setError(json?.message || "Không tải được danh sách phim");
          setAllMovies([]);
          return;
        }
        const list = Array.isArray(json?.data) ? json.data : [];
        setAllMovies(list.filter((x) => x.status === 1).map(mapMovieForCard));
      } catch {
        if (m) {
          setError("Không kết nối được máy chủ.");
          setAllMovies([]);
        }
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const filteredMovies = useMemo(() => {
    return allMovies.filter((movie) => {
      const matchKeyword = movie.title.toLowerCase().includes(filter.keyword.toLowerCase());
      const matchGenre = filter.genre === "" || movie.genre === filter.genre;
      const matchStatus =
        filter.status === "all" ||
        (filter.status === "now" && movie.type === "now") ||
        (filter.status === "soon" && movie.type === "soon");
      return matchKeyword && matchGenre && matchStatus;
    });
  }, [allMovies, filter]);

  return (
    <Layout>
      <div className="container py-5 mt-5">
        <div className="row mb-5 align-items-end g-3">
          <div className="col-lg-4">
            <h2 className="fw-black text-white text-uppercase tracking-tighter m-0 display-5" style={{ fontWeight: 900 }}>
              Danh Sách Phim
            </h2>
            <div style={{ height: "6px", width: "80px", background: "var(--primary-gradient)", borderRadius: "10px" }} />
          </div>

          <div className="col-lg-8">
            <div className="card p-3 border-0 shadow-sm bg-white bg-opacity-10 rounded-4" style={{ backdropFilter: "blur(20px)" }}>
              <div className="row g-2">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white bg-opacity-10 border-0 ps-3 text-white opacity-50">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-white bg-opacity-10 border-0 py-2 shadow-none text-white"
                      placeholder="Tìm tên phim..."
                      value={filter.keyword}
                      onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select bg-white bg-opacity-10 border-0 py-2 shadow-none text-white"
                    onChange={(e) => setFilter({ ...filter, genre: e.target.value })}
                  >
                    <option value="">Tất cả thể loại</option>
                    <option value="Hành động">Hành động</option>
                    <option value="Hoạt hình">Hoạt hình</option>
                    <option value="Tình cảm">Tình cảm</option>
                    <option value="Kinh dị">Kinh dị</option>
                    <option value="Viễn tưởng">Viễn tưởng</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="btn-group w-100 shadow-sm" style={{ borderRadius: "10px", overflow: "hidden" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${filter.status === "all" ? "btn-danger" : "btn-outline-light border-opacity-25"}`}
                      onClick={() => setFilter({ ...filter, status: "all" })}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${filter.status === "now" ? "btn-danger" : "btn-outline-light border-opacity-25"}`}
                      onClick={() => setFilter({ ...filter, status: "now" })}
                    >
                      Đang chiếu
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${filter.status === "soon" ? "btn-danger" : "btn-outline-light border-opacity-25"}`}
                      onClick={() => setFilter({ ...filter, status: "soon" })}
                    >
                      Sắp chiếu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white py-5">
            <div className="spinner-border text-danger" role="status" />
          </div>
        ) : error ? (
          <div className="alert alert-warning border-0 shadow-sm">{error}</div>
        ) : filteredMovies.length > 0 ? (
          <div className="row g-4">
            {filteredMovies.map((movie) => (
              <div key={movie.id} className="col-6 col-md-3">
                <MovieCard movie={movie} isComingSoon={movie.type === "soon"} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Không có phim phù hợp" subtitle="Thử đổi bộ lọc hoặc thêm phim trên admin." />
        )}
      </div>
    </Layout>
  );
};

export default Movies;
