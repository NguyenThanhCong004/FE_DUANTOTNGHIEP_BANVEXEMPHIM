import React, { useMemo, useState } from "react";
import { Alert } from "react-bootstrap";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import ChartCard from "../../components/admin/dashboard/ChartCard";
import RecentListCard from "../../components/admin/dashboard/RecentListCard";
import BarChartWidget from "../../components/admin/dashboard/BarChartWidget";
import DoughnutChartWidget from "../../components/admin/dashboard/DoughnutChartWidget";
import { useApiData } from "../../components/admin/dashboard/useApiData";
import { apiJson } from "../../utils/apiClient";
import { ADMIN_DASHBOARD, ORDERS_ONLINE, SHOWTIMES } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { formatNumber, formatVnd, formatDateTime, formatDate, formatTime } from "../../utils/formatters";

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const REVENUE_DAYS_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 14, label: "14 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

const TOP_MOVIES_LIMIT_OPTIONS = [5, 10, 20];

const AdminDashboard = () => {
  const staff = getStoredStaff();
  const cinemaId = staff?.cinemaId;

  const [revenueDays, setRevenueDays] = useState(14);
  const [ticketsDate, setTicketsDate] = useState("");
  const [topMoviesLimit, setTopMoviesLimit] = useState(5);

  const summary = useApiData(() => apiJson(ADMIN_DASHBOARD.SUMMARY(cinemaId)), [cinemaId]);
  const revenueByDay = useApiData(
    () => apiJson(ADMIN_DASHBOARD.REVENUE_BY_DAY(cinemaId, revenueDays)),
    [cinemaId, revenueDays]
  );
  const ticketsByHour = useApiData(
    () => apiJson(ADMIN_DASHBOARD.TICKETS_BY_HOUR(cinemaId, ticketsDate || undefined)),
    [cinemaId, ticketsDate]
  );
  const topMovies = useApiData(
    () => apiJson(ADMIN_DASHBOARD.TOP_MOVIES(cinemaId, topMoviesLimit)),
    [cinemaId, topMoviesLimit]
  );
  const seatTypeRatio = useApiData(() => apiJson(ADMIN_DASHBOARD.SEAT_TYPE_RATIO(cinemaId)), [cinemaId]);
  const recentInvoices = useApiData(
    () => apiJson(cinemaId ? `${ORDERS_ONLINE.LIST}?cinemaId=${cinemaId}` : ORDERS_ONLINE.LIST),
    [cinemaId]
  );
  const showtimesRaw = useApiData(
    () => apiJson(cinemaId ? `${SHOWTIMES.LIST}?cinemaId=${cinemaId}` : SHOWTIMES.LIST),
    [cinemaId]
  );
  const showtimesToday = useMemo(() => {
    if (!showtimesRaw.data) return [];
    const { start, end } = todayBounds();
    return showtimesRaw.data
      .filter((s) => {
        const t = new Date(s.startTime);
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [showtimesRaw.data]);

  const seatTypeTotal = (seatTypeRatio.data || []).reduce((a, b) => a + (b.ticketsSold || 0), 0);
  const formatVN = (v) => formatVnd(v, { compact: true });

  if (!cinemaId) {
    return (
      <AdminPanelPage icon="speedometer2" title="Bảng điều khiển Admin">
        <div className="admin-empty py-5">
          <h5 className="mb-2">Chưa có rạp</h5>
          <p className="mb-0">Tài khoản chưa được gán rạp — vui lòng liên hệ Super Admin.</p>
        </div>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage icon="speedometer2" title="Bảng điều khiển Admin">
      {summary.error ? <Alert variant="danger" className="mb-3">{summary.error}</Alert> : null}

      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <KpiCard title="Doanh thu hôm nay" value={formatVN(summary.data?.revenueToday)} color="#2a78d6" loading={summary.loading} />
        <KpiCard title="Vé bán hôm nay" value={formatNumber(summary.data?.ticketsToday)} color="#eb6834" loading={summary.loading} />
        <KpiCard title="Khách hàng hôm nay" value={formatNumber(summary.data?.customersToday)} color="#4a3aa7" loading={summary.loading} />
        <KpiCard title="Phim đang chiếu" value={formatNumber(summary.data?.moviesShowingCount)} color="#e87ba4" loading={summary.loading} />
        <KpiCard title="Suất chiếu hôm nay" value={formatNumber(summary.data?.showtimesToday)} color="#1baf7a" loading={summary.loading} />
        <KpiCard title="Ghế đã bán" value={formatNumber(summary.data?.seatsSoldToday)} color="#eda100" loading={summary.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <ChartCard
            title={`Doanh thu theo ngày (${revenueDays} ngày gần nhất)`}
            loading={revenueByDay.loading}
            error={revenueByDay.error}
            isEmpty={!revenueByDay.loading && (revenueByDay.data || []).length === 0}
            headerRight={
              <select
                className="admin-search-input admin-filter-control"
                style={{ width: 130, height: 34 }}
                value={revenueDays}
                onChange={(e) => setRevenueDays(Number(e.target.value))}
              >
                {REVENUE_DAYS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            }
          >
            <BarChartWidget
              labels={(revenueByDay.data || []).map((r) => formatDate(r.label, { day: "2-digit", month: "2-digit" }))}
              datasets={[{ label: "Doanh thu", data: (revenueByDay.data || []).map((r) => r.totalAmount) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-5">
          <ChartCard
            title={ticketsDate ? `Vé bán theo giờ ngày ${formatDate(ticketsDate, { day: "2-digit", month: "2-digit" })}` : "Vé bán theo giờ hôm nay"}
            loading={ticketsByHour.loading}
            error={ticketsByHour.error}
            isEmpty={!ticketsByHour.loading && (ticketsByHour.data || []).every((h) => !h.ticketCount)}
            headerRight={
              <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                <input
                  type="date"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 150, height: 34 }}
                  value={ticketsDate}
                  max={todayIso()}
                  onChange={(e) => setTicketsDate(e.target.value)}
                />
                {ticketsDate ? (
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setTicketsDate("")}>
                    Hôm nay
                  </button>
                ) : null}
              </div>
            }
          >
            <BarChartWidget
              labels={(ticketsByHour.data || []).map((h) => `${h.hour}h`)}
              datasets={[{ label: "Vé bán", data: (ticketsByHour.data || []).map((h) => h.ticketCount) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-7">
          <ChartCard
            title={`Top ${topMoviesLimit} phim bán chạy`}
            loading={topMovies.loading}
            error={topMovies.error}
            isEmpty={!topMovies.loading && (topMovies.data || []).length === 0}
            headerRight={
              <select
                className="admin-search-input admin-filter-control"
                style={{ width: 110, height: 34 }}
                value={topMoviesLimit}
                onChange={(e) => setTopMoviesLimit(Number(e.target.value))}
              >
                {TOP_MOVIES_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
            }
          >
            <BarChartWidget
              horizontal
              labels={(topMovies.data || []).map((m) => m.movieTitle)}
              datasets={[{ label: "Vé bán", data: (topMovies.data || []).map((m) => m.ticketsSold) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-5">
          <ChartCard
            title="Tỷ lệ ghế VIP / thường"
            loading={seatTypeRatio.loading}
            error={seatTypeRatio.error}
            isEmpty={!seatTypeRatio.loading && seatTypeTotal === 0}
            emptyText="Hôm nay chưa bán vé"
          >
            <DoughnutChartWidget
              soldLabel={(seatTypeRatio.data || [])[0]?.seatTypeName || "Loại 1"}
              remainingLabel="Loại khác"
              sold={(seatTypeRatio.data || [])[0]?.ticketsSold || 0}
              total={seatTypeTotal}
              centerLabel={formatNumber(seatTypeTotal)}
              colorSold="#2a78d6"
            />
          </ChartCard>
        </div>

        <div className="col-lg-6">
          <RecentListCard
            title="Hóa đơn gần đây"
            loading={recentInvoices.loading}
            error={recentInvoices.error}
            rows={(recentInvoices.data || []).slice(0, 10)}
            rowKey={(r) => r.id}
            columns={[
              { key: "orderCode", label: "Mã đơn" },
              { key: "customerName", label: "Khách hàng" },
              { key: "finalAmount", label: "Tổng tiền", align: "end", render: (r) => formatVN(r.finalAmount) },
              { key: "createdAt", label: "Thời gian", render: (r) => formatDateTime(r.createdAt) },
            ]}
          />
        </div>

        <div className="col-lg-6">
          <RecentListCard
            title="Suất chiếu hôm nay"
            loading={showtimesRaw.loading}
            error={showtimesRaw.error}
            rows={showtimesToday}
            rowKey={(r) => r.showtimeId}
            columns={[
              { key: "movie", label: "Phim", render: (r) => r.movieTitle || r.movie?.title || "—" },
              { key: "room", label: "Phòng", render: (r) => r.roomName || r.room?.name || "—" },
              { key: "startTime", label: "Giờ chiếu", render: (r) => formatTime(r.startTime) },
            ]}
          />
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default AdminDashboard;
