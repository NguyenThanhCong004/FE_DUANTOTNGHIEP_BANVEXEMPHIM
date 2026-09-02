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
const COLS      = "36px 1fr 120px 80px 130px 80px 120px";

const STATUS_LABELS = { 1: "Hoạt động", 0: "Bị khóa" };
const STATUS_BADGE  = { 1: "admin-badge-success", 0: "admin-badge-danger" };

const CustomerStatistics = () => {
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("spending");
  const [filterCinema, setFilterCinema] = useState("");

  const cinemaStats   = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.CUSTOMER_STATS_BY_CINEMA), []);
  const customerStats = useApiData(
    () => apiJson(SUPER_ADMIN_DASHBOARD.CUSTOMER_STATS(filterCinema || null)),
    [filterCinema]
  );

  const formatVN = (v) => formatVnd(v, { compact: true });

  const filtered = useMemo(() => {
    let data = customerStats.data || [];
    if (search)
      data = data.filter((c) =>
        c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      );
    const metricDiff =
      sortBy === "orders" ? (a, b) => b.totalOrders - a.totalOrders :
      sortBy === "points" ? (a, b) => b.points - a.points :
      (a, b) => b.totalSpending - a.totalSpending;
    // Khách bị khóa (status 0) luôn đưa xuống cuối danh sách, bất kể tiêu chí sắp xếp.
    data = [...data].sort((a, b) => {
      const aLocked = a.status === 0 ? 1 : 0;
      const bLocked = b.status === 0 ? 1 : 0;
      if (aLocked !== bLocked) return aLocked - bLocked;
      return metricDiff(a, b);
    });
    return data;
  }, [customerStats.data, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((c, i) => ({ ...c, _rank: (page - 1) * PAGE_SIZE + i + 1 }));

  const allData = customerStats.data || [];
  const totalSpending = allData.reduce((a, b) => a + (b.totalSpending || 0), 0);
  const totalOrders   = allData.reduce((a, b) => a + (b.totalOrders || 0), 0);

  const top10 = useMemo(() =>
    [...allData].sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 10),
    [customerStats.data]
  );

  const rankDist = useMemo(() => {
    const map = {};
    allData.forEach((c) => {
      const rank = c.membershipRank || "Chưa xác định";
      map[rank] = (map[rank] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [customerStats.data]);

  const cinemaOptions = useMemo(() =>
    (cinemaStats.data || []).map((c) => ({ id: c.cinemaId, name: c.cinemaName })),
    [cinemaStats.data]
  );

  const resetPage = () => setPage(1);

  return (
    <AdminPanelPage icon="person-lines-fill" title="Thống kê khách hàng">
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard title="Tổng khách hàng" value={formatNumber(allData.length)} color="#2a78d6" loading={customerStats.loading} />
        <KpiCard title="Tổng đơn hàng"   value={formatNumber(totalOrders)}   color="#eb6834" loading={customerStats.loading} />
        <KpiCard title="Tổng chi tiêu"   value={formatVN(totalSpending)}     color="#1baf7a" loading={customerStats.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <ChartCard
            title="Top 10 khách hàng chi tiêu cao nhất"
            loading={customerStats.loading}
            error={customerStats.error}
            isEmpty={!customerStats.loading && top10.length === 0}
            height={320}
          >
            <BarChartWidget
              horizontal
              labels={top10.map((c) => c.fullName || c.email)}
              datasets={[{ label: "Chi tiêu", data: top10.map((c) => c.totalSpending) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-5">
          <ChartCard
            title="Phân bổ khách theo hạng thành viên"
            loading={customerStats.loading}
            error={customerStats.error}
            isEmpty={!customerStats.loading && rankDist.length === 0}
            height={320}
          >
            <BarChartWidget
              labels={rankDist.map(([rank]) => rank)}
              datasets={[{ label: "Số khách", data: rankDist.map(([, count]) => count) }]}
            />
          </ChartCard>
        </div>

        <div className="col-12">
          <ChartCard
            title="Số lượng khách hàng theo rạp"
            loading={cinemaStats.loading}
            error={cinemaStats.error}
            isEmpty={!cinemaStats.loading && !(cinemaStats.data || []).length}
            height={280}
          >
            <BarChartWidget
              labels={(cinemaStats.data || []).map((c) => c.cinemaName)}
              datasets={[{ label: "Khách (unique)", data: (cinemaStats.data || []).map((c) => c.uniqueCustomers) }]}
            />
          </ChartCard>
        </div>

        <div className="col-12">
          <div className="admin-card admin-slide-up">
            <div className="admin-card-header">
              <h4 className="mb-0">Chi tiết thống kê khách hàng</h4>
              <div className="d-flex gap-2 flex-wrap">
                <input
                  type="text"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 240, height: 34 }}
                  placeholder="Tìm tên hoặc email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                />
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 160, height: 34 }}
                  value={filterCinema}
                  onChange={(e) => { setFilterCinema(e.target.value); resetPage(); }}
                >
                  <option value="">Tất cả rạp</option>
                  {cinemaOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 170, height: 34 }}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
                >
                  <option value="spending">Sắp xếp: Chi tiêu</option>
                  <option value="orders">Sắp xếp: Đơn hàng</option>
                  <option value="points">Sắp xếp: Điểm tích lũy</option>
                </select>
              </div>
            </div>

            <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: COLS }}>
              <span>#</span>
              <span>Khách hàng</span>
              <span>Hạng TV</span>
              <span style={{ textAlign: "right" }}>Đơn hàng</span>
              <span style={{ textAlign: "right" }}>Tổng chi tiêu</span>
              <span style={{ textAlign: "right" }}>Điểm</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
            </div>

            {customerStats.loading ? (
              <div className="mvstat-empty">Đang tải...</div>
            ) : customerStats.error ? (
              <div className="mvstat-empty text-danger">{customerStats.error}</div>
            ) : paged.length === 0 ? (
              <div className="mvstat-empty">Không có dữ liệu</div>
            ) : paged.map((c) => (
              <div key={c.userId} className="mvstat-row" style={{ display: "grid", gridTemplateColumns: COLS }}>
                <span className="text-muted">{c._rank}</span>
                <span>
                  <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>{c.email}</div>
                </span>
                <span>{c.membershipRank}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(c.totalOrders)}</span>
                <span style={{ textAlign: "right" }}>{formatVN(c.totalSpending)}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(c.points)}</span>
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
            itemLabel="khách"
          />
        </div>

      </div>
    </AdminPanelPage>
  );
};

export default CustomerStatistics;
