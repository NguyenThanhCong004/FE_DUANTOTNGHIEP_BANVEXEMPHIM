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
const COLS     = "36px 1fr 80px 90px 110px 130px 120px";
const MOV_COLS = "36px 1fr 120px 140px";

const STATUS_LABELS = { 1: "Hoạt động", 0: "Ngừng hoạt động" };
const STATUS_BADGE  = { 1: "admin-badge-success", 0: "admin-badge-neutral" };

const CinemaStatistics = () => {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("revenue");
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const cinemaStats = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_STATS), []);
  const movieStat   = useApiData(
    () => selectedCinemaId ? apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_MOVIE_REVENUE(selectedCinemaId)) : Promise.resolve(null),
    [selectedCinemaId]
  );

  const formatVN = (v) => formatVnd(v, { compact: true });

  const filtered = useMemo(() => {
    let data = cinemaStats.data || [];
    if (search)
      data = data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "tickets")
      data = [...data].sort((a, b) => b.ticketCount - a.ticketCount);
    else
      data = [...data].sort((a, b) => b.revenue - a.revenue);
    return data;
  }, [cinemaStats.data, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((c, i) => ({ ...c, _rank: (page - 1) * PAGE_SIZE + i + 1 }));

  const { totalRevenue, totalTickets, totalRooms } = useMemo(() => ({
    totalRevenue: (cinemaStats.data || []).reduce((a, b) => a + (b.revenue    || 0), 0),
    totalTickets: (cinemaStats.data || []).reduce((a, b) => a + (b.ticketCount|| 0), 0),
    totalRooms:   (cinemaStats.data || []).reduce((a, b) => a + (b.totalRooms || 0), 0),
  }), [cinemaStats.data]);

  const top10 = useMemo(() =>
    [...(cinemaStats.data || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    [cinemaStats.data]
  );

  const cinemaOptions = useMemo(() =>
    [...(cinemaStats.data || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [cinemaStats.data]
  );

  const selectedCinemaName = useMemo(() => {
    if (!selectedCinemaId) return "";
    const c = (cinemaStats.data || []).find((c) => String(c.cinemaId) === String(selectedCinemaId));
    return c?.name || "";
  }, [selectedCinemaId, cinemaStats.data]);

  const movieRows = movieStat.data || [];

  const movieHeaderRight = (
    <select
      className="admin-search-input admin-filter-control"
      style={{ width: 240, height: 30, fontSize: 12 }}
      value={selectedCinemaId}
      onChange={(e) => setSelectedCinemaId(e.target.value)}
    >
      <option value="">-- Chọn rạp để xem theo phim --</option>
      {cinemaOptions.map((c) => (
        <option key={c.cinemaId} value={c.cinemaId}>{c.name}</option>
      ))}
    </select>
  );

  return (
    <AdminPanelPage icon="building-check" title="Thống kê rạp">
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard title="Tổng số rạp"      value={formatNumber((cinemaStats.data || []).length)} color="#2a78d6" loading={cinemaStats.loading} />
        <KpiCard title="Tổng phòng chiếu" value={formatNumber(totalRooms)}   color="#4a3aa7" loading={cinemaStats.loading} />
        <KpiCard title="Tổng vé đã bán"   value={formatNumber(totalTickets)} color="#eb6834" loading={cinemaStats.loading} />
        <KpiCard title="Tổng doanh thu"   value={formatVN(totalRevenue)}     color="#1baf7a" loading={cinemaStats.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <ChartCard
            title="Doanh thu theo rạp"
            loading={cinemaStats.loading}
            error={cinemaStats.error}
            isEmpty={!cinemaStats.loading && top10.length === 0}
            height={320}
          >
            <BarChartWidget
              labels={top10.map((c) => c.name)}
              datasets={[{ label: "Doanh thu", data: top10.map((c) => c.revenue) }]}
            />
          </ChartCard>
        </div>

        {/* Bảng thống kê phim theo rạp */}
        <div className="col-12">
          <ChartCard
            title={selectedCinemaName ? `Top phim theo rạp — ${selectedCinemaName}` : "Top phim theo rạp (chọn rạp)"}
            headerRight={movieHeaderRight}
            loading={!!selectedCinemaId && movieStat.loading}
            error={selectedCinemaId ? movieStat.error : null}
            isEmpty={!!selectedCinemaId && !movieStat.loading && movieRows.length === 0}
            height="auto"
          >
            {!selectedCinemaId ? (
              <div className="mvstat-empty" style={{ color: "#000" }}>Cần chọn rạp</div>
            ) : (
              <>
                <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: MOV_COLS }}>
                  <span>#</span>
                  <span>Tên phim</span>
                  <span style={{ textAlign: "right" }}>Vé đã bán</span>
                  <span style={{ textAlign: "right" }}>Doanh thu</span>
                </div>
                {movieRows.map((m, i) => (
                  <div key={i} className="mvstat-row" style={{ display: "grid", gridTemplateColumns: MOV_COLS }}>
                    <span className="text-muted">{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{m.movieTitle}</span>
                    <span style={{ textAlign: "right" }}>{formatNumber(m.ticketsSold)}</span>
                    <span style={{ textAlign: "right" }}>{formatVN(m.revenue)}</span>
                  </div>
                ))}
              </>
            )}
          </ChartCard>
        </div>

        <div className="col-12">
          <div className="admin-card admin-slide-up">
            <div className="admin-card-header">
              <h4 className="mb-0">Chi tiết thống kê rạp</h4>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 220, height: 34 }}
                  placeholder="Tìm theo tên rạp..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 160, height: 34 }}
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
              <span>Tên rạp</span>
              <span style={{ textAlign: "right" }}>Phòng</span>
              <span style={{ textAlign: "right" }}>Nhân viên</span>
              <span style={{ textAlign: "right" }}>Vé đã bán</span>
              <span style={{ textAlign: "right" }}>Doanh thu</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
            </div>

            {cinemaStats.loading ? (
              <div className="mvstat-empty">Đang tải...</div>
            ) : cinemaStats.error ? (
              <div className="mvstat-empty text-danger">{cinemaStats.error}</div>
            ) : paged.length === 0 ? (
              <div className="mvstat-empty">Không có dữ liệu</div>
            ) : paged.map((c) => (
              <div
                key={c.cinemaId}
                className="mvstat-row"
                style={{ display: "grid", gridTemplateColumns: COLS, cursor: "pointer" }}
                onClick={() => setSelectedCinemaId(String(c.cinemaId))}
                title="Nhấn để xem top phim tại rạp này"
              >
                <span className="text-muted">{c._rank}</span>
                <span>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>{c.address}</div>
                </span>
                <span style={{ textAlign: "right" }}>{formatNumber(c.totalRooms)}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(c.totalStaff)}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(c.ticketCount)}</span>
                <span style={{ textAlign: "right" }}>{formatVN(c.revenue)}</span>
                <span style={{ textAlign: "center" }}>
                  <span className={`admin-badge ${STATUS_BADGE[c.status] ?? "admin-badge-neutral"}`}>
                    {STATUS_LABELS[c.status] ?? "Không xác định"}
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
            itemLabel="rạp"
          />
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CinemaStatistics;
