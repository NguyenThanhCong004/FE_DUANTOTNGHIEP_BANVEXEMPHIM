import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await apiFetch(USERS.BY_ID(id));
        const json = await res.json().catch(() => null);
        const found = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !found) {
          setUser(null);
          setErr(json?.message || "Không tải được người dùng");
          return;
        }
        setUser({
          userId: found.userId,
          fullname: found.fullname ?? "",
          email: found.email ?? "",
          phone: found.phone ?? "",
          birthday: found.birthday ?? "",
          status: found.status ?? 1,
          points: found.points ?? 0,
          avatar: found.avatar || "https://via.placeholder.com/160",
          username: found.username ?? "",
          totalSpending: found.totalSpending ?? 0,
        });
      } catch {
        if (mounted) {
          setUser(null);
          setErr("Lỗi kết nối");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="text-dark fw-bold py-5">Đang tải...</div>;
  }
  if (!user) {
    return <div className="text-dark fw-bold">{err || "Không tìm thấy khách hàng."}</div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const body = {
        userId: user.userId,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        status: Number(user.status),
        birthday: user.birthday,
        avatar: user.avatar,
        points: user.points,
        totalSpending: user.totalSpending ?? 0,
      };
      const res = await apiFetch(USERS.BY_ID(user.userId), {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(json?.message || "Cập nhật thất bại");
        return;
      }
      navigate(`${prefix}/users`);
    } catch {
      setErr("Không thể kết nối server");
    }
  };

  return (
    <div className="text-dark">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate(`${prefix}/users`)}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Cap nhat trang thai khach hang</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: 18 }}>
        <Form onSubmit={submit}>
          <Row className="g-4">
            <Col md={6}>
              <div className="small text-muted fw-bold">HO VA TEN</div>
              <div className="fw-semibold">{user.fullname}</div>
            </Col>
            <Col md={6}>
              <div className="small text-muted fw-bold">EMAIL</div>
              <div className="fw-semibold">{user.email || "-"}</div>
            </Col>
            <Col md={6}>
              <div className="small text-muted fw-bold">SO DIEN THOAI</div>
              <div className="fw-semibold">{user.phone || "-"}</div>
            </Col>
            <Col md={6}>
              <div className="small text-muted fw-bold">DIEM</div>
              <div className="fw-semibold">{user.points} diem</div>
            </Col>
            <Col md={12}>
              <Form.Label className="fw-bold">Trang thai tai khoan</Form.Label>
              <div className="d-flex gap-4">
                <Form.Check
                  type="radio"
                  name="status"
                  label="Hoat dong"
                  checked={Number(user.status) === 1}
                  onChange={() => setUser((prev) => ({ ...prev, status: 1 }))}
                />
                <Form.Check
                  type="radio"
                  name="status"
                  label="Khoa"
                  checked={Number(user.status) === 0}
                  onChange={() => setUser((prev) => ({ ...prev, status: 0 }))}
                />
              </div>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={() => navigate(`${prefix}/users`)}>Huy</Button>
            <Button type="submit">Luu trang thai</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

