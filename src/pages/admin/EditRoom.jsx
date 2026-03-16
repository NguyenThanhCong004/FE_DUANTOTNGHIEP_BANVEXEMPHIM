import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Breadcrumb } from 'react-bootstrap';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';

const EditRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState({});
  const [room, setRoom] = useState({
    roomId: '',
    name: '',
    totalSeats: '',
    status: ''
  });

  // Giả lập lấy dữ liệu phòng từ ID
  useEffect(() => {
    const mockRooms = [
      { id: 1, roomId: 'R001', name: 'Phòng chiếu 01', status: 'Hoạt động', totalSeats: 200 },
      { id: 2, roomId: 'R002', name: 'Phòng chiếu 02', status: 'Hoạt động', totalSeats: 300 },
      { id: 3, roomId: 'R003', name: 'Phòng chiếu 03', status: 'Bảo trì', totalSeats: 100 },
      { id: 4, roomId: 'R004', name: 'Phòng chiếu VIP 01', status: 'Hoạt động', totalSeats: 150 },
      { id: 5, roomId: 'R005', name: 'Phòng chiếu IMAX', status: 'Hoạt động', totalSeats: 250 },
      { id: 6, roomId: 'R006', name: 'Phòng chiếu 06', status: 'Hoạt động', totalSeats: 240 },
    ];
    
    const foundRoom = mockRooms.find(r => r.id === parseInt(id));
    if (foundRoom) {
      setRoom({
        roomId: foundRoom.roomId,
        name: foundRoom.name,
        totalSeats: foundRoom.totalSeats.toString(),
        status: foundRoom.status
      });
    }
  }, [id]);

  const validate = () => {
    const newErrors = {};
    if (!room.roomId.trim()) newErrors.roomId = 'Mã phòng chiếu không được để trống';
    if (!room.name.trim()) newErrors.name = 'Tên phòng chiếu không được để trống';
    if (!room.totalSeats || parseInt(room.totalSeats) <= 0) {
      newErrors.totalSeats = 'Số lượng ghế phải lớn hơn 0';
    } else if (parseInt(room.totalSeats) > 300) {
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
    console.log('Updating room and generating seats:', room);
    // Chuyển hướng qua trang quản lý ghế sau khi sửa phòng, kèm theo ID để SeatManagement nhận diện
    navigate('/admin/seats', { state: { roomInfo: { ...room, id: parseInt(id) } } });
  };

  return (
    <div className="edit-room-page text-dark">
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
          border-color: #ffc107;
          box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.05);
        }
        .custom-input.is-invalid {
          border-color: #dc3545;
          background-color: #fff8f8;
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
          <Breadcrumb.Item active>Chỉnh sửa phòng chiếu</Breadcrumb.Item>
        </Breadcrumb>
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="rounded-circle p-2 shadow-sm border" onClick={() => navigate('/admin/rooms')}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="fw-bold mb-0">Chỉnh sửa: {room.name}</h2>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-form overflow-hidden">
            <div className="bg-warning p-1"></div>
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit} noValidate>
                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Mã phòng chiếu</Form.Label>
                      <Form.Control 
                        type="text" 
                        className={`custom-input ${errors.roomId ? 'is-invalid' : ''}`}
                        value={room.roomId}
                        onChange={(e) => {
                            setRoom({...room, roomId: e.target.value});
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
                        className={`custom-input ${errors.name ? 'is-invalid' : ''}`}
                        value={room.name}
                        onChange={(e) => {
                            setRoom({...room, name: e.target.value});
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
                        value={room.totalSeats}
                        onChange={(e) => {
                            setRoom({...room, totalSeats: e.target.value});
                            if (errors.totalSeats) setErrors({...errors, totalSeats: null});
                        }}
                      />
                      {errors.totalSeats && <div className="text-danger small mt-1 d-flex align-items-center gap-1"><AlertCircle size={14}/> {errors.totalSeats}</div>}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Trạng thái hoạt động</Form.Label>
                      <div className="status-selection">
                        <div className="radio-item">
                          <input 
                            type="radio" 
                            id="edit-active-radio" 
                            name="roomStatusEdit" 
                            value="Hoạt động"
                            checked={room.status === 'Hoạt động'}
                            onChange={(e) => setRoom({...room, status: e.target.value})}
                          />
                          <label htmlFor="edit-active-radio" className="text-success">Đang hoạt động</label>
                        </div>
                        <div className="radio-item">
                          <input 
                            type="radio" 
                            id="edit-maintenance-radio" 
                            name="roomStatusEdit" 
                            value="Bảo trì"
                            checked={room.status === 'Bảo trì'}
                            onChange={(e) => setRoom({...room, status: e.target.value})}
                          />
                          <label htmlFor="edit-maintenance-radio" className="text-danger">Đang bảo trì</label>
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
                      <Button type="submit" variant="warning" className="px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center text-dark">
                        <Save size={18} className="me-2" /> Cập nhật thay đổi
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

export default EditRoom;
