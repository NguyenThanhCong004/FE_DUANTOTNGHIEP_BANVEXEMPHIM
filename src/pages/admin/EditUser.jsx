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
          <i className="bi bi-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Cập nhật thông tin khách hàng</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: 18 }}>
        <Form onSubmit={submit}>
          <Row className="g-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">HỌ VÀ TÊN</Form.Label>
                <Form.Control
                  type="text"
                  value={user.fullname}
                  onChange={(e) => setUser({ ...user, fullname: e.target.value })}
                  placeholder="Nhập họ và tên"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">EMAIL</Form.Label>
                <Form.Control
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="Nhập email"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">SỐ ĐIỆN THOẠI</Form.Label>
                <Form.Control
                  type="text"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">NGÀY SINH</Form.Label>
                <Form.Control
                  type="date"
                  value={user.birthday ? user.birthday.split('T')[0] : ""}
                  onChange={(e) => setUser({ ...user, birthday: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">ĐIỂM TÍCH LŨY</Form.Label>
                <Form.Control
                  type="number"
                  value={user.points}
                  onChange={(e) => setUser({ ...user, points: Number(e.target.value) })}
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Label className="small fw-bold text-muted">TRẠNG THÁI TÀI KHOẢN</Form.Label>
              <div className="d-flex gap-4 mt-1">
                <Form.Check
                  type="radio"
                  id="status-active"
                  name="status"
                  label="Hoạt động"
                  checked={Number(user.status) === 1}
                  onChange={() => setUser((prev) => ({ ...prev, status: 1 }))}
                />
                <Form.Check
                  type="radio"
                  id="status-locked"
                  name="status"
                  label="Khóa"
                  checked={Number(user.status) === 0}
                  onChange={() => setUser((prev) => ({ ...prev, status: 0 }))}
                />
              </div>
            </Col>
          </Row>

          {err && <div className="text-danger mt-3 small fw-bold">{err}</div>}

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" className="px-4" style={{ borderRadius: 10 }} onClick={() => navigate(`${prefix}/users`)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="px-4" style={{ borderRadius: 10 }}>
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

