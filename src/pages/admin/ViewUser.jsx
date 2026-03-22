import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";

export default function ViewUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(USERS.BY_ID(id));
        const json = await res.json().catch(() => null);
        const found = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !found) {
          setUser(null);
          return;
        }
        setUser({
          userId: found.userId,
          fullname: found.fullname ?? "",
          email: found.email ?? "",
          phone: found.phone ?? "",
          birthday: found.birthday ?? "",
          points: found.points ?? 0,
          status: found.status ?? 1,
          avatar: found.avatar || "https://via.placeholder.com/160",
        });
      } catch {
        if (mounted) setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!user) return <div className="text-dark fw-bold">Không tìm thấy thông tin khách hàng.</div>;

  return (
    <div className="text-dark">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate(`${prefix}/users`)}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Chi tiet khach hang</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: 18 }}>
        <Row className="g-4">
          <Col lg={4} className="text-center">
            <img src={user.avatar} alt={user.fullname} className="rounded-circle" style={{ width: 150, height: 150, objectFit: "cover" }} />
            <h5 className="fw-bold mt-3">{user.fullname}</h5>
            <Badge bg={Number(user.status) === 1 ? "success" : "danger"}>{Number(user.status) === 1 ? "Hoat dong" : "Khoa"}</Badge>
          </Col>
          <Col lg={8}>
            <Row className="g-3">
              <Col md={6}><div className="small text-muted fw-bold">MA KHACH HANG</div><div className="fw-semibold">#{user.userId}</div></Col>
              <Col md={6}><div className="small text-muted fw-bold">EMAIL</div><div className="fw-semibold">{user.email || "-"}</div></Col>
              <Col md={6}><div className="small text-muted fw-bold">SO DIEN THOAI</div><div className="fw-semibold">{user.phone || "-"}</div></Col>
              <Col md={6}><div className="small text-muted fw-bold">NGAY SINH</div><div className="fw-semibold">{user.birthday || "-"}</div></Col>
              <Col md={6}><div className="small text-muted fw-bold">DIEM TICH LUY</div><div className="fw-semibold">{user.points} diem</div></Col>
            </Row>
            <div className="mt-4">
              <small className="text-muted">
                Thong tin ten dang nhap va mat khau khong hien thi trong man hinh chi tiet.
              </small>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

