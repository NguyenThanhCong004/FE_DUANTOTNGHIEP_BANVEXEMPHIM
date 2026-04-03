import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Row, Col, Card, Badge } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { STAFF } from "../../constants/apiEndpoints";

export default function ViewStaff() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const backPath = isSuperAdmin ? "/super-admin/staff" : "/admin/staff";

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatBirthday = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const statusLabel = useMemo(() => {
    if (!staff) return "";
    return staff.status === 0 ? "Khóa" : "Hoạt động";
  }, [staff]);

  const getStatusBadgeVariant = (status) => {
    const isActive = status === 1 || status === "Hoạt động";
    return isActive ? "success" : "danger";
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(STAFF.BY_ID(id));
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !data) {
          setStaff(null);
          setLoading(false);
          return;
        }
        setStaff({
          staffId: data.staffId,
          fullname: data.fullname,
          username: data.username,
          email: data.email,
          phone: data.phone,
          status: data.status,
          role: data.role,
          birthday: data.birthday,
          avatar: data.avatar,
          cinemaId: data.cinemaId,
        });
      } catch {
        if (mounted) setStaff(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="view-staff-page text-dark">
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="view-staff-page text-dark">
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          Không có dữ liệu nhân viên.
        </div>
      </div>
    );
  }

  return (
    <div className="view-staff-page text-dark">
      <style>{`
        .view-staff-page h2,
        .view-staff-page h4,
        .view-staff-page h5,
        .view-staff-page span,
        .view-staff-page div,
        .view-staff-page label {
          color: #212529 !important;
        }
        .view-staff-page .text-muted {
          color: #6c757d !important;
        }
      `}</style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate(backPath)}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Chi Tiết Nhân Viên</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
        <Card.Body>
          <Row>
            <Col lg={4} className="text-center mb-4">
              <img
                src={staff.avatar || "https://via.placeholder.com/180"}
                alt={staff.fullname ?? staff.email ?? "Staff"}
                className="rounded-circle shadow-sm mb-3"
                style={{ width: "180px", height: "180px", objectFit: "cover", border: "5px solid #f8f9fa" }}
              />
              <h4 className="fw-bold mb-1">{staff.fullname ?? "-"}</h4>
              <p className="text-muted mb-3">Ngày sinh: {formatBirthday(staff.birthday)}</p>
              <div className="d-flex justify-content-center gap-2">
                <Badge bg={getStatusBadgeVariant(staff.status)} className="rounded-pill px-3 py-2">
                  {statusLabel}
                </Badge>
              </div>
            </Col>

            <Col lg={8}>
              <div className="bg-light p-4 rounded-4 shadow-sm">
                <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin tài khoản</h5>
                <Row className="g-4">
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Mã nhân viên</label>
                    <div className="fw-bold">#{staff.staffId}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Vai trò</label>
                    <div className="fw-bold">{staff.role ?? "-"}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Username</label>
                    <div className="fw-bold">{staff.username ?? "-"}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Email</label>
                    <div className="fw-bold">{staff.email ?? "-"}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Số điện thoại</label>
                    <div className="fw-bold">{staff.phone ?? "-"}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Trạng thái</label>
                    <div className="fw-bold">{statusLabel}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Mã rạp</label>
                    <div className="fw-bold">{staff.cinemaId ?? "—"}</div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}