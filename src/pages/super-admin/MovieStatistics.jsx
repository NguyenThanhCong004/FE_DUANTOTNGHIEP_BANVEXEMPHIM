import React, { useState, useMemo } from "react";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminPagination from "../../components/admin/AdminPagination";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import ChartCard from "../../components/admin/dashboard/ChartCard";
import BarChartWidget from "../../components/admin/dashboard/BarChartWidget";
import { useApiData } from "../../components/admin/dashboard/useApiData";
import { apiJson } from "../../utils/apiClient";
import { SUPER_ADMIN_DASHBOARD } from "../../constants/apiEndpoints";
import { formatNumber, formatVnd } from "../../utils/formatters";

const PAGE_SIZE = 10;
const COLS      = "36px 1fr 120px 140px 130px";
const CIN_COLS  = "36px 1fr 120px 140px";

const STATUS_LABELS = { 1: "Đang chiếu", 2: "Sắp chiếu", 0: "Ngừng chiếu" };
const STATUS_BADGE  = { 1: "admin-badge-success", 2: "admin-badge-warning", 0: "admin-badge-neutral" };

const MovieStatistics = () => {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("revenue");
  const [selectedMovieId, setSelectedMovieId] = useState("");

  const movieStats = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.MOVIE_STATS), []);
  const topMovies  = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.TOP_MOVIES(10)), []);
  const cinemaStat = useApiData(
    () => selectedMovieId ? apiJson(SUPER_ADMIN_DASHBOARD.MOVIE_CINEMA_REVENUE(selectedMovieId)) : Promise.resolve(null),
    [selectedMovieId]
  );

  const formatVN = (v) => formatVnd(v, { compact: true });

  const filtered = useMemo(() => {
    let data = movieStats.data || [];
    if (search) data = data.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "tickets") data = [...data].sort((a, b) => b.ticketsSold - a.ticketsSold);
    else data = [...data].sort((a, b) => b.revenue - a.revenue);
    return data;
  }, [movieStats.data, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m, i) => ({
    ...m,
    _rank: (page - 1) * PAGE_SIZE + i + 1,
  }));

  const totalTickets = (movieStats.data || []).reduce((a, b) => a + (b.ticketsSold || 0), 0);
  const totalRevenue = (movieStats.data || []).reduce((a, b) => a + (b.revenue || 0), 0);

  const topByTickets = useMemo(() =>
    [...(movieStats.data || [])].sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 10),
    [movieStats.data]
  );

  const selectedMovieTitle = useMemo(() => {
    if (!selectedMovieId) return "";
    const m = (movieStats.data || []).find((m) => String(m.movieId) === String(selectedMovieId));
    return m?.title || "";
  }, [selectedMovieId, movieStats.data]);

  const movieOptions = useMemo(() =>
    [...(movieStats.data || [])].sort((a, b) => a.title.localeCompare(b.title)),
    [movieStats.data]
  );

  const cinemaRows = cinemaStat.data || [];

  const cinemaHeaderRight = (
    <select
      className="admin-search-input admin-filter-control"
      style={{ width: 260, height: 30, fontSize: 12 }}
      value={selectedMovieId}
      onChange={(e) => setSelectedMovieId(e.target.value)}
    >
      <option value="">-- Chọn phim để xem theo rạp --</option>
      {movieOptions.map((m) => (
        <option key={m.movieId} value={m.movieId}>{m.title}</option>
      ))}
    </select>
  );

  return (
    <AdminPanelPage icon="film" title="Thống kê phim">
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard title="Tổng phim có doanh thu" value={formatNumber((movieStats.data || []).length)} color="#2a78d6" loading={movieStats.loading} />
        <KpiCard title="Tổng vé đã bán"         value={formatNumber(totalTickets)}                   color="#eb6834" loading={movieStats.loading} />
        <KpiCard title="Tổng doanh thu phim"    value={formatVN(totalRevenue)}                       color="#1baf7a" loading={movieStats.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-6">
          <ChartCard
            title="Top 10 phim doanh thu cao nhất"
            loading={topMovies.loading}
            error={topMovies.error}
            isEmpty={!topMovies.loading && (topMovies.data || []).length === 0}
            height={360}
          >
            <BarChartWidget
              horizontal
              labels={(topMovies.data || []).map((m) => m.movieTitle)}
              datasets={[{ label: "Doanh thu", data: (topMovies.data || []).map((m) => m.revenue) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-6">
          <ChartCard
            title="Top 10 phim bán vé nhiều nhất"
            loading={movieStats.loading}
            error={movieStats.error}
            isEmpty={!movieStats.loading && topByTickets.length === 0}
            height={360}
          >
            <BarChartWidget
              horizontal
              labels={topByTickets.map((m) => m.title)}
              datasets={[{ label: "Số vé", data: topByTickets.map((m) => m.ticketsSold) }]}
            />
          </ChartCard>
        </div>

        {/* Bảng rạp theo phim */}
        <div className="col-12">
          <ChartCard
            title={selectedMovieTitle ? `Doanh thu theo rạp — ${selectedMovieTitle}` : "Doanh thu theo rạp (chọn phim)"}
            headerRight={cinemaHeaderRight}
            loading={!!selectedMovieId && cinemaStat.loading}
            error={selectedMovieId ? cinemaStat.error : null}
            isEmpty={!!selectedMovieId && !cinemaStat.loading && cinemaRows.length === 0}
            height="auto"
          >
            {!selectedMovieId ? (
              <div className="mvstat-empty" style={{ color: "#000" }}>Cần chọn phim</div>
            ) : (
              <>
                <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: CIN_COLS }}>
                  <span>#</span>
                  <span>Rạp chiếu</span>
                  <span style={{ textAlign: "right" }}>Vé đã bán</span>
                  <span style={{ textAlign: "right" }}>Doanh thu</span>
                </div>
                {cinemaRows.map((c, i) => (
                  <div key={c.cinemaId} className="mvstat-row" style={{ display: "grid", gridTemplateColumns: CIN_COLS }}>
                    <span className="text-muted">{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{c.cinemaName}</span>
                    <span style={{ textAlign: "right" }}>{formatNumber(c.ticketsSold)}</span>
                    <span style={{ textAlign: "right" }}>{formatVN(c.revenue)}</span>
                  </div>
                ))}
              </>
            )}
          </ChartCard>
        </div>

        <div className="col-12">
          <div className="admin-card admin-slide-up">
            <div className="admin-card-header">
              <h4 className="mb-0">Chi tiết thống kê phim</h4>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 220, height: 34 }}
                  placeholder="Tìm theo tên phim..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 150, height: 34 }}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                  <option value="revenue">Sắp xếp: Doanh thu</option>
                  <option value="tickets">Sắp xếp: Số vé</option>
                </select>
              </div>
            </div>

            <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: COLS }}>
              <span>#</span>
              <span>Tên phim</span>
              <span style={{ textAlign: "right" }}>Vé đã bán</span>
              <span style={{ textAlign: "right" }}>Doanh thu</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
            </div>

            {movieStats.loading ? (
              <div className="mvstat-empty">Đang tải...</div>
            ) : movieStats.error ? (
              <div className="mvstat-empty text-danger">{movieStats.error}</div>
            ) : paged.length === 0 ? (
              <div className="mvstat-empty">Không có dữ liệu</div>
            ) : paged.map((m) => (
              <div
                key={m.movieId}
                className="mvstat-row"
                style={{ display: "grid", gridTemplateColumns: COLS, cursor: "pointer" }}
                onClick={() => setSelectedMovieId(String(m.movieId))}
                title="Nhấn để xem doanh thu theo rạp"
              >
                <span className="text-muted">{m._rank}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(m.ticketsSold)}</span>
                <span style={{ textAlign: "right" }}>{formatVN(m.revenue)}</span>
                <span style={{ textAlign: "center" }}>
                  <span className={`admin-badge ${STATUS_BADGE[m.status] ?? "admin-badge-neutral"}`}>
                    {STATUS_LABELS[m.status] ?? "Không xác định"}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="phim"
          />
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default MovieStatistics;
