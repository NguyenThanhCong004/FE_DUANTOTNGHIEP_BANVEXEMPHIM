import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, InputGroup, Form } from 'react-bootstrap';
import { TicketPercent, Calendar as CalendarIcon, Search, Plus, Trash2, Edit3, Clock, LayoutGrid, Film } from 'lucide-react';
import Calendar from '../../components/common/Calendar';

const PromotionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // Default to calendar view
  const navigate = useNavigate();

  const mockPromotions = [
    { id: 1, title: 'Ưu đãi hè rực rỡ', movie: 'Lật Mặt 7', discount_percent: '20', startDate: '2026-06-01', startTime: '00:00', endDate: '2026-08-31', endTime: '23:59', status: 'Sắp diễn ra' },
    { id: 2, title: 'Ngày hội thành viên', movie: 'Doraemon, Mai', discount_percent: '50', startDate: '2026-03-10', startTime: '08:00', endDate: '2026-03-20', endTime: '22:00', status: 'Đang diễn ra' },
    { id: 3, title: 'Khai trương rạp mới', movie: 'Mai', discount_percent: '30', startDate: '2026-03-01', startTime: '09:00', endDate: '2026-03-15', endTime: '21:00', status: 'Đang diễn ra' },
    { id: 4, title: 'Valentine ngọt ngào', movie: 'Hành Tinh Khỉ', discount_percent: '15', startDate: '2026-02-10', startTime: '00:00', endDate: '2026-02-15', endTime: '23:59', status: 'Đã kết thúc' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đang diễn ra': return <Badge bg="success" className="rounded-pill px-3 py-1 small">Đang diễn ra</Badge>;
      case 'Sắp diễn ra': return <Badge bg="info" className="rounded-pill px-3 py-1 small">Sắp diễn ra</Badge>;
      case 'Đã kết thúc': return <Badge bg="secondary" className="rounded-pill px-3 py-1 small">Đã kết thúc</Badge>;
      default: return null;
    }
  };

  const renderPromotionEvent = (promo) => {
    const isSurcharge = parseFloat(promo.discount_percent) < 0;
    
    const statusColors = {
      'Đang diễn ra': isSurcharge ? '#fd7e14' : '#198754', // Cam cho phụ phí, Xanh lá cho khuyến mãi
      'Sắp diễn ra': '#0dcaf0',
      'Đã kết thúc': '#6c757d'
    };

    return (
      <div 
        className="p-1 rounded mb-1 text-white shadow-sm"
        style={{ 
          backgroundColor: statusColors[promo.status] || '#6c757d',
          fontSize: '0.7rem',
          borderLeft: '3px solid rgba(0,0,0,0.2)'
        }}
      >
        <div className="fw-bold text-truncate">
          {isSurcharge ? `+${Math.abs(promo.discount_percent)}%` : `${promo.discount_percent}%`} - {promo.movie}
        </div>
        <div className="d-flex align-items-center gap-1 opacity-75 small">
          <Clock size={10} />
          <span>{promo.startTime}-{promo.endTime}</span>
        </div>
      </div>
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này không?')) {
      console.log('Deleting promotion:', id);
    }
  };

  const filteredPromotions = mockPromotions.filter(promo => {
    const matchesSearch = (promo.title.toLowerCase().includes(searchTerm.toLowerCase()) || promo.movie.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      // Khuyến mãi giao thoa với khoảng lọc
      matchesDate = (promo.startDate <= endDateFilter && promo.endDate >= startDateFilter);
    } else if (startDateFilter) {
      matchesDate = (promo.endDate >= startDateFilter);
    } else if (endDateFilter) {
      matchesDate = (promo.startDate <= endDateFilter);
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="promotion-management text-dark">
      <style>{`
        .promo-card {
          border-radius: 20px;
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05) !important;
        }
        .promo-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }
        .discount-badge {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 15px;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .time-box {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.85rem;
        }
        .search-container .form-control {
          border-radius: 12px 0 0 12px !important;
          border: 1px solid #eee !important;
          padding: 12px 20px !important;
          color: #000 !important;
        }
        .search-container .form-control::placeholder {
          color: #000 !important;
          opacity: 0.6;
        }
        .search-container .btn {
          border-radius: 0 12px 12px 0 !important;
        }
        .date-input {
          border-radius: 10px !important;
          border: 1.5px solid #eee !important;
          padding: 8px 12px !important;
          color: #000 !important;
          font-size: 0.9rem;
        }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Quản lý khuyến mãi theo phim</h2>
          <p className="text-muted small mb-0">Thiết lập ưu đãi theo phần trăm cho các phim được chọn</p>
        </div>
        <div className="d-flex gap-2">
          <div className="bg-light p-1 rounded-3 d-flex shadow-sm">
            <Button 
              variant={viewMode === 'calendar' ? 'primary' : 'light'} 
              size="sm" 
              className="d-flex align-items-center gap-2 border-0"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={18} /> Lịch
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'primary' : 'light'} 
              size="sm" 
              className="d-flex align-items-center gap-2 border-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={18} /> Lưới
            </Button>
          </div>
          <Link to="/admin/promotions/add" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm border-0 rounded-3">
            <Plus size={20} /> Thêm mới
          </Link>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col lg={4}>
              <InputGroup className="search-container">
                <Form.Control
                  placeholder="Tìm theo tên phim, chương trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="light" className="border">
                  <Search size={18} className="text-muted" />
                </Button>
              </InputGroup>
            </Col>
            <Col lg={6}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="small fw-bold text-muted text-nowrap">Từ ngày:</span>
                  <Form.Control
                    type="date"
                    className="date-input bg-light border-0"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="small fw-bold text-muted text-nowrap">Đến ngày:</span>
                  <Form.Control
                    type="date"
                    className="date-input bg-light border-0"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </Col>
            <Col lg={2} className="text-lg-end">
              <Button variant="link" className="text-decoration-none text-muted fw-bold p-0" onClick={() => { setSearchTerm(''); setStartDateFilter(''); setEndDateFilter(''); }}>
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {viewMode === 'calendar' ? (
        <Calendar 
          events={filteredPromotions} 
          onEventClick={(promo) => navigate(`/admin/promotions/edit/${promo.id}`)}
          renderEvent={renderPromotionEvent}
        />
      ) : (
        <Row className="g-4">
          {filteredPromotions.map((promo) => (
            <Col xl={4} lg={6} key={promo.id}>
              <Card className="promo-card border-0 shadow-sm h-100 p-3 bg-white">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="discount-badge shadow-sm">
                      {promo.discount_percent}%
                    </div>
                    {getStatusBadge(promo.status)}
                  </div>

                  <h5 className="fw-bold mb-1 text-dark text-truncate">{promo.title}</h5>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Film size={16} className="text-muted" />
                    <span className="text-muted small fw-bold text-truncate">Phim: {promo.movie}</span>
                  </div>

                  <div className="time-box mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Clock size={14} className="text-secondary" />
                      <span className="text-muted small">Bắt đầu: <strong className="text-dark">{promo.startDate} {promo.startTime}</strong></span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={14} className="text-danger" />
                      <span className="text-muted small">Kết thúc: <strong className="text-dark">{promo.endDate} {promo.endTime}</strong></span>
                    </div>
                  </div>

                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                    <div className="d-flex gap-2">
                      <Link to={`/admin/promotions/edit/${promo.id}`} className="btn btn-light rounded-circle p-2 text-primary border shadow-sm">
                        <Edit3 size={18} />
                      </Link>
                      <button onClick={() => handleDelete(promo.id)} className="btn btn-light rounded-circle p-2 text-danger border shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <Button variant="link" as={Link} to={`/admin/promotions/edit/${promo.id}`} className="text-decoration-none fw-bold small text-primary p-0">
                      Chi tiết <i className="fas fa-chevron-right ms-1"></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {filteredPromotions.length === 0 && (
            <Col xs={12} className="text-center py-5 text-muted">
              Không tìm thấy chương trình khuyến mãi nào
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default PromotionManagement;