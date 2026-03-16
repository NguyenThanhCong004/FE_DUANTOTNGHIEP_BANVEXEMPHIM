import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const user = {
    id: id,
    name: 'Nguyễn Văn Nam',
    email: 'namnv@gmail.com',
    phone: '0912345678',
    birthDate: '15/05/1998',
    rank: 'Bạch kim',
    points: 1250,
    joinDate: '10/01/2024',
    status: 'Hoạt động',
    avatar: 'https://ui-avatars.com/api/?name=Nam&background=random&color=fff'
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 'Kim cương': return 'info';
      case 'Bạch kim': return 'primary';
      case 'Vàng': return 'warning';
      case 'Bạc': return 'secondary';
      default: return 'dark';
    }
  };

  return (
    <div className="view-user-page text-dark">
      <style>
        {`
          .view-user-page h2, 
          .view-user-page h4, 
          .view-user-page h5,
          .view-user-page span,
          .view-user-page div,
          .view-user-page label {
            color: #212529 !important;
          }
          .view-user-page .text-muted {
            color: #6c757d !important;
          }
        `}
      </style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate('/admin/users')}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Chi Tiết Người Dùng</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
        <Card.Body>
          <Row>
            <Col lg={4} className="text-center mb-4">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="rounded-circle shadow-sm mb-3"
                style={{ width: '180px', height: '180px', objectFit: 'cover', border: '5px solid #f8f9fa' }}
              />
              <h4 className="fw-bold mb-1">{user.name}</h4>
              <p className="text-muted mb-3">Thành viên từ: {user.joinDate}</p>
              <div className="d-flex justify-content-center gap-2">
                <Badge bg={getRankColor(user.rank)} className="rounded-pill px-3 py-2">
                  <i className="fas fa-crown me-1"></i> {user.rank}
                </Badge>
                <Badge bg={user.status === 'Hoạt động' ? 'success' : 'danger'} className="rounded-pill px-3 py-2">
                  {user.status}
                </Badge>
              </div>
            </Col>

            <Col lg={8}>
              <div className="bg-light p-4 rounded-4 shadow-sm">
                <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin tài khoản</h5>
                <Row className="g-4">
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Mã khách hàng</label>
                    <div className="fw-bold">#{user.id}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Họ và tên</label>
                    <div className="fw-bold">{user.name}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Email</label>
                    <div className="fw-bold">{user.email}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Số điện thoại</label>
                    <div className="fw-bold">{user.phone}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Ngày sinh</label>
                    <div className="fw-bold">{user.birthDate}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Điểm tích lũy</label>
                    <div className="fw-bold text-primary">{user.points} điểm</div>
                  </Col>
                </Row>
              </div>

              <div className="mt-4 p-3 border rounded-4 bg-white">
                <p className="text-muted small mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Quản trị viên chỉ có quyền xem thông tin người dùng. Mọi thay đổi về tài khoản phải do chính người dùng thực hiện hoặc thông qua bộ phận hỗ trợ kỹ thuật.
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ViewUser;