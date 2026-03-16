import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { ArrowLeft, UserCheck, Calendar as CalendarIcon } from 'lucide-react';

const EditShift = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock dữ liệu nhân viên theo vai trò
  const staffByRole = {
    'Bán vé': [
      { id: 1, name: 'Nguyễn Văn A' },
      { id: 4, name: 'Phạm Minh D' }
    ],
    'Soát vé': [
      { id: 2, name: 'Trần Thị B' },
      { id: 5, name: 'Hoàng Thị E' }
    ],
    'Phục vụ': [
      { id: 3, name: 'Lê Văn C' },
      { id: 6, name: 'Ngô Văn F' }
    ]
  };

  const [formData, setFormData] = useState({
    date: '2026-03-14',
    shiftType: 'Ca 1',
    staff_banve: '1',
    staff_soatve: '2',
    staff_phucvu: '3',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Shifts updated:', formData);
    navigate('/admin/shifts');
  };

  const shiftTimes = {
    'Ca 1': '08:00 - 13:00',
    'Ca 2': '13:00 - 18:00',
    'Ca 3': '18:00 - 23:00'
  };

  return (
    <div className="edit-shift-page text-dark pb-5">
      <style>{`
        .shift-input {
          border-radius: 12px !important;
          border: 1.5px solid #eee !important;
          padding: 12px 15px !important;
          color: #000 !important;
        }
        .role-card {
          border-left: 4px solid #0d6efd;
          background: #f8faff;
        }
      `}</style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="light" className="rounded-circle p-2 shadow-sm" onClick={() => navigate('/admin/shifts')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="mb-0 fw-bold">Chỉnh sửa phân ca #{id}</h2>
          <p className="text-muted small mb-0">Cập nhật nhân sự cho các vị trí trong ca làm việc</p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm p-4 rounded-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                <CalendarIcon size={20} />
                <h5 className="fw-bold mb-0">Thông tin ca trực</h5>
              </div>
              
              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Ngày trực</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="date" 
                      className="shift-input"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Loại ca</Form.Label>
                    <Form.Select 
                      name="shiftType" 
                      className="shift-input"
                      value={formData.shiftType}
                      onChange={handleInputChange}
                    >
                      <option value="Ca 1">Ca 1 ({shiftTimes['Ca 1']})</option>
                      <option value="Ca 2">Ca 2 ({shiftTimes['Ca 2']})</option>
                      <option value="Ca 3">Ca 3 ({shiftTimes['Ca 3']})</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Card className="border-0 shadow-sm p-4 rounded-4">
              <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                <UserCheck size={20} />
                <h5 className="fw-bold mb-0">Điều chỉnh nhân sự</h5>
              </div>

              <Row className="g-4">
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100">
                    <Form.Label className="fw-bold text-primary mb-2">1. Nhân viên Bán vé</Form.Label>
                    <Form.Select 
                      name="staff_banve" 
                      className="shift-input bg-white"
                      value={formData.staff_banve}
                      onChange={handleInputChange}
                      required
                    >
                      {staffByRole['Bán vé'].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100" style={{ borderLeftColor: '#6610f2' }}>
                    <Form.Label className="fw-bold mb-2" style={{ color: '#6610f2' }}>2. Nhân viên Soát vé</Form.Label>
                    <Form.Select 
                      name="staff_soatve" 
                      className="shift-input bg-white"
                      value={formData.staff_soatve}
                      onChange={handleInputChange}
                      required
                    >
                      {staffByRole['Soát vé'].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100" style={{ borderLeftColor: '#fd7e14' }}>
                    <Form.Label className="fw-bold mb-2" style={{ color: '#fd7e14' }}>3. Nhân viên Phục vụ</Form.Label>
                    <Form.Select 
                      name="staff_phucvu" 
                      className="shift-input bg-white"
                      value={formData.staff_phucvu}
                      onChange={handleInputChange}
                      required
                    >
                      {staffByRole['Phục vụ'].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                  </div>
                </Col>
              </Row>

              <div className="mt-5 d-flex justify-content-end gap-3">
                <Button variant="light" className="px-4 fw-bold text-muted border-0" onClick={() => navigate('/admin/shifts')}>Hủy bỏ</Button>
                <Button type="submit" variant="primary" className="px-5 py-2 fw-bold shadow-sm rounded-3">Cập nhật ca trực</Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default EditShift;
