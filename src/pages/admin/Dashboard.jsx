import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Spinner } from "react-bootstrap";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
import { apiFetch } from "../../utils/apiClient";
import {
  SHOWTIMES,
  ROOMS,
  STAFF,
  PROMOTIONS,
  ORDERS_ONLINE,
  CINEMAS,
} from "../../constants/apiEndpoints";

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "0";
  return Number(v).toLocaleString("vi-VN");
}

const AdminDashboard = () => {
  const staffSession = getStoredStaff();
  const { selectedCinemaId, selectedCinemaName, setSelectedCinemaId } = useSuperAdminCinema();

  const effectiveCinemaId = staffSession?.cinemaId ?? selectedCinemaId ?? null;

  useEffect(() => {
    const cid = staffSession?.cinemaId;
    if (cid == null) return;
    if (selectedCinemaId !== cid) setSelectedCinemaId(cid);
  }, [staffSession?.cinemaId, selectedCinemaId, setSelectedCinemaId]);

  const [loading, setLoading] = useState(true);
  const [cinemaLabel, setCinemaLabel] = useState("");
  const [stats, setStats] = useState({
    revenueToday: 0,
    showtimeCount: 0,
    showtimeUpcoming: 0,
    roomCount: 0,
    staffCount: 0,
    promoCount: 0,
    ordersToday: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!effectiveCinemaId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const today0 = new Date();
        today0.setHours(0, 0, 0, 0);
        const tonight = new Date();
        tonight.setHours(23, 59, 59, 999);

        // Fetch song song các dữ liệu cần thiết của rạp
        const [ordersRes, stRes, rmRes, sfRes, cRes, prRes] = await Promise.all([
          apiFetch(ORDERS_ONLINE.LIST),
          apiFetch(`${SHOWTIMES.LIST}?cinemaId=${effectiveCinemaId}`),
          apiFetch(`${ROOMS.LIST}?cinemaId=${effectiveCinemaId}`),
          apiFetch(STAFF.LIST),
          apiFetch(CINEMAS.BY_ID(effectiveCinemaId)),
          apiFetch(`${PROMOTIONS.LIST}?cinemaId=${effectiveCinemaId}`),
        ]);

        // 1. Xử lý Đơn hàng & Doanh thu
        const ordersJson = await ordersRes.json().catch(() => null);
        const allOrders = Array.isArray(ordersJson?.data) ? ordersJson.data : [];
        
        let revenueToday = 0;
        let ordersToday = 0;
        
        allOrders.forEach(o => {
          const isOurCinema = o.cinemaId ? Number(o.cinemaId) === Number(effectiveCinemaId) : true; 
          const isSuccess = o.status === 1; 
          const created = o.createdAt ? new Date(o.createdAt) : null;
          const isToday = created && created >= today0 && created <= tonight;

          if (isOurCinema && isSuccess && isToday) {
            ordersToday += 1;
            revenueToday += Number(o.finalAmount) || 0;
          }
        });

        // 2. Xử lý Suất chiếu (Chỉ tính suất chiếu của ngày hôm nay)
        const stJson = await stRes.json().catch(() => null);
        const allSlots = Array.isArray(stJson?.data) ? stJson.data : [];
        
        const slotsToday = allSlots.filter(s => {
          const stDate = s.date ? new Date(s.date) : null;
          if (!stDate) return false;
          stDate.setHours(0,0,0,0);
          return stDate.getTime() === today0.getTime();
        });

        const showtimeCount = slotsToday.length;
        const showtimeUpcoming = slotsToday.filter((s) => {
          // Giả định có trường time (HH:mm) để so sánh nếu cần chi tiết hơn
          return true; // Tạm thời tính tất cả suất trong ngày hôm nay là upcoming/đang diễn ra
        }).length;

        // 3. Xử lý Phòng chiếu
        const rmJson = await rmRes.json().catch(() => null);
        const rooms = Array.isArray(rmJson?.data) ? rmJson.data : [];
        const roomCount = rooms.length;

        // 4. Xử lý Nhân viên
        const sfJson = await sfRes.json().catch(() => null);
        const staffList = Array.isArray(sfJson?.data) ? sfJson.data : [];
        const staffCount = staffList.filter(
          (s) => Number(s.cinemaId) === Number(effectiveCinemaId)
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
  }, [effectiveCinemaId]);

  const statCards = useMemo(
    () => [
      {
        title: "Doanh thu hôm nay",
        value: formatMoney(stats.revenueToday),
        subtitle: "VNĐ · đơn hoàn thành",
        icon: "bi-cash-stack",
        color: "#10b981",
        hint: `${stats.ordersToday} đơn trong ngày`,
      },
      {
        title: "Suất chiếu",
        value: String(stats.showtimeCount),
        subtitle: "tại rạp",
        icon: "bi-calendar-check",
        color: "#8b5cf6",
        hint:
          effectiveCinemaId == null
            ? "Chọn rạp để xem"
            : `${stats.showtimeUpcoming} suất sắp/đang diễn ra`,
      },
      {
        title: "Phòng chiếu",
        value: String(stats.roomCount),
        subtitle: "phòng",
        icon: "bi-door-open",
        color: "#3b82f6",
        hint: effectiveCinemaId == null ? "—" : "Theo rạp hiện tại",
      },
      {
        title: "Nhân viên rạp",
        value: String(stats.staffCount),
        subtitle: "người",
        icon: "bi-people",
        color: "#f59e0b",
        hint: effectiveCinemaId == null ? "—" : "Được gán cinemaId",
      },
    ],
    [stats, effectiveCinemaId]
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
        {effectiveCinemaId != null
          ? cinemaLabel || `Rạp #${effectiveCinemaId}`
          : "Chưa có rạp — chọn rạp ở sidebar (nếu có) hoặc liên hệ Super Admin gán rạp."}
      </p>
      <p className="small text-white-50 mb-0">
        Doanh thu/ngày tính trên <strong>tất cả đơn online hoàn thành</strong> (BE chưa gắn cinema cho đơn).
      </p>
    </>
  );

  return (
    <AdminPanelPage icon="speedometer2" title="Bảng điều khiển" description={headerDescription}>
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
                  <i className={`bi ${stat.icon}`}></i>
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
                    <i className="bi bi-lightning-charge me-2 text-warning"></i>
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
                          <i className={`bi ${q.icon}`}></i>
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
                    <i className="bi bi-tags me-2 text-info"></i>
                    Khuyến mãi tại rạp
                  </h4>
                </div>
                <div className="admin-card-body">
                  <p className="text-muted mb-0">
                    Đang có <strong>{stats.promoCount}</strong> nhóm khuyến mãi
                    {effectiveCinemaId != null ? "" : " (chọn rạp để đếm)"}.
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
