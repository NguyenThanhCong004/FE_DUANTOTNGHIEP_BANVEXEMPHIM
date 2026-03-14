import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Form } from 'react-bootstrap';
import { ArrowLeft, Save, Settings2, MousePointer2, Move, LayoutGrid } from 'lucide-react';

const SeatManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [rooms] = useState([
    { id: 1, roomId: 'R001', name: 'Phòng chiếu 01', status: 'Hoạt động', type: '2D/3D Standard', totalSeats: 300 },
    { id: 2, roomId: 'R002', name: 'Phòng chiếu 02', status: 'Hoạt động', type: '2D/3D Standard', totalSeats: 300 },
    { id: 3, roomId: 'R003', name: 'Phòng chiếu 03', status: 'Bảo trì', type: '2D/3D Standard', totalSeats: 300 },
    { id: 4, roomId: 'R004', name: 'Phòng chiếu VIP 01', status: 'Hoạt động', type: 'VIP Gold Class', totalSeats: 150 },
    { id: 5, roomId: 'R005', name: 'Phòng chiếu IMAX', status: 'Hoạt động', type: 'IMAX Laser', totalSeats: 300 },
    { id: 6, roomId: 'R006', name: 'Phòng chiếu 06', status: 'Hoạt động', type: '2D/3D Standard', totalSeats: 300 },
  ]);

  // Ưu tiên lấy thông tin phòng từ state truyền sang (dữ liệu vừa sửa/tạo)
  const [passedRoom, setPassedRoom] = useState(location.state?.roomInfo || null);
  const [selectedRoomId, setSelectedRoomId] = useState(passedRoom?.id || '');
  
  // Nếu là phòng vừa truyền sang, dùng nó luôn. Nếu chọn từ dropdown, tìm trong list mock.
  const selectedRoom = (passedRoom && (passedRoom.id === parseInt(selectedRoomId) || !selectedRoomId)) 
                       ? passedRoom 
                       : rooms.find(r => r.id === parseInt(selectedRoomId));
  
  const totalActiveSeats = selectedRoom ? parseInt(selectedRoom.totalSeats) : 0;

  const [seats, setSeats] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const ROWS = 15;
  const COLS = 20;

  // Hàm tính toán lại nhãn (số thứ tự) cho tất cả ghế
  const recalculateLabels = (currentSeats) => {
    const newSeats = [...currentSeats];
    for (let r = 0; r < ROWS; r++) {
      let seatNum = 1;
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (newSeats[idx].isActive) {
          newSeats[idx].label = `${seatNum}`;
          seatNum++;
        } else if (newSeats[idx].type !== 'OccupiedByDouble') {
          newSeats[idx].label = '';
        }
      }
    }
    return newSeats;
  };

  useEffect(() => {
    if (!selectedRoom) {
      setSeats([]);
      return;
    }

    // 1. Tạo khung lưới ảo 20x15 (300 ô trống màu xám)
    let initialGrid = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      initialGrid.push({
        id: i,
        label: '',
        type: 'Empty', // Trạng thái ảo ban đầu
        isActive: false
      });
    }

    // 2. Tính toán vị trí "Giữa" để đặt ghế vào
    const maxDoubleSeatsInLastRow = Math.floor(COLS / 2);
    let rowsNeeded = 1;
    let regularVipSeatsTotal = 0;

    if (totalActiveSeats <= maxDoubleSeatsInLastRow) {
      rowsNeeded = 1;
      regularVipSeatsTotal = 0;
    } else {
      regularVipSeatsTotal = totalActiveSeats - maxDoubleSeatsInLastRow;
      rowsNeeded = Math.ceil(regularVipSeatsTotal / COLS) + 1;
    }

    const startRow = Math.floor((ROWS - rowsNeeded) / 2);
    const startIdx = startRow * COLS;

    // 3. Rải ghế thật vào lưới
    let seatCount = 0;
    let currentIdx = startIdx;

    const regularRowsNeeded = rowsNeeded - 1;
    const numThuongRows = Math.floor(regularRowsNeeded / 2);

    while (seatCount < totalActiveSeats && currentIdx < initialGrid.length) {
      const r = Math.floor(currentIdx / COLS);
      const relativeRow = r - startRow;

      if (seatCount >= regularVipSeatsTotal && relativeRow < rowsNeeded - 1) {
        currentIdx = startIdx + (rowsNeeded - 1) * COLS;
        continue;
      }

      let type = 'Thường';
      if (relativeRow === rowsNeeded - 1) {
        type = 'Đôi';
      } else if (relativeRow >= numThuongRows) {
        type = 'VIP';
      }

      if (type === 'Đôi' && (currentIdx % COLS) === COLS - 1) {
        currentIdx++;
        continue;
      }

      initialGrid[currentIdx] = {
        id: currentIdx,
        label: '', 
        type: type,
        isActive: true
      };

      if (type === 'Đôi' && currentIdx + 1 < initialGrid.length) {
        initialGrid[currentIdx + 1] = {
          ...initialGrid[currentIdx + 1],
          type: 'OccupiedByDouble',
          isActive: false
        };
      }

      seatCount++;
      currentIdx += (type === 'Đôi' ? 2 : 1);
    }

    setSeats(recalculateLabels(initialGrid));
  }, [selectedRoomId, totalActiveSeats]);

  // Click để đổi loại ghế (Vòng lặp: Thường -> VIP -> Đôi)
  const handleSeatClick = (index) => {
    if (!selectedRoom) return;
    let newSeats = [...seats];
    const current = newSeats[index];

    if (current.type === 'OccupiedByDouble') return;

    if (!current.isActive) {
      newSeats[index] = { ...current, type: 'Thường', isActive: true };
      setSeats(recalculateLabels(newSeats));
      return;
    }

    if (current.type === 'Thường') {
      newSeats[index].type = 'VIP';
    } else if (current.type === 'VIP') {
      const isEndOfRow = (index % COLS) === COLS - 1;
      const nextIdx = index + 1;
      if (!isEndOfRow && nextIdx < newSeats.length && !newSeats[nextIdx].isActive) {
        newSeats[index].type = 'Đôi';
        newSeats[nextIdx] = { ...newSeats[nextIdx], isActive: false, type: 'OccupiedByDouble' };
      } else {
        newSeats[index].type = 'Thường';
      }
    } else if (current.type === 'Đôi') {
      newSeats[index].type = 'Thường';
      const nextIdx = index + 1;
      if (nextIdx < newSeats.length && newSeats[nextIdx].type === 'OccupiedByDouble') {
        newSeats[nextIdx] = { ...newSeats[nextIdx], type: 'Empty', isActive: false };
      }
    }
    setSeats(recalculateLabels(newSeats));
  };


  // Logic Kéo Thả
  const onDragStart = (index) => {
    if (seats[index].type === 'OccupiedByDouble') return;
    setDraggedIndex(index);
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    let newSeats = [...seats];
    const draggedSeat = { ...newSeats[draggedIndex] };
    const targetSeat = { ...newSeats[targetIndex] };

    if (targetSeat.type === 'OccupiedByDouble') return;

    const maxDoubleSeatsInLastRow = Math.floor(COLS / 2);
    const rowsNeeded = totalActiveSeats <= maxDoubleSeatsInLastRow 
      ? 1 
      : Math.ceil((totalActiveSeats - maxDoubleSeatsInLastRow) / COLS) + 1;
    const startRow = Math.floor((ROWS - rowsNeeded) / 2);
    const lastRowIdx = startRow + rowsNeeded - 1;
    const targetRowIdx = Math.floor(targetIndex / COLS);

    // Nếu ghế kéo là ghế đôi
    if (draggedSeat.type === 'Đôi') {
      const draggedNextIdx = draggedIndex + 1;
      const targetNextIdx = targetIndex + 1;
      const isTargetEndOfRow = (targetIndex % COLS) === COLS - 1;
      const isTargetInLastRow = targetRowIdx === lastRowIdx;

      // Kiểm tra: Phải đủ chỗ VÀ không bị chặn
      if (isTargetEndOfRow || (newSeats[targetNextIdx].isActive && targetNextIdx !== draggedIndex)) {
        draggedSeat.type = 'Thường'; // Tự động biến thành ghế thường nếu kéo vào chỗ không đủ rộng
        if (draggedNextIdx < newSeats.length && newSeats[draggedNextIdx].type === 'OccupiedByDouble') {
          newSeats[draggedNextIdx] = { ...newSeats[draggedNextIdx], type: 'Empty', isActive: false };
        }
      } else {
        if (draggedNextIdx < newSeats.length && newSeats[draggedNextIdx].type === 'OccupiedByDouble') {
          newSeats[draggedNextIdx] = { ...newSeats[draggedNextIdx], type: 'Empty', isActive: false };
        }
        newSeats[targetNextIdx] = { ...newSeats[targetNextIdx], type: 'OccupiedByDouble', isActive: false };
      }
    } 

    newSeats[draggedIndex] = targetSeat;
    newSeats[targetIndex] = draggedSeat;

    setSeats(recalculateLabels(newSeats));
    setDraggedIndex(null);
  };


  const getSeatColor = (seat) => {
    if (!seat.isActive) return '#e9ecef'; // Ô trống (Xám ảo)
    switch (seat.type) {
      case 'Thường': return '#0d6efd'; // Xanh dương
      case 'VIP': return '#ffc107';    // Vàng
      case 'Đôi': return '#dc3545';    // Đỏ
      default: return '#e9ecef';
    }
  };

  return (
    <div className="seat-management text-dark pb-5">
      <style>{`
        .seat-grid-container {
          display: grid;
          grid-template-columns: 50px repeat(20, 1fr);
          gap: 10px;
          background: #fff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.05);
          max-width: 1400px;
          margin: 0 auto;
          overflow-x: auto;
        }
        .row-label {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: #adb5bd;
          font-size: 1rem;
        }
        .seat-box {
          aspect-ratio: 1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 850;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .seat-box.type-doi {
          grid-column: span 2;
          aspect-ratio: auto;
          height: 100%;
        }
        .seat-box.active {
          cursor: grab;
          box-shadow: 0 3px 8px rgba(0,0,0,0.08);
        }
        .seat-box.active:hover {
          z-index: 10;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          filter: brightness(1.1);
        }
        .seat-box.placeholder {
          color: transparent;
          border: 1px dashed #e9ecef;
          background-color: #f8f9fa;
        }
        .seat-box.hidden-slot {
          display: none;
        }
        .screen-bar {
          height: 6px;
          background: #343a40;
          width: 50%;
          margin: 0 auto 50px;
          border-radius: 0 0 20px 20px;
          position: relative;
        }
        .screen-bar::after {
          content: 'MÀN HÌNH';
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          letter-spacing: 10px;
          color: #adb5bd;
          font-weight: 800;
        }
        .legend-dot { width: 14px; height: 14px; border-radius: 4px; }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-black mb-1">Thiết kế sơ đồ: {selectedRoom?.name || 'Chưa chọn phòng'}</h2>
          <p className="text-muted small mb-0">Chọn phòng chiếu để bắt đầu thiết kế hoặc chỉnh sửa sơ đồ ghế.</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <Form.Group className="mb-0" style={{ minWidth: '250px' }}>
            <Form.Select 
              className="fw-bold border-2" 
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              style={{ borderRadius: '10px', padding: '10px' }}
            >
              <option value="">-- Chọn phòng chiếu --</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name} ({room.totalSeats} ghế)</option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="vr d-none d-md-block"></div>
          <div className="d-flex gap-2">
            <Button variant="light" className="border shadow-sm px-4 fw-bold" onClick={() => navigate('/admin/rooms')}>Hủy bỏ</Button>
            <Button variant="primary" className="shadow-sm px-4 fw-bold" disabled={!selectedRoom} onClick={() => { alert('Đã lưu cấu hình!'); navigate('/admin/rooms'); }}>
              Lưu sơ đồ
            </Button>
          </div>
        </div>
      </div>

      {!selectedRoom ? (
        <Card className="border-0 shadow-sm p-5 text-center" style={{ borderRadius: '28px' }}>
          <div className="py-5">
            <LayoutGrid size={64} className="text-muted mb-3 opacity-25" />
            <h4 className="fw-bold text-muted">Vui lòng chọn phòng chiếu</h4>
            <p className="text-muted">Chọn một phòng chiếu từ danh sách bên trên để bắt đầu thiết kế sơ đồ ghế.</p>
          </div>
        </Card>
      ) : (
        <>
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '24px' }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-4">
                  <div className="d-flex align-items-center gap-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <Settings2 size={20} className="text-primary" /> Thông tin phòng
                    </h5>
                    <div className="vr d-none d-md-block"></div>
                    <div className="d-flex gap-4">
                      <div className="d-flex flex-column">
                        <span className="small text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Cột</span>
                        <span className="fw-bold">20</span>
                      </div>
                      <div className="d-flex flex-column">
                        <span className="small text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Hàng</span>
                        <span className="fw-bold">15</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-4 align-items-center">
                    <div className="d-flex flex-column">
                      <span className="small text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Tổng số ghế</span>
                      <Badge bg="dark" className="px-3">{seats.filter(s => s.isActive).length}</Badge>
                    </div>
                    <div className="d-flex flex-column">
                      <span className="small text-primary text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Thường</span>
                      <span className="fw-bold">{seats.filter(s => s.isActive && s.type === 'Thường').length}</span>
                    </div>
                    <div className="d-flex flex-column">
                      <span className="small text-warning text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>VIP</span>
                      <span className="fw-bold">{seats.filter(s => s.isActive && s.type === 'VIP').length}</span>
                    </div>
                    <div className="d-flex flex-column">
                      <span className="small text-danger text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Đôi</span>
                      <span className="fw-bold">{seats.filter(s => s.isActive && s.type === 'Đôi').length}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm p-4 pt-5 mb-4" style={{ borderRadius: '28px' }}>
                <div className="screen-bar"></div>
                
                <div className="seat-grid-container">
                  {Array.from({ length: ROWS }).map((_, rIdx) => (
                    <React.Fragment key={rIdx}>
                      <div className="row-label">{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[rIdx]}</div>
                      {seats.slice(rIdx * COLS, (rIdx + 1) * COLS).map((seat, sIdx) => {
                        const actualIndex = rIdx * COLS + sIdx;
                        return (
                          <div 
                            key={actualIndex}
                            draggable={seat.isActive && seat.type !== 'OccupiedByDouble'}
                            onDragStart={() => onDragStart(actualIndex)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(actualIndex)}
                            onClick={() => handleSeatClick(actualIndex)}
                            className={`seat-box 
                              ${seat.isActive ? 'active' : 'placeholder'} 
                              ${seat.type === 'Đôi' ? 'type-doi' : ''} 
                              ${seat.type === 'OccupiedByDouble' ? 'hidden-slot' : ''}`}
                            style={{ backgroundColor: getSeatColor(seat) }}
                          >
                            {seat.label}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <div className="d-flex justify-content-center gap-4 mt-5">
                  <div className="d-flex align-items-center gap-2 small fw-bold">
                    <div className="legend-dot" style={{backgroundColor:'#0d6efd'}}></div> Ghế thường
                  </div>
                  <div className="d-flex align-items-center gap-2 small fw-bold">
                    <div className="legend-dot" style={{backgroundColor:'#ffc107'}}></div> Ghế VIP
                  </div>
                  <div className="d-flex align-items-center gap-2 small fw-bold">
                    <div className="legend-dot" style={{backgroundColor:'#dc3545'}}></div> Ghế đôi
                  </div>
                  <div className="d-flex align-items-center gap-2 small fw-bold">
                    <div className="legend-dot" style={{border:'1px dashed #ccc', backgroundColor:'#f8f9fa'}}></div> Vị trí trống
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default SeatManagement;
