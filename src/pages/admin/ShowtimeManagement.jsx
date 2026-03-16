import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Form, Button, Badge, Tooltip, OverlayTrigger, Modal, ListGroup } from 'react-bootstrap';
import { Search, Plus, Monitor, ChevronRight, Info, Clock, Film, DollarSign, Trash2, Edit3, XCircle, AlertCircle } from 'lucide-react';

const ShowtimeManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(1);
  const [selectedDate, setSelectedDate] = useState('2024-03-20');
  
  // State cho Modal Chi tiết
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const movies = [
    { id: 1, name: 'Phim Mai', type: '2D', duration: '131 phút', image: '🎬' },
    { id: 2, name: 'Kung Fu Panda 4', type: '3D', duration: '94 phút', image: '🐼' },
    { id: 3, name: 'Dune: Hành Tinh Cát 2', type: 'IMAX', duration: '166 phút', image: '🏜️' },
    { id: 4, name: 'Exhuma: Quật Mộ Trùng Tang', type: '2D', duration: '134 phút', image: '🧟' },
  ];

  const scheduleData = [
    { 
      room_id: 1, 
      room_name: 'Phòng chiếu 01', 
      slots: [
        { id: 101, time: '08:30', movie_id: 1, status: 'Đã chiếu', price: 75000, vat: 5 },
        { id: 102, time: '11:00', movie_id: 1, status: 'Sắp chiếu', price: 75000, vat: 5 },
      ] 
    },
    { 
      room_id: 2, 
      room_name: 'Phòng chiếu 02', 
      slots: [
        { id: 201, time: '09:00', movie_id: 4, status: 'Đã chiếu', price: 80000, vat: 5 },
      ] 
    },
    { 
      room_id: 3, 
      room_name: 'Phòng chiếu VIP 01', 
      slots: [
        { id: 301, time: '10:00', movie_id: 3, status: 'Sắp chiếu', price: 150000, vat: 5 },
      ] 
    }
  ];

  const handleSlotClick = (slot, roomName) => {
    setSelectedSlot({ ...slot, room_name: roomName });
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã chiếu': return '#94a3b8';
      case 'Sắp chiếu': return '#0ea5e9';
      default: return '#64748b';
    }
  };

  return (
    <div className="showtime-management-page text-dark pb-5">
      <style>{`
        .movie-sidebar { background: #fff; border-radius: 24px; height: calc(100vh - 180px); display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .movie-item { padding: 12px; border-radius: 16px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; border: 1px solid transparent; }
        .movie-item.active { background: #f0f7ff; border-color: #0ea5e9; }
        .schedule-container { background: #fff; border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .room-row { display: flex; align-items: center; padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .time-slot-card { padding: 8px 16px; border-radius: 12px; background: #fff; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; min-width: 90px; cursor: pointer; transition: all 0.2s; }
        .time-slot-card:hover { border-color: #0ea5e9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; margin-bottom: 4px; }
        
        .detail-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 10px; }
        .detail-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; color: #0ea5e9; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1">Quản lý lịch chiếu</h2>
          <p className="text-muted small mb-0">Theo dõi và sắp xếp lịch chiếu phim trong ngày.</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Control type="date" className="rounded-3 border-1 fw-bold" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: '180px' }} />
          <Button variant="primary" className="rounded-3 fw-bold d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => navigate('/admin/showtimes/add')}>
            <Plus size={18} /> Thêm suất chiếu
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={3}>
          <div className="movie-sidebar">
            <div className="p-3 border-bottom position-relative">
              <Search size={16} className="position-absolute" style={{left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
              <Form.Control className="border-0 bg-light rounded-3 ps-5" placeholder="Tìm phim..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex-grow-1 overflow-auto p-3">
              {movies.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(movie => (
                <div key={movie.id} className={`movie-item ${selectedMovieId === movie.id ? 'active' : ''}`} onClick={() => setSelectedMovieId(movie.id)}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="fs-3">{movie.image}</div>
                    <div className="flex-grow-1">
                      <div className="fw-bold small">{movie.name}</div>
                      <Badge bg="light" text="dark" className="border" style={{fontSize: '0.6rem'}}>{movie.type}</Badge>
                    </div>
                    {selectedMovieId === movie.id && <ChevronRight size={16} className="text-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        <Col lg={9}>
          <div className="schedule-container h-100">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2"><Monitor size={20} className="text-primary" /> Lịch chiếu phòng</h5>
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center gap-1 small text-muted"><div className="status-dot mb-0 me-1" style={{backgroundColor: '#94a3b8'}}></div> Đã chiếu</div>
                <div className="d-flex align-items-center gap-1 small text-muted"><div className="status-dot mb-0 me-1" style={{backgroundColor: '#0ea5e9'}}></div> Sắp chiếu</div>
              </div>
            </div>
            {scheduleData.map((room) => (
              <div key={room.room_id} className="room-row">
                <div style={{ width: '180px' }}>
                  <div className="fw-bold">{room.room_name}</div>
                  <div className="text-muted small">Suất chiếu: {room.slots.length}</div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {room.slots.map(slot => (
                    <div 
                      key={slot.id} 
                      className="time-slot-card"
                      onClick={() => handleSlotClick(slot, room.room_name)}
                    >
                      <div className="status-dot" style={{backgroundColor: getStatusColor(slot.status)}}></div>
                      <div className="fw-bold">{slot.time}</div>
                    </div>
                  ))}
                  <button className="time-slot-card bg-light border-dashed" style={{borderStyle: 'dashed'}} onClick={() => navigate('/admin/showtimes/add')}>
                    <Plus size={18} className="text-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {/* MODAL CHI TIẾT SUẤT CHIẾU */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered contentClassName="border-0 shadow-lg" style={{ borderRadius: '28px' }}>
        <Modal.Header closeButton className="border-0 p-4 pb-0">
          <Modal.Title className="fw-black">Chi tiết suất chiếu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedSlot && (
            <div>
              <div className="detail-item border-primary border-opacity-25 bg-primary bg-opacity-10 mb-4">
                <div className="fs-2">{movies.find(m => m.id === selectedSlot.movie_id)?.image}</div>
                <div>
                  <h5 className="fw-black mb-0 text-primary">{movies.find(m => m.id === selectedSlot.movie_id)?.name}</h5>
                  <Badge bg="primary" className="px-3 rounded-pill mt-1">Dữ liệu từ hệ thống</Badge>
                </div>
              </div>

              <div className="row g-3">
                <Col md={6}>
                  <div className="detail-item">
                    <div className="detail-icon"><Monitor size={20}/></div>
                    <div>
                      <div className="text-muted small fw-bold text-uppercase" style={{fontSize: '0.6rem'}}>Phòng chiếu</div>
                      <div className="fw-bold">{selectedSlot.room_name}</div>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <div className="detail-icon"><Clock size={20}/></div>
                    <div>
                      <div className="text-muted small fw-bold text-uppercase" style={{fontSize: '0.6rem'}}>Thời gian</div>
                      <div className="fw-bold">{selectedSlot.time}</div>
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="detail-item">
                    <div className="detail-icon text-success"><DollarSign size={20}/></div>
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div>
                        <div className="text-muted small fw-bold text-uppercase" style={{fontSize: '0.6rem'}}>Giá vé niêm yết</div>
                        <div className="fw-bold text-success">{(selectedSlot.price * (1 + selectedSlot.vat/100)).toLocaleString()}đ</div>
                      </div>
                      <div className="text-end text-muted small">VAT: {selectedSlot.vat}%</div>
                    </div>
                  </div>
                </Col>
              </div>

              <div className="mt-4 p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
                <div className={`status-dot scale-150 ms-2`} style={{backgroundColor: getStatusColor(selectedSlot.status), width: 10, height: 10}}></div>
                <div className="fw-bold text-muted small uppercase">Trạng thái: {selectedSlot.status}</div>
              </div>

              <div className="d-flex gap-2 mt-5">
                {selectedSlot.status !== 'Đã chiếu' ? (
                  <>
                    <Button variant="outline-danger" className="w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2">
                      <Trash2 size={18}/> Hủy suất
                    </Button>
                    <Button 
                      variant="primary" 
                      className="w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => navigate(`/admin/showtimes/edit/${selectedSlot.id}`, { state: { showtimeInfo: selectedSlot } })}
                    >
                      <Edit3 size={18}/> Chỉnh sửa
                    </Button>
                  </>
                ) : (
                  <div className="w-100 p-3 bg-light rounded-3 text-center border dashed">
                    <span className="text-muted small fw-bold">
                      <AlertCircle size={16} className="me-1 mb-1"/> 
                      Suất chiếu đã hoàn thành, không thể chỉnh sửa hoặc xóa.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ShowtimeManagement;