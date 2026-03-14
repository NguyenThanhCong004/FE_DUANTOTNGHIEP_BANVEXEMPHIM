import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, Row, Col, Form, Button, Badge, InputGroup, Breadcrumb, ProgressBar } from 'react-bootstrap';
import { ArrowLeft, Check, Calendar as CalendarIcon, Clock, Monitor, DollarSign, Percent, Film, Save, ChevronRight } from 'lucide-react';

const EditShowtime = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  const [activeStep, setActiveStep] = useState(1);
  const [showtime, setShowtime] = useState({
    movie_id: 1,
    date: '2024-03-20',
    start_time: '11:00',
    room_id: 1,
    base_price: 75000,
    vat: 5
  });

  // Giả lập load dữ liệu cũ (hoặc lấy từ state truyền sang)
  useEffect(() => {
    if (location.state?.showtimeInfo) {
      const info = location.state.showtimeInfo;
      setShowtime({
        ...showtime,
        movie_id: info.movie_id,
        start_time: info.time,
        base_price: info.price,
        vat: info.vat
      });
    }
  }, [location.state]);

  const movies = [
    { id: 1, name: 'Phim Mai', type: '2D', duration: '131p', image: '🎬', price: 75000 },
    { id: 2, name: 'Kung Fu Panda 4', type: '3D', duration: '94p', image: '🐼', price: 90000 },
    { id: 3, name: 'Dune 2', type: 'IMAX', duration: '166p', image: '🏜️', price: 150000 },
    { id: 4, name: 'Exhuma', type: '2D', duration: '134p', image: '🧟', price: 80000 },
  ];

  const rooms = [
    { id: 1, name: 'Phòng 01', type: 'Standard' },
    { id: 2, name: 'Phòng 02', type: 'Standard' },
    { id: 3, name: 'Phòng VIP', type: 'VIP' },
    { id: 4, name: 'Phòng 04', type: 'Standard' },
  ];

  const nextStep = () => setActiveStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const selectedMovie = movies.find(m => m.id === showtime.movie_id);

  return (
    <div className="add-showtime-compact text-dark pb-5">
      <style>{`
        .add-showtime-compact { background: #f8fafc; font-size: 0.9rem; }
        .form-container-card { border-radius: 20px; border: 1px solid #e2e8f0; background: #fff; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.02); }
        .step-header { background: #fff; padding: 20px 30px; border-bottom: 1px solid #f1f5f9; }
        .selection-grid-item { border-radius: 12px; border: 1px solid #f1f5f9; padding: 12px; cursor: pointer; transition: all 0.2s; background: #fff; height: 100%; }
        .selection-grid-item:hover { border-color: #0ea5e9; background: #f8fafc; }
        .selection-grid-item.active { border-color: #0ea5e9; background: #f0f9ff; box-shadow: 0 0 0 1px #0ea5e9; }
        .compact-input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 15px; font-weight: 600; background: #f8fafc; }
        .price-summary-box { background: #1e293b; color: #fff; border-radius: 16px; padding: 20px; }
        .progress-thin { height: 4px; border-radius: 0; background: #f1f5f9; }
      `}</style>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="text-muted fw-bold small text-uppercase">Quản lý suất chiếu</span>
          <ChevronRight size={14} className="text-muted" />
          <span className="text-dark fw-bold small text-uppercase">Chỉnh sửa #{id}</span>
        </div>
        <h2 className="fw-black mb-0">Cập nhật suất chiếu</h2>
      </div>

      <Row className="justify-content-center">
        <Col lg={9}>
          <div className="form-container-card">
            <ProgressBar now={(activeStep / 4) * 100} variant="warning" className="progress-thin" />
            
            <div className="step-header d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-warning-subtle text-dark mb-1">Bước {activeStep}/4</span>
                <h5 className="fw-bold mb-0">
                  {activeStep === 1 && "Thay đổi phim trình chiếu"}
                  {activeStep === 2 && "Điều chỉnh thời gian"}
                  {activeStep === 3 && "Thay đổi phòng chiếu"}
                  {activeStep === 4 && "Cập nhật giá vé"}
                </h5>
              </div>
              <Button variant="light" size="sm" className="border rounded-3 fw-bold" onClick={() => navigate('/admin/showtimes')}>Hủy bỏ</Button>
            </div>

            <div className="p-4 p-md-5">
              {activeStep === 1 && (
                <Row className="g-3">
                  {movies.map(m => (
                    <Col md={4} sm={6} key={m.id}>
                      <div className={`selection-grid-item d-flex align-items-center gap-3 ${showtime.movie_id === m.id ? 'active' : ''}`} onClick={() => setShowtime({...showtime, movie_id: m.id, base_price: m.price})}>
                        <div className="fs-2">{m.image}</div>
                        <div className="overflow-hidden">
                          <div className="fw-bold text-truncate mb-0">{m.name}</div>
                          <span className="text-muted" style={{fontSize: '0.7rem'}}>{m.type} • {m.duration}</span>
                        </div>
                        {showtime.movie_id === m.id && <Check size={16} className="ms-auto text-primary" />}
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              {activeStep === 2 && (
                <Row className="justify-content-center py-4">
                  <Col md={5}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold small text-muted">NGÀY CHIẾU</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 rounded-start-3"><CalendarIcon size={18} className="text-primary"/></InputGroup.Text>
                        <Form.Control type="date" className="compact-input border-start-0 rounded-end-3" value={showtime.date} onChange={(e) => setShowtime({...showtime, date: e.target.value})} />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-muted">GIỜ BẮT ĐẦU</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 rounded-start-3"><Clock size={18} className="text-primary"/></InputGroup.Text>
                        <Form.Control type="time" className="compact-input border-start-0 rounded-end-3 fs-5" value={showtime.start_time} onChange={(e) => setShowtime({...showtime, start_time: e.target.value})} />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {activeStep === 3 && (
                <Row className="g-3">
                  {rooms.map(r => (
                    <Col md={6} key={r.id}>
                      <div className={`selection-grid-item d-flex align-items-center gap-3 ${showtime.room_id === r.id ? 'active' : ''}`} onClick={() => setShowtime({...showtime, room_id: r.id})}>
                        <div className="p-2 bg-light rounded-3"><Monitor size={20} className="text-muted" /></div>
                        <div>
                          <div className="fw-bold">{r.name}</div>
                          <div className="text-muted" style={{fontSize: '0.7rem'}}>Loại: {r.type}</div>
                        </div>
                        {showtime.room_id === r.id && <Check size={16} className="ms-auto text-primary" />}
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              {activeStep === 4 && (
                <div>
                  <Row className="g-4 mb-5">
                    <Col md={6}>
                      <Form.Label className="fw-bold small text-muted">GIÁ VÉ GỐC (VNĐ)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 rounded-start-3"><DollarSign size={18}/></InputGroup.Text>
                        <Form.Control type="number" className="compact-input border-start-0 rounded-end-3" value={showtime.base_price} onChange={(e) => setShowtime({...showtime, base_price: e.target.value})} />
                      </InputGroup>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="fw-bold small text-muted">THUẾ VAT (%)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0 rounded-start-3"><Percent size={18}/></InputGroup.Text>
                        <Form.Control type="number" className="compact-input border-start-0 rounded-end-3" value={showtime.vat} onChange={(e) => setShowtime({...showtime, vat: e.target.value})} />
                      </InputGroup>
                    </Col>
                  </Row>
                  <div className="price-summary-box d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-white-50 small fw-bold text-uppercase mb-1">Giá vé niêm yết mới</div>
                      <Badge bg="warning" text="dark">{selectedMovie?.name}</Badge>
                    </div>
                    <div className="text-end">
                      <h2 className="fw-black mb-0">{(parseInt(showtime.base_price) * (1 + parseInt(showtime.vat)/100)).toLocaleString()}đ</h2>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-5 pt-4 border-top">
                <Button variant="outline-secondary" className="px-4 py-2 rounded-3 fw-bold border-0" onClick={prevStep} style={{ visibility: activeStep === 1 ? 'hidden' : 'visible' }}>Quay lại</Button>
                <div className="d-flex gap-2">
                  {activeStep < 4 ? (
                    <Button variant="primary" className="px-5 py-2 rounded-3 fw-bold" onClick={nextStep}>Kế tiếp</Button>
                  ) : (
                    <Button variant="warning" className="px-5 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 text-dark" onClick={() => { alert('Cập nhật thành công!'); navigate('/admin/showtimes'); }}>
                      <Save size={18} /> Lưu thay đổi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default EditShowtime;