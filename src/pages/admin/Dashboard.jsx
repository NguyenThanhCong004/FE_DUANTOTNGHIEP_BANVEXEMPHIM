import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
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
import "../../styles/admin-design-system.css";

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
      setLoading(true);
      const empty = {
        revenueToday: 0,
        showtimeCount: 0,
        showtimeUpcoming: 0,
        roomCount: 0,
        staffCount: 0,
        promoCount: 0,
        ordersToday: 0,
      };
      try {
        const today0 = new Date();
        today0.setHours(0, 0, 0, 0);

        const ordersRes = await apiFetch(ORDERS_ONLINE.LIST);
        const ordersJson = await ordersRes.json().catch(() => null);
        const orders = Array.isArray(ordersJson?.data) ? ordersJson.data : [];

        let revenueToday = 0;
        let ordersToday = 0;
        for (const o of orders) {
          const st = o.status;
          if (st === 0 || st === 2) continue;
          const created = o.createdAt ? new Date(o.createdAt) : null;
          if (!created || Number.isNaN(created.getTime())) continue;
          if (created >= today0) {
            ordersToday += 1;
            revenueToday += Number(o.finalAmount) || 0;
          }
        }

        let showtimeCount = 0;
        let showtimeUpcoming = 0;
        let roomCount = 0;
        let staffCount = 0;
        let promoCount = 0;
        let label = selectedCinemaName || "";

        if (effectiveCinemaId != null) {
          const [stRes, rmRes, sfRes, prRes, cRes] = await Promise.all([
            apiFetch(`${SHOWTIMES.LIST}?cinemaId=${effectiveCinemaId}`),
            apiFetch(`${ROOMS.LIST}?cinemaId=${effectiveCinemaId}`),
            apiFetch(STAFF.LIST),
            apiFetch(`${PROMOTIONS.LIST}?cinemaId=${effectiveCinemaId}`),
            apiFetch(CINEMAS.BY_ID(effectiveCinemaId)),
          ]);

          const stJson = await stRes.json().catch(() => null);
          const slots = Array.isArray(stJson?.data) ? stJson.data : [];
          showtimeCount = slots.length;
          showtimeUpcoming = slots.filter((s) => {
            const t = String(s.status || "");
            return t.includes("Sắp") || t.includes("Đang");
          }).length;

          const rmJson = await rmRes.json().catch(() => null);
          const rooms = Array.isArray(rmJson?.data) ? rmJson.data : [];
          roomCount = rooms.length;

          const sfJson = await sfRes.json().catch(() => null);
          const staffList = Array.isArray(sfJson?.data) ? sfJson.data : [];
          staffCount = staffList.filter(
            (s) => Number(s.cinemaId) === Number(effectiveCinemaId)
          ).length;

          const prJson = await prRes.json().catch(() => null);
          const promos = Array.isArray(prJson?.data) ? prJson.data : [];
          promoCount = promos.length;

          const cJson = await cRes.json().catch(() => null);
          const cdata = cJson?.data ?? cJson;
          if (cdata?.name) label = cdata.name;
        }

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
      } catch {
        if (!mounted) return;
        setStats(empty);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveCinemaId, selectedCinemaName]);

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

  return (
    <div className="admin-page admin-dashboard admin-fade-in">
      <Container fluid>
        <div className="admin-header">
          <div className="admin-header-content">
            <div>
              <h1>
                <i className="bi bi-speedometer2 me-3"></i>
                Bảng điều khiển
              </h1>
              <p className="lead mb-1">
                {effectiveCinemaId != null
                  ? cinemaLabel || `Rạp #${effectiveCinemaId}`
                  : "Chưa có rạp — chọn rạp ở sidebar (nếu có) hoặc liên hệ Super Admin gán rạp."}
              </p>
              <p className="small text-white-50 mb-0">
                Doanh thu/ngày tính trên <strong>tất cả đơn online hoàn thành</strong> (BE chưa gắn cinema cho
                đơn).
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="light" />
            <p className="text-white-50 mt-2 small">Đang tải số liệu…</p>
          </div>
        ) : (
          <>
            <div className="admin-stats-grid">
              {statCards.map((stat, index) => (
                <Card
                  key={index}
                  className="admin-stat-card h-100"
                  style={{ "--stat-color": stat.color, "--icon-bg": `${stat.color}15` }}
                >
                  <div className="admin-stat-icon">
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <div className="admin-stat-value">{stat.value}</div>
                  <div className="admin-stat-label">{stat.subtitle}</div>
                  <div className="fw-semibold small mt-2" style={{ opacity: 0.95 }}>
                    {stat.title}
                  </div>
                  <div className="small text-white-50 mt-1 opacity-75">{stat.hint}</div>
                </Card>
              ))}
            </div>

            <Row className="g-4 mt-1">
              <Col lg={12}>
                <Card className="admin-card admin-slide-up">
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
                            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                          >
                            <i className={`bi ${q.icon}`}></i>
                            <span>{q.label}</span>
                          </Link>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Card>
              </Col>
              <Col lg={12}>
                <Card className="admin-card">
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
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default AdminDashboard;
