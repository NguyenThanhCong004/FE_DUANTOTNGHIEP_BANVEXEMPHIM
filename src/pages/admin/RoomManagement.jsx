import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Form, Toast, ToastContainer } from 'react-bootstrap';
import { Search, Plus, Edit3, Trash2, CheckCircle2, XCircle, Monitor, AlertTriangle, Armchair } from 'lucide-react';

const RoomManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [rooms] = useState([
    { id: 1, roomId: 'R001', name: 'Phòng chiếu 01', status: 'Hoạt động', type: '2D/3D Standard', hasTickets: true, totalSeats: 300 },
    { id: 2, roomId: 'R002', name: 'Phòng chiếu 02', status: 'Hoạt động', type: '2D/3D Standard', hasTickets: false, totalSeats: 300 },
    { id: 3, roomId: 'R003', name: 'Phòng chiếu 03', status: 'Bảo trì', type: '2D/3D Standard', hasTickets: false, totalSeats: 300 },
    { id: 4, roomId: 'R004', name: 'Phòng chiếu VIP 01', status: 'Hoạt động', type: 'VIP Gold Class', hasTickets: true, totalSeats: 150 },
    { id: 5, roomId: 'R005', name: 'Phòng chiếu IMAX', status: 'Hoạt động', type: 'IMAX Laser', hasTickets: false, totalSeats: 300 },
    { id: 6, roomId: 'R006', name: 'Phòng chiếu 06', status: 'Hoạt động', type: '2D/3D Standard', hasTickets: false, totalSeats: 300 },
  ]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleDelete = (room) => {
    if (room.hasTickets) {
      setToastMsg(`Không thể xóa "${room.name}" vì đã có vé được đặt trong phòng này!`);
      setShowToast(true);
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${room.name}"?`)) {
      console.log('Deleting room:', room.id);
      // Logic xóa thực tế ở đây
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Hoạt động':
        return { 
          bg: 'rgba(25, 135, 84, 0.1)', 
          color: '#198754', 
          icon: <CheckCircle2 size={14} />,
          text: 'Hoạt động'
        };
      case 'Bảo trì':
        return { 
          bg: 'rgba(220, 53, 69, 0.1)', 
          color: '#dc3545', 
          icon: <XCircle size={14} />,
          text: 'Bảo trì'
        };
      default:
        return { bg: '#f8f9fa', color: '#6c757d', icon: null, text: status };
    }
  };

  return (
    <div className="room-management text-dark">
      <style>{`
        .room-card {
          border-radius: 20px;
          border: 1px solid #f1f1f1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #fff;
          overflow: hidden;
          position: relative;
        }
        .room-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.08);
          border-color: #0d6efd;
        }
        .room-status-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .room-icon-bg {
          width: 50px;
          height: 50px;
          background: #f0f7ff;
          color: #0d6efd;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        .room-id-tag {
          font-size: 0.7rem;
          color: #adb5bd;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .search-container .form-control {
          border-radius: 15px;
          padding: 12px 20px 12px 45px;
          border: 1px solid #eee;
          background: #fff;
        }
        .search-container .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #adb5bd;
          z-index: 5;
        }
        .action-overlay {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #eee;
          display: flex;
          gap: 10px;
          justify-content: space-between;
          align-items: center;
        }
        .btn-action {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .btn-view-seats {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 10px;
          background-color: #f0f7ff;
          color: #0d6efd;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-view-seats:hover {
          background-color: #0d6efd;
          color: #fff;
        }
      `}</style>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide bg="danger" className="text-white border-0 shadow-lg">
          <Toast.Header closeButton={false} className="bg-danger text-white border-0">
            <AlertTriangle size={18} className="me-2" />
            <strong className="me-auto">Cảnh báo hệ thống</strong>
          </Toast.Header>
          <Toast.Body className="fw-semibold">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="fw-black mb-1" style={{ fontSize: '1.75rem', color: '#1a1d23' }}>Hệ thống phòng chiếu</h2>
          <p className="text-muted mb-0 fw-semibold">Quản lý và thiết lập cấu hình các phòng tại rạp đơn</p>
        </div>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm border-0 rounded-3"
          onClick={() => navigate('/admin/rooms/add')}
        >
          <Plus size={20} /> Thêm phòng mới
        </Button>
      </div>

      {/* Search Section */}
      <div className="mb-4 position-relative search-container" style={{ maxWidth: '450px' }}>
        <Search size={20} className="search-icon" />
        <Form.Control
          placeholder="Tìm tên hoặc mã phòng chiếu..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Rooms Grid */}
      <Row className="g-4">
        {filteredRooms.map((room) => {
          const status = getStatusInfo(room.status);
          return (
            <Col key={room.id} xs={12} sm={6} lg={4} xl={3}>
              <div className="room-card p-4 h-100">
                <div className="room-status-badge" style={{ backgroundColor: status.bg, color: status.color }}>
                  {status.icon} {status.text}
                </div>
                <div className="room-icon-bg"><Monitor size={24} /></div>
                <div className="room-id-tag">{room.roomId}</div>
                <h4 className="fw-bold text-dark mb-1">{room.name}</h4>
                <div className="d-flex justify-content-between align-items-center">
                  <p className="text-muted small mb-0">{room.type}</p>
                  <Badge bg="light" text="dark" className="border fw-bold">{room.totalSeats} ghế</Badge>
                </div>
                
                <div className="action-overlay">
                  <div className="d-flex gap-2">
                    <Button 
                      variant="light" 
                      className="btn-action text-primary border shadow-sm"
                      onClick={() => navigate(`/admin/rooms/edit/${room.id}`)}
                      title="Sửa phòng"
                    >
                      <Edit3 size={18} />
                    </Button>
                    <Button 
                      variant="light" 
                      className="btn-action text-danger border shadow-sm" 
                      onClick={() => handleDelete(room)}
                      title="Xóa phòng"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  
                  <button 
                    className="btn-view-seats"
                    onClick={() => navigate('/admin/seats', { state: { roomInfo: room } })}
                  >
                    <Armchair size={16} /> Xem ghế
                  </button>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default RoomManagement;
