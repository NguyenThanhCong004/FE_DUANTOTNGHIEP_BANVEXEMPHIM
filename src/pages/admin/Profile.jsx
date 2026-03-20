import React, { useState } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { User, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

const AdminProfile = () => {
  const [adminInfo, setAdminInfo] = useState({
    name: 'Quản trị viên',
    email: 'admin@cinema.com',
    phone: '0988 777 666',
    birthDate: '1990-01-01',
    role: 'Quản trị viên hệ thống',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
  });

  return (
    <div className="admin-profile-page text-dark">
      <style>
        {`
          .admin-profile-page h2, 
          .admin-profile-page h4, 
          .admin-profile-page h5,
          .admin-profile-page span,
          .admin-profile-page div,
          .admin-profile-page label {
            color: #212529 !important;
          }
          .admin-profile-page .text-muted {
            color: #6c757d !important;
          }
          .admin-profile-page .text-primary {
            color: #0d6efd !important;
          }
          .admin-profile-page .form-control {
            color: #212529 !important;
            border: 1px solid #dee2e6 !important;
          }
        `}
      </style>
      <h2 className="fw-bold mb-4">Hồ sơ cá nhân</h2>
      
      <Row>
        <Col lg={4}>
          <Card className="border-0 shadow-sm text-center p-4 mb-4" style={{ borderRadius: '20px' }}>
            <div className="position-relative d-inline-block mx-auto mb-3">
              <img 
                src={adminInfo.avatar} 
                alt="Admin" 
                className="rounded-circle shadow-sm"
                style={{ width: '150px', height: '150px', objectFit: 'cover', border: '5px solid #f8f9fa' }}
              />
            </div>
            <h4 className="fw-bold">{adminInfo.name}</h4>
            <p className="text-primary fw-semibold">{adminInfo.role}</p>
            <hr className="my-4 opacity-50" />
            <div className="text-start">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-light p-2 rounded-circle"><Mail size={18} className="text-secondary" /></div>
                <div>
                  <small className="text-muted d-block">Email</small>
                  <span className="fw-bold">{adminInfo.email}</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 mb-0">
                <div className="bg-light p-2 rounded-circle"><Phone size={18} className="text-secondary" /></div>
                <div>
                  <small className="text-muted d-block">Số điện thoại</small>
                  <span className="fw-bold">{adminInfo.phone}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold mb-4">Thông tin chi tiết</h5>
            <Form>
              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">HỌ VÀ TÊN</Form.Label>
                    <Form.Control 
                      type="text" 
                      defaultValue={adminInfo.name}
                      className="bg-light border-0 py-2 fw-semibold"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ĐỊA CHỈ EMAIL</Form.Label>
                    <Form.Control 
                      type="email" 
                      defaultValue={adminInfo.email}
                      className="bg-light border-0 py-2 fw-semibold"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">SỐ ĐIỆN THOẠI</Form.Label>
                    <Form.Control 
                      type="text" 
                      defaultValue={adminInfo.phone}
                      className="bg-light border-0 py-2 fw-semibold"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">NGÀY SINH</Form.Label>
                    <Form.Control 
                      type="date" 
                      defaultValue={adminInfo.birthDate}
                      className="bg-light border-0 py-2 fw-semibold"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">VAI TRÒ HỆ THỐNG</Form.Label>
                    <div className="d-flex align-items-center gap-2 p-2 bg-primary bg-opacity-10 text-primary rounded fw-bold shadow-sm" style={{ width: 'fit-content' }}>
                      <ShieldCheck size={20} />
                      {adminInfo.role}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-5 d-flex justify-content-end">
                <Button variant="primary" className="px-5 py-2 fw-bold shadow-sm border-0" style={{ borderRadius: '10px' }}>
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile;