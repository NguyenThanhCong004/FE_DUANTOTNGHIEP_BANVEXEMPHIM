import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getElementAtEvent } from "react-chartjs-2";
import { Alert } from "react-bootstrap";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminPagination from "../../components/admin/AdminPagination";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import ChartCard from "../../components/admin/dashboard/ChartCard";
import RecentListCard from "../../components/admin/dashboard/RecentListCard";
import BarChartWidget from "../../components/admin/dashboard/BarChartWidget";
import { useApiData } from "../../components/admin/dashboard/useApiData";
import { apiJson } from "../../utils/apiClient";
import { SUPER_ADMIN_DASHBOARD } from "../../constants/apiEndpoints";
import { getAccessToken, clearAuthSession } from "../../utils/authStorage";
import { decodeJwtPayload } from "../../utils/jwt";
import { formatNumber, formatVnd, formatDate } from "../../utils/formatters";

const GRANULARITY_OPTIONS = [
  { value: "day", label: "Theo ngày" },
  { value: "month", label: "Theo tháng" },
  { value: "year", label: "Theo năm" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i);
const PAGE_SIZE = 10;

function MonthYearPicker({ month, year, onMonthChange, onYearChange }) {
  return (
    <div className="d-flex gap-2">
      <select
        className="admin-search-input admin-filter-control"
        style={{ width: 100, height: 34 }}
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
      >
        {MONTHS.map((m) => (
          <option key={m} value={m}>Tháng {m}</option>
        ))}
      </select>
      <select
        className="admin-search-input admin-filter-control"
        style={{ width: 100, height: 34 }}
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const barChartRef = useRef();

  const [granularity, setGranularity] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [cinemaPage, setCinemaPage] = useState(1);

  const isRangeActive = Boolean(rangeFrom && rangeTo);

  const [accessError, setAccessError] = useState(() => {
    const token = getAccessToken();
    if (!token) return "";
    const payload = decodeJwtPayload(token);
    const authorities = payload?.authorities || [];
    return authorities.includes("ROLE_SUPER_ADMIN") ? "" : "Bạn không có quyền truy cập Dashboard Super Admin.";
  });

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/staff/login", { state: { message: "Vui lòng đăng nhập.", type: "warning" } });
    }
  }, [navigate]);

  const summary = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.SUMMARY), []);
  const revenue = useApiData(
    () => apiJson(SUPER_ADMIN_DASHBOARD.REVENUE_CHART(
      selectedYear,
      granularity,
      isRangeActive ? { from: rangeFrom, to: rangeTo } : undefined
    )),
    [selectedYear, granularity, isRangeActive, rangeFrom, rangeTo]
  );
  const cinemaRankings = useApiData(
    () => apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_RANKING(selectedYear, selectedMonth)),
    [selectedYear, selectedMonth]
  );
  const topMovies = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.TOP_MOVIES(10)), []);

  useEffect(() => {
    if (summary.error === "401" || (summary.error && summary.error.toLowerCase().includes("token"))) {
      clearAuthSession();
      navigate("/staff/login");
    }
  }, [summary.error, navigate]);

  useEffect(() => { setCinemaPage(1); }, [cinemaRankings.data]);

  const revenueLabels = useMemo(() => {
    if (!revenue.data) return [];
    if (isRangeActive || granularity === "day") {
      return revenue.data.map((r) => formatDate(r.label, { day: "2-digit", month: "2-digit" }));
    }
    return revenue.data.map((r) => r.label);
  }, [revenue.data, granularity, isRangeActive]);

  const handleBarClick = (event) => {
    if (isRangeActive || granularity !== "month" || !barChartRef.current) return;
    const element = getElementAtEvent(barChartRef.current, event);
    if (element.length > 0) {
      setSelectedMonth(element[0].index + 1);
    }
  };

  const clearRange = () => { setRangeFrom(""); setRangeTo(""); };

  const formatVN = (v) => formatVnd(v, { compact: true });
  const totalCinemaRevenue = (cinemaRankings.data || []).reduce((a, b) => a + (b.revenue || 0), 0);
  const cinemaTotalPages = Math.max(1, Math.ceil((cinemaRankings.data || []).length / PAGE_SIZE));
  const pagedCinemaRankings = (cinemaRankings.data || []).slice(
    (cinemaPage - 1) * PAGE_SIZE,
    cinemaPage * PAGE_SIZE
  );
  const revenueTitle = isRangeActive
    ? `Doanh thu từ ${formatDate(rangeFrom)} đến ${formatDate(rangeTo)}`
    : `Doanh thu ${granularity === "day" ? "theo ngày (30 ngày)" : granularity === "year" ? "theo năm" : `năm ${selectedYear}`}`;

  if (accessError) {
    return (
      <AdminPanelPage icon="globe" title="Trung tâm điều hành">
        <Alert variant="danger">{accessError}</Alert>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage
      icon="globe"
      title="Trung tâm điều hành"
    >
      {summary.error ? <Alert variant="danger" className="mb-3">{summary.error}</Alert> : null}

      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <KpiCard title="Tổng doanh thu" value={formatVN(summary.data?.totalRevenue)} color="#2a78d6" loading={summary.loading} />
        <KpiCard title="Doanh thu hôm nay" value={formatVN(summary.data?.revenueToday)} color="#1baf7a" loading={summary.loading} />
        <KpiCard title="Tổng vé đã bán" value={formatNumber(summary.data?.totalTicketsSold)} color="#eb6834" loading={summary.loading} />
        <KpiCard title="Tổng khách hàng" value={formatNumber(summary.data?.totalUsers)} color="#4a3aa7" loading={summary.loading} />
        <KpiCard title="Tổng phim" value={formatNumber(summary.data?.totalMovies)} color="#e87ba4" loading={summary.loading} />
        <KpiCard title="Tổng rạp" value={formatNumber(summary.data?.totalCinemas)} color="#eda100" loading={summary.loading} />
        <KpiCard title="Tổng phòng chiếu" value={formatNumber(summary.data?.totalRooms)} color="#008300" loading={summary.loading} />
        <KpiCard title="Tổng Admin" value={formatNumber(summary.data?.totalAdmins)} color="#e34948" loading={summary.loading} />
        <KpiCard title="Tổng nhân viên" value={formatNumber(summary.data?.totalStaff)} color="#2a78d6" loading={summary.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <ChartCard
            title={revenueTitle}
            loading={revenue.loading}
            error={revenue.error}
            isEmpty={!revenue.loading && revenueLabels.length === 0}
            headerRight={
              <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 150, height: 34 }}
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value)}
                  disabled={isRangeActive}
                >
                  {GRANULARITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 150, height: 34 }}
                  value={rangeFrom}
                  max={rangeTo || undefined}
                  onChange={(e) => setRangeFrom(e.target.value)}
                />
                <span className="text-muted small">đến</span>
                <input
                  type="date"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 150, height: 34 }}
                  value={rangeTo}
                  min={rangeFrom || undefined}
                  onChange={(e) => setRangeTo(e.target.value)}
                />
                {isRangeActive ? (
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={clearRange}>
                    Bỏ lọc
                  </button>
                ) : null}
              </div>
            }
          >
            <BarChartWidget
              chartRef={barChartRef}
              labels={revenueLabels}
              datasets={[{
                label: "Doanh thu",
                data: (revenue.data || []).map((r) => r.totalAmount),
                highlightIndex: !isRangeActive && granularity === "month" ? selectedMonth - 1 : undefined,
              }]}
              onBarClick={handleBarClick}
            />
          </ChartCard>
        </div>

        <div className="col-lg-6 d-flex flex-column">
          <ChartCard
            title="Top 10 phim doanh thu cao nhất"
            loading={topMovies.loading}
            error={topMovies.error}
            isEmpty={!topMovies.loading && (topMovies.data || []).length === 0}
            height={380}
          >
            <BarChartWidget
              horizontal
              labels={(topMovies.data || []).map((m) => m.movieTitle)}
              datasets={[{ label: "Doanh thu", data: (topMovies.data || []).map((m) => m.revenue) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-6 d-flex flex-column">
          <div className="flex-grow-1">
            <RecentListCard
              className="h-100"
              title="Top rạp doanh thu cao"
              headerRight={
                <MonthYearPicker
                  month={selectedMonth}
                  year={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                />
              }
              loading={cinemaRankings.loading}
              error={cinemaRankings.error}
              rows={pagedCinemaRankings}
              rowKey={(r, i) => `${r.cinemaName}-${i}`}
              columns={[
                { key: "rank", label: "Hạng", render: (_r) => `#${(cinemaRankings.data || []).indexOf(_r) + 1}` },
                { key: "cinemaName", label: "Tên rạp" },
                { key: "revenue", label: "Doanh thu", align: "end", render: (r) => formatVN(r.revenue) },
                {
                  key: "pct", label: "Tỉ lệ", render: (r) =>
                    totalCinemaRevenue > 0 ? `${((r.revenue / totalCinemaRevenue) * 100).toFixed(1)}%` : "0.0%",
                },
              ]}
            />
          </div>
          <AdminPagination
            currentPage={cinemaPage}
            totalPages={cinemaTotalPages}
            totalItems={(cinemaRankings.data || []).length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setCinemaPage}
            itemLabel="rạp"
          />
        </div>

      </div>
    </AdminPanelPage>
  );
};

export default SuperAdminDashboard;
