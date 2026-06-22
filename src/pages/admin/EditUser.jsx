import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
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
          setErr(apiMessage(json, "Không tải được người dùng"));
          return;
        }
        const nextUser = {
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
        };
        setUser(nextUser);
        setOriginalUser(nextUser);
      } catch {
        if (mounted) {
          setUser(null);
          setErr(MESSAGES.networkError);
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
      if (originalUser && Number(user.status) === Number(originalUser.status)) {
        setErr(MESSAGES.noChanges);
        return;
      }
      const res = await apiFetch(USERS.BY_ID(user.userId), {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(apiMessage(json, "Cập nhật thất bại"));
        return;
      }
      navigate(`${prefix}/users`);
    } catch {
      setErr(MESSAGES.networkError);
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
          <div className="alert alert-info py-2 px-3 small border-0 mb-4 shadow-xs">
            <i className="bi bi-info-circle-fill me-2"></i>
            Thông tin cá nhân của khách hàng chỉ được xem ở chế độ đọc. Bạn chỉ có quyền thay đổi trạng thái hoạt động của tài khoản.
          </div>

          <Row className="g-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Họ và tên</Form.Label>
                <Form.Control
                  type="text"
                  value={user.fullname}
                  readOnly
                  className="bg-light border-0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={user.email}
                  readOnly
                  className="bg-light border-0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  value={user.phone || "—"}
                  readOnly
                  className="bg-light border-0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Ngày sinh</Form.Label>
                <Form.Control
                  type="text"
                  value={user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : "—"}
                  readOnly
                  className="bg-light border-0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Điểm tích lũy</Form.Label>
                <Form.Control
                  type="text"
                  value={`${user.points} điểm`}
                  readOnly
                  className="bg-light border-0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Label className="small fw-bold text-muted text-uppercase">Trạng thái tài khoản</Form.Label>
              <div className="d-flex gap-4 mt-1 p-2 bg-light rounded shadow-xs" style={{ border: '1px solid #eee' }}>
                <Form.Check
                  type="radio"
                  id="status-active"
                  name="status"
                  label={<span className="fw-semibold text-success">Hoạt động</span>}
                  checked={Number(user.status) === 1}
                  onChange={() => {
                    setUser((prev) => ({ ...prev, status: 1 }));
                    if (err === MESSAGES.noChanges) setErr("");
                  }}
                />
                <Form.Check
                  type="radio"
                  id="status-locked"
                  name="status"
                  label={<span className="fw-semibold text-danger">Khóa tài khoản</span>}
                  checked={Number(user.status) === 0}
                  onChange={() => {
                    setUser((prev) => ({ ...prev, status: 0 }));
                    if (err === MESSAGES.noChanges) setErr("");
                  }}
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

