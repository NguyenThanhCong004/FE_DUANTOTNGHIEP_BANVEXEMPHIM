import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { getStoredStaff } from "../../utils/authStorage";
import { apiFetch } from "../../utils/apiClient";
import {
  SHOWTIMES,
  ROOMS,
  STAFF,
  PROMOTIONS,
  ORDERS_ONLINE,
  CINEMAS,
} from "../../constants/apiEndpoints";
import { formatNumber } from "../../utils/formatters";

function formatMoney(v) {
  return formatNumber(v, "0");
}

const toIso = (d) => {
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const PERIOD_PRESETS = [
  { id: "today", label: "Hôm nay" },
  { id: "7d", label: "7 ngày qua" },
  { id: "30d", label: "30 ngày qua" },
  { id: "custom", label: "Tùy chọn" },
];

const AdminDashboard = () => {
  const staffSession = getStoredStaff();
  const cinemaId = staffSession?.cinemaId;

  const [loading, setLoading] = useState(true);
  const [cinemaLabel, setCinemaLabel] = useState("");
  const [period, setPeriod] = useState("today");
  const [customFrom, setCustomFrom] = useState(toIso(new Date()));
  const [customTo, setCustomTo] = useState(toIso(new Date()));
  const [stats, setStats] = useState({
    revenueToday: 0,
    showtimeCount: 0,
    showtimeUpcoming: 0,
    roomCount: 0,
    staffCount: 0,
    promoCount: 0,
    ordersToday: 0,
  });

  const range = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === "7d") {
      start.setDate(start.getDate() - 6);
    } else if (period === "30d") {
      start.setDate(start.getDate() - 29);
    } else if (period === "custom") {
      const from = customFrom ? new Date(`${customFrom}T00:00:00`) : start;
      const to = customTo ? new Date(`${customTo}T23:59:59.999`) : end;
      return { start: from, end: to };
    }
    return { start, end };
  }, [period, customFrom, customTo]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!cinemaId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rangeStart = range.start;
        const rangeEnd = range.end;

        // Fetch song song các dữ liệu cần thiết của rạp
        const [ordersRes, stRes, rmRes, sfRes, cRes, prRes] = await Promise.all([
          apiFetch(`${ORDERS_ONLINE.LIST}?cinemaId=${cinemaId}`),
          apiFetch(`${SHOWTIMES.LIST}?cinemaId=${cinemaId}`),
          apiFetch(`${ROOMS.LIST}?cinemaId=${cinemaId}`),
          apiFetch(STAFF.LIST),
          apiFetch(CINEMAS.BY_ID(cinemaId)),
          apiFetch(`${PROMOTIONS.LIST}?cinemaId=${cinemaId}`),
        ]);

        // 1. Xử lý Đơn hàng & Doanh thu (theo khoảng thời gian đã chọn)
        const ordersJson = await ordersRes.json().catch(() => null);
        const allOrders = Array.isArray(ordersJson?.data) ? ordersJson.data : [];

        let revenueToday = 0;
        let ordersToday = 0;

        allOrders.forEach(o => {
          const isOurCinema = o.cinemaId != null && Number(o.cinemaId) === Number(cinemaId);
          const isSuccess = o.status === 1;
          const created = o.createdAt ? new Date(o.createdAt) : null;
          const isInRange = created && created >= rangeStart && created <= rangeEnd;

          if (isOurCinema && isSuccess && isInRange) {
            ordersToday += 1;
            revenueToday += Number(o.finalAmount) || 0;
          }
        });

        // 2. Xử lý Suất chiếu (theo khoảng thời gian đã chọn)
        const stJson = await stRes.json().catch(() => null);
        const allSlots = Array.isArray(stJson?.data) ? stJson.data : [];

        const rangeStartDay = new Date(rangeStart);
        rangeStartDay.setHours(0, 0, 0, 0);
        const rangeEndDay = new Date(rangeEnd);
        rangeEndDay.setHours(23, 59, 59, 999);

        const slotsToday = allSlots.filter(s => {
          const stDate = s.date ? new Date(s.date) : null;
          if (!stDate) return false;
          stDate.setHours(0, 0, 0, 0);
          return stDate.getTime() >= rangeStartDay.getTime() && stDate.getTime() <= rangeEndDay.getTime();
        });

        const showtimeCount = slotsToday.length;
        const showtimeUpcoming = slotsToday.length;

        // 3. Xử lý Phòng chiếu
        const rmJson = await rmRes.json().catch(() => null);
        const rooms = Array.isArray(rmJson?.data) ? rmJson.data : [];
        const roomCount = rooms.length;

        // 4. Xử lý Nhân viên
        const sfJson = await sfRes.json().catch(() => null);
        const staffList = Array.isArray(sfJson?.data) ? sfJson.data : [];
        const staffCount = staffList.filter(
          (s) => Number(s.cinemaId) === Number(cinemaId)
        ).length;

        // 5. Xử lý Khuyến mãi
        const prJson = await prRes.json().catch(() => null);
        const promos = Array.isArray(prJson?.data) ? prJson.data : [];
        const promoCount = promos.length;

        // 6. Lấy tên rạp
        const cJson = await cRes.json().catch(() => null);
        const cdata = cJson?.data ?? cJson;
        const label = cdata?.name || "";

        if (!mounted) return;
        
        setStats({
          revenueToday,
          showtimeCount,
          showtimeUpcoming,
          roomCount,
          staffCount,
          promoCount,
          ordersToday,
        });
        setCinemaLabel(label);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cinemaId, range]);

  const periodLabel = useMemo(() => {
    const preset = PERIOD_PRESETS.find((p) => p.id === period);
    if (period !== "custom") return preset?.label || "";
    return `${toIso(range.start)} → ${toIso(range.end)}`;
  }, [period, range]);

  const statCards = useMemo(
    () => [
      {
        title: `Doanh thu (${periodLabel})`,
        value: formatMoney(stats.revenueToday),
        subtitle: "VNĐ · đơn hoàn thành",
        icon: "bi-cash-stack",
        color: "#10b981",
        hint: `${stats.ordersToday} đơn trong khoảng đã chọn`,
      },
      {
        title: `Suất chiếu (${periodLabel})`,
        value: String(stats.showtimeCount),
        subtitle: "tại rạp",
        icon: "bi-calendar-check",
        color: "#8b5cf6",
        hint: `${stats.showtimeUpcoming} suất trong khoảng đã chọn`,
      },
      {
        title: "Phòng chiếu",
        value: String(stats.roomCount),
        subtitle: "phòng",
        icon: "bi-door-open",
        color: "#3b82f6",
        hint: "Theo rạp hiện tại",
      },
      {
        title: "Nhân viên rạp",
        value: String(stats.staffCount),
        subtitle: "người",
        icon: "bi-people",
        color: "#f59e0b",
        hint: "Được gán cinemaId",
      },
    ],
    [stats, periodLabel]
  );

  const quickLinks = useMemo(
    () => [
      { to: "/admin/staff", label: "Nhân viên", icon: "bi-person-badge" },
      { to: "/admin/showtimes", label: "Suất chiếu", icon: "bi-film" },
      { to: "/admin/products", label: "Sản phẩm", icon: "bi-bag" },
      { to: "/admin/promotions", label: "Khuyến mãi", icon: "bi-megaphone" },
      { to: "/admin/invoices", label: "Hóa đơn", icon: "bi-receipt" },
      { to: "/admin/users", label: "Khách hàng", icon: "bi-person-lines-fill" },
    ],
    []
  );

  const headerDescription = (
    <>
      <p className="lead mb-1">
        {cinemaId != null
          ? cinemaLabel || `Rạp #${cinemaId}`
          : "Chưa có rạp — vui lòng liên hệ Super Admin gán rạp cho tài khoản của bạn."}
      </p>
      <p className="small text-white-50 mb-0">
        Doanh thu tính trên các đơn hàng online hoàn thành của chi nhánh theo khoảng thời gian đã chọn.
      </p>
    </>
  );

  return (
    <AdminPanelPage icon="speedometer2" title="Bảng điều khiển Admin" description={headerDescription}>
      <div className="admin-card admin-slide-up mb-4">
        <div className="admin-card-body d-flex align-items-end gap-3 flex-wrap py-3">
          <div>
            <label className="small fw-bold text-muted d-block mb-1">Khoảng thời gian</label>
            <div className="d-flex gap-1 flex-wrap">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`admin-btn admin-btn-sm ${period === p.id ? "admin-btn-primary" : "admin-btn-outline"}`}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {period === "custom" && (
            <>
              <div>
                <label className="small fw-bold text-muted d-block mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="admin-search-input"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="small fw-bold text-muted d-block mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="admin-search-input"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 small">Đang tải số liệu…</p>
        </div>
      ) : (
        <>
          <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {statCards.map((stat, index) => (
              <div
                key={stat.title}
                className="admin-stat-card admin-slide-up"
                style={{
                  "--stat-color": stat.color,
                  "--icon-bg": `${stat.color}15`,
                  animationDelay: `${index * 0.08}s`,
                }}
              >
                <div className="admin-stat-icon">
                </div>
                <div className="admin-stat-value">{stat.value}</div>
                <div className="admin-stat-label">{stat.subtitle}</div>
                <div className="fw-semibold small mt-2" style={{ color: "var(--admin-text)" }}>
                  {stat.title}
                </div>
                <div className="small text-muted mt-1">{stat.hint}</div>
              </div>
            ))}
          </div>

          <Row className="g-4 mt-1">
            <Col lg={12}>
              <div className="admin-card admin-slide-up">
                <div className="admin-card-header">
                  <h4>
                    Truy cập nhanh
                  </h4>
                </div>
                <div className="admin-card-body">
                  <Row className="g-2">
                    {quickLinks.map((q) => (
                      <Col xs={6} md={4} lg={2} key={q.to}>
                        <Link
                          to={q.to}
                          className="admin-btn admin-btn-outline w-100 d-flex align-items-center justify-content-center gap-2 py-3 text-decoration-none"
                        >
                          <span>{q.label}</span>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            </Col>
            <Col lg={12}>
              <div className="admin-card">
                <div className="admin-card-header">
                  <h4>
                    Khuyến mãi tại rạp
                  </h4>
                </div>
                <div className="admin-card-body">
                  <p className="text-muted mb-0">
                    Đang có <strong>{stats.promoCount}</strong> nhóm khuyến mãi đang hoạt động.
                    <Link to="/admin/promotions" className="ms-2">
                      Quản lý →
                    </Link>
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </AdminPanelPage>
  );
};

export default AdminDashboard;
