import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Breadcrumb } from 'react-bootstrap';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';

const AddRoom = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [newRoom, setNewRoom] = useState({
    roomId: '',
    name: '',
    totalSeats: '300', // Mặc định 300 ghế
    status: 'Hoạt động' // Mặc định chọn Hoạt động
  });

  const validate = () => {
    const newErrors = {};
    if (!newRoom.roomId.trim()) newErrors.roomId = 'Mã phòng chiếu không được để trống';
    if (!newRoom.name.trim()) newErrors.name = 'Tên phòng chiếu không được để trống';
    if (!newRoom.totalSeats || parseInt(newRoom.totalSeats) <= 0) {
      newErrors.totalSeats = 'Số lượng ghế phải lớn hơn 0';
    } else if (parseInt(newRoom.totalSeats) > 300) {
      newErrors.totalSeats = 'Số lượng ghế tối đa là 300';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    console.log('Saving room and generating seats:', newRoom);
    // Chuyển hướng qua trang quản lý ghế sau khi tạo phòng
    navigate('/admin/seats', { state: { roomInfo: newRoom } });
  };

  return (
    <div className="add-room-page text-dark">
      <style>{`
        .custom-input {
          border-radius: 12px;
          padding: 12px 15px;
          border: 1px solid #eee;
          background: #fcfcfc;
          color: #000 !important;
        }
        .custom-input:focus {
          color: #000 !important;
          background: #fff;
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.05);
        }
        .form-label {
          font-weight: 700;
          font-size: 0.85rem;
          color: #495057;
          text-transform: uppercase;
        }
        .card-form {
          border-radius: 20px;
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        /* Custom Radio Style */
        .status-selection {
          display: flex;
          gap: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #eee;
        }
        .radio-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .radio-item input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .radio-item label {
          cursor: pointer;
          margin-bottom: 0;
          font-weight: 600;
        }
      `}</style>

      <div className="mb-4">
        <Breadcrumb className="small mb-2">
          <Breadcrumb.Item onClick={() => navigate('/admin/rooms')} style={{ cursor: 'pointer' }}>Quản lý phòng chiếu</Breadcrumb.Item>
          <Breadcrumb.Item active>Thêm phòng chiếu mới</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="rounded-circle p-2 shadow-sm border" onClick={() => navigate('/admin/rooms')}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="fw-bold mb-0">Thêm phòng chiếu mới</h2>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-form overflow-hidden">
            <div className="bg-primary p-1"></div>
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit} noValidate>
                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Mã phòng chiếu (Room ID)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="VD: R001" 
                        className={`custom-input ${errors.roomId ? 'is-invalid' : ''}`}
                        value={newRoom.roomId}
                        onChange={(e) => {
                            setNewRoom({...newRoom, roomId: e.target.value});
                            if (errors.roomId) setErrors({...errors, roomId: null});
                        }}
                      />
                      {errors.roomId && <div className="text-danger small mt-1 d-flex align-items-center gap-1"><AlertCircle size={14}/> {errors.roomId}</div>}
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tên phòng chiếu</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="VD: Phòng chiếu 01" 
                        className={`custom-input ${errors.name ? 'is-invalid' : ''}`}
                        value={newRoom.name}
                        onChange={(e) => {
                            setNewRoom({...newRoom, name: e.target.value});
                            if (errors.name) setErrors({...errors, name: null});
                        }}
                      />
                      {errors.name && <div className="text-danger small mt-1 d-flex align-items-center gap-1"><AlertCircle size={14}/> {errors.name}</div>}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Tổng số lượng ghế</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="VD: 300" 
                        className={`custom-input ${errors.totalSeats ? 'is-invalid' : ''}`}
                        value={newRoom.totalSeats}
                        onChange={(e) => {
                            setNewRoom({...newRoom, totalSeats: e.target.value});
                            if (errors.totalSeats) setErrors({...errors, totalSeats: null});
                        }}
                      />
                      {errors.totalSeats ? (
                        <div className="text-danger small mt-1 d-flex align-items-center gap-1"><AlertCircle size={14}/> {errors.totalSeats}</div>
                      ) : null}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Trạng thái hoạt động</Form.Label>
                      <div className="status-selection">
                        <div className="radio-item">
                          <input 
                            type="radio" 
                            id="active-radio" 
                            name="roomStatus" 
                            value="Hoạt động"
                            checked={newRoom.status === 'Hoạt động'}
                            onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
                          />
                          <label htmlFor="active-radio" className="text-success">Đang hoạt động</label>
                        </div>
                        <div className="radio-item">
                          <input 
                            type="radio" 
                            id="maintenance-radio" 
                            name="roomStatus" 
                            value="Bảo trì"
                            checked={newRoom.status === 'Bảo trì'}
                            onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
                          />
                          <label htmlFor="maintenance-radio" className="text-danger">Đang bảo trì</label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="pt-3">
                    <hr className="my-4 opacity-50" />
                    <div className="d-flex justify-content-end gap-3">
                      <Button variant="light" className="px-4 py-2 rounded-3 fw-bold border" onClick={() => navigate('/admin/rooms')}>
                        <X size={18} className="me-2" /> Hủy bỏ
                      </Button>
                      <Button type="submit" variant="primary" className="px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center">
                        <Save size={18} className="me-2" /> Lưu phòng chiếu
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddRoom;
