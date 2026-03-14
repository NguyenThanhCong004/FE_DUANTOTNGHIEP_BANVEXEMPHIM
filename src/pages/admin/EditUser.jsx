import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Badge } from 'react-bootstrap';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - In real app, fetch user by id
  const [user, setUser] = useState({
    id: id,
    name: 'Nguyễn Văn Nam',
    email: 'namnv@gmail.com',
    phone: '0912345678',
    birthDate: '1998-05-15',
    rank: 'Bạch kim',
    points: 1250,
    totalSpent: '15,500,000', // Thêm tổng chi tiêu
    joinDate: '10/01/2024',
    status: 'Hoạt động',
    avatar: 'https://ui-avatars.com/api/?name=Nam&background=random&color=fff'
  });

  const handleStatusChange = (e) => {
    setUser({ ...user, status: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updating user status:', user.status);
    navigate('/admin/users');
  };

  return (
    <div className="edit-user-page text-dark">
      <style>
        {`
          .edit-user-page h2, .edit-user-page h4, .edit-user-page h5,
          .edit-user-page span, .edit-user-page div, .edit-user-page label {
            color: #212529 !important;
          }
          .edit-user-page .text-muted { color: #6c757d !important; }
          .black-input {
            border: 1px solid rgba(0,0,0,0.1) !important;
            color: #000 !important;
            font-weight: 600 !important;
            background-color: #fff !important;
            border-radius: 10px !important;
          }
          .info-box {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(0,0,0,0.05);
          }
        `}
      </style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate('/admin/users')}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Quản Lý Tài Khoản Người Dùng</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '25px' }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="align-items-center">
              {/* Cột trái: Ảnh và Thông tin cơ bản */}
              <Col lg={4} className="text-center border-end">
                <div className="mb-4">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="rounded-circle shadow mb-3"
                    style={{ width: '160px', height: '160px', objectFit: 'cover', border: '5px solid #f0f2f5' }}
                  />
                  <h3 className="fw-bold mb-1">{user.name}</h3>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    <Badge bg="primary" className="rounded-pill px-3 py-2">Hạng: {user.rank}</Badge>
                    <Badge bg={user.status === 'Hoạt động' ? 'success' : 'danger'} className="rounded-pill px-3 py-2">
                      {user.status === 'Hoạt động' ? 'Đang hoạt động' : 'Đã khóa'}
                    </Badge>
                  </div>
                </div>

                <div className="info-box mx-2 mb-3 shadow-sm">
                  <div className="text-muted small fw-bold text-uppercase mb-1">Tổng chi tiêu</div>
                  <h4 className="text-primary fw-bold mb-0">{user.totalSpent} VNĐ</h4>
                </div>

                <div className="info-box mx-2 shadow-sm" style={{ background: '#fff9e6' }}>
                  <div className="text-muted small fw-bold text-uppercase mb-1">Điểm tích lũy</div>
                  <h4 className="text-warning fw-bold mb-0">{user.points} điểm</h4>
                </div>
              </Col>

              {/* Cột phải: Thông tin chi tiết & Thao tác */}
              <Col lg={8} className="ps-lg-5 mt-4 mt-lg-0">
                <div className="mb-5">
                  <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin liên lạc</h5>
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light p-2 rounded-circle text-primary"><i className="fas fa-envelope"></i></div>
                        <div>
                          <small className="text-muted d-block fw-bold">EMAIL</small>
                          <span className="fw-semibold text-dark">{user.email}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light p-2 rounded-circle text-success"><i className="fas fa-phone"></i></div>
                        <div>
                          <small className="text-muted d-block fw-bold">SỐ ĐIỆN THOẠI</small>
                          <span className="fw-semibold text-dark">{user.phone}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <span className="bg-danger p-2 rounded-3 me-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                    <i className="fas fa-user-lock text-white small"></i>
                  </span>
                  Thiết lập trạng thái tài khoản
                </h5>
                <div className="p-4 rounded-4 border bg-light mb-4">
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark mb-3">Trạng thái quyền truy cập</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check 
                        type="radio"
                        label="Cho phép hoạt động"
                        name="userStatus"
                        id="statusActive"
                        value="Hoạt động"
                        checked={user.status === 'Hoạt động'}
                        onChange={handleStatusChange}
                        className="fw-semibold"
                      />
                      <Form.Check 
                        type="radio"
                        label="Khóa tài khoản"
                        name="userStatus"
                        id="statusLocked"
                        value="Khóa"
                        checked={user.status === 'Khóa'}
                        onChange={handleStatusChange}
                        className="fw-semibold text-danger"
                      />
                    </div>
                    <hr />
                    <p className="text-muted small mb-0">
                      * Lưu ý: Khi tài khoản bị <strong>Khóa</strong>, người dùng này sẽ bị đăng xuất ngay lập tức và không thể thực hiện bất kỳ giao dịch nào cho đến khi được mở lại.
                    </p>
                  </Form.Group>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-4">
                  <Button 
                    variant="light" 
                    className="px-4 fw-bold text-secondary" 
                    onClick={() => navigate('/admin/users')}
                    style={{ borderRadius: '12px' }}
                  >
                    Quay lại
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="px-5 fw-bold shadow border-0"
                    style={{ borderRadius: '12px', background: '#0d6efd' }}
                  >
                    Xác nhận thay đổi
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );};

export default EditUser;