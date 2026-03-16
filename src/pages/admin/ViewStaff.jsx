import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const staff = {
    id: id,
    name: 'Nguyễn Văn A',
    email: 'vana@cinema.com',
    phone: '0901234567',
    birthDate: '20/05/1995',
    role: 'Quản lý',
    status: 'Hoạt động',
    image: 'https://via.placeholder.com/150'
  };

  return (
    <div className="view-staff-page">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate('/admin/staff')}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold">Chi Tiết Nhân Viên</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
        <Card.Body>
          <Row>
            <Col lg={4} className="text-center mb-4">
              <img 
                src={staff.image} 
                alt={staff.name} 
                className="rounded-circle shadow-sm mb-3"
                style={{ width: '180px', height: '180px', objectFit: 'cover', border: '5px solid #f8f9fa' }}
              />
              <h4 className="fw-bold mb-1">{staff.name}</h4>
              <p className="text-muted mb-3">{staff.role}</p>
              <Badge bg={staff.status === 'Hoạt động' ? 'success' : 'danger'} className="rounded-pill px-3 py-2">
                {staff.status}
              </Badge>
            </Col>

            <Col lg={8}>
              <div className="bg-light p-4 rounded-4">
                <Row className="g-4">
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Mã nhân viên</label>
                    <div className="fw-bold">#{staff.id}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Họ và tên</label>
                    <div className="fw-bold">{staff.name}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Email liên hệ</label>
                    <div className="fw-bold">{staff.email}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Số điện thoại</label>
                    <div className="fw-bold">{staff.phone}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Ngày sinh</label>
                    <div className="fw-bold">{staff.birthDate}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-secondary small fw-bold text-uppercase d-block mb-1">Vai trò</label>
                    <div className="fw-bold">{staff.role}</div>
                  </Col>
                </Row>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-5">
                <Button 
                  variant="primary" 
                  className="px-5 fw-bold shadow-sm border-0"
                  style={{ borderRadius: '10px' }}
                  onClick={() => navigate(`/admin/staff/edit/${id}`)}
                >
                  Chỉnh sửa ngay
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ViewStaff;