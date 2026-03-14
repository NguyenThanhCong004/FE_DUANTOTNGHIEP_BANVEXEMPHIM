import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Table, Badge, Button, Form, Row, Col, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { CalendarClock, Search, Plus, Edit3, Trash2, Calendar as CalendarIcon, Clock, User, List } from 'lucide-react';
import Calendar from '../../components/common/Calendar';

const ShiftManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // Default to calendar view
  const navigate = useNavigate();

  // Mock Data cấu trúc lại theo Ca
  const mockShifts = [
    { id: 1, staffName: 'Nguyễn Văn A', role: 'Bán vé', phone: '0987654321', date: '2026-03-14', shiftType: 'Ca 1', startTime: '08:00', endTime: '13:00', status: 'Đang làm' },
    { id: 2, staffName: 'Trần Thị B', role: 'Soát vé', phone: '0987654322', date: '2026-03-14', shiftType: 'Ca 1', startTime: '08:00', endTime: '13:00', status: 'Đang làm' },
    { id: 3, staffName: 'Lê Văn C', role: 'Phục vụ', phone: '0987654323', date: '2026-03-14', shiftType: 'Ca 1', startTime: '08:00', endTime: '13:00', status: 'Đang làm' },
    { id: 4, staffName: 'Phạm Minh D', role: 'Bán vé', phone: '0987654324', date: '2026-03-14', shiftType: 'Ca 2', startTime: '13:00', endTime: '18:00', status: 'Sắp tới' },
    { id: 5, staffName: 'Hoàng Thị E', role: 'Soát vé', phone: '0987654325', date: '2026-03-14', shiftType: 'Ca 2', startTime: '13:00', endTime: '18:00', status: 'Sắp tới' },
    { id: 6, staffName: 'Ngô Văn F', role: 'Phục vụ', phone: '0987654326', date: '2026-03-14', shiftType: 'Ca 2', startTime: '13:00', endTime: '18:00', status: 'Sắp tới' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đang làm': return <Badge bg="success" className="px-3 py-2 rounded-pill shadow-sm">Đang làm</Badge>;
      case 'Sắp tới': return <Badge bg="primary" className="px-3 py-2 rounded-pill shadow-sm">Sắp tới</Badge>;
      case 'Đã xong': return <Badge bg="secondary" className="px-3 py-2 rounded-pill shadow-sm">Đã xong</Badge>;
      default: return <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill shadow-sm">{status}</Badge>;
    }
  };

  const renderShiftEvent = (shift) => {
    const roleColors = {
      'Bán vé': '#0d6efd',
      'Soát vé': '#6610f2',
      'Phục vụ': '#fd7e14'
    };

    const shiftColors = {
      'Ca 1': '#e7f1ff',
      'Ca 2': '#f3e8ff',
      'Ca 3': '#fff3e0'
    };

    const roleBorderColors = {
      'Bán vé': '#0a58ca',
      'Soát vé': '#520dc2',
      'Phục vụ': '#d96a12'
    };

    return (
      <div 
        className="shift-event-item p-1 rounded mb-1 shadow-sm d-flex align-items-center gap-1 border-start"
        style={{ 
          backgroundColor: shiftColors[shift.shiftType] || '#f8f9fa',
          borderLeft: `4px solid ${roleColors[shift.role] || '#6c757d'}`,
          fontSize: '0.75rem',
          lineHeight: '1.1',
          color: '#333'
        }}
      >
        <div className="d-flex flex-column flex-grow-1 overflow-hidden">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-black text-uppercase" style={{ fontSize: '0.65rem', color: roleColors[shift.role] }}>{shift.shiftType}</span>
            <span className="badge p-0 px-1 rounded-pill" style={{ fontSize: '0.6rem', backgroundColor: roleColors[shift.role], color: '#fff' }}>{shift.role}</span>
          </div>
          <div className="fw-bold text-truncate" style={{ color: '#000' }}>{shift.staffName}</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>{shift.startTime}-{shift.endTime}</div>
        </div>
      </div>
    );
  };

  const filteredShifts = mockShifts.filter(shift => {
    const matchesSearch = shift.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      matchesDate = (shift.date >= startDateFilter && shift.date <= endDateFilter);
    } else if (startDateFilter) {
      matchesDate = (shift.date >= startDateFilter);
    } else if (endDateFilter) {
      matchesDate = (shift.date <= endDateFilter);
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="shift-management text-dark">
      <style>{`
        .shift-table thead th {
          background-color: #f8f9fa;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 1px;
          font-weight: 700;
          color: #6c757d;
          border-bottom: none;
          padding: 15px 20px;
        }
        .shift-table tbody td {
          padding: 15px 20px;
          vertical-align: middle;
          border-bottom: 1px solid #f1f1f1;
        }
        .time-badge {
          background: #f0f7ff;
          color: #0056b3;
          padding: 5px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .search-input {
          border-radius: 12px !important;
          border: 1px solid #eee !important;
          padding: 10px 15px !important;
          color: #000 !important;
          background-color: #fff !important;
        }
        .search-input:focus {
          color: #000 !important;
        }
        .search-input::placeholder {
          color: #6c757d !important;
          opacity: 0.6;
        }
        .date-filter {
          border-radius: 10px !important;
          border: 1.5px solid #eee !important;
          padding: 8px 12px !important;
          color: #000 !important;
          background-color: #f8f9fa !important;
          font-size: 0.9rem;
        }
        .date-filter:focus {
          color: #000 !important;
          background-color: #fff !important;
        }
        .nav-pills .nav-link.active {
          background-color: #0d6efd;
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2);
        }
        .nav-pills .nav-link {
          border-radius: 10px;
          padding: 10px 20px;
          font-weight: 600;
          color: #6c757d;
        }
        
        /* Calendar Styles */
        .calendar-events-layer {
          max-height: 110px;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
        }
        .calendar-events-layer::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .shift-event-item:hover {
          filter: brightness(0.95);
          transform: scale(1.02);
          transition: all 0.2s ease;
          z-index: 50;
        }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Quản lý ca làm việc</h2>
          <p className="text-muted small mb-0">Sắp xếp và theo dõi lịch trực của nhân viên rạp</p>
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
              variant={viewMode === 'list' ? 'primary' : 'light'} 
              size="sm" 
              className="d-flex align-items-center gap-2 border-0"
              onClick={() => setViewMode('list')}
            >
              <List size={18} /> Danh sách
            </Button>
          </div>
          <Link to="/admin/shifts/add" className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm border-0 rounded-3">
            <Plus size={20} /> Phân ca
          </Link>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent border-end-0 text-muted" style={{ borderRadius: '12px 0 0 12px' }}>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Tìm theo tên nhân viên..."
                  className="search-input border-start-0"
                  style={{ borderRadius: '0 12px 12px 0' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col lg={6}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="small fw-bold text-muted text-nowrap">Từ ngày:</span>
                  <Form.Control
                    type="date"
                    className="date-filter bg-light border-0"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="small fw-bold text-muted text-nowrap">Đến ngày:</span>
                  <Form.Control
                    type="date"
                    className="date-filter bg-light border-0"
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
          events={filteredShifts} 
          onEventClick={(shift) => navigate(`/admin/shifts/edit/${shift.id}`)}
          renderEvent={renderShiftEvent}
        />
      ) : (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Table hover responsive className="shift-table mb-0">
            <thead>
              <tr>
                <th>ID Ca</th>
                <th>Nhân viên</th>
                <th>Ngày trực</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="fw-bold text-muted">SH{shift.id.toString().padStart(3, '0')}</td>
                  <td>
                    <div>
                      <div className="fw-bold text-dark">{shift.staffName}</div>
                      <small className="text-muted">{shift.phone}</small>
                    </div>
                  </td>
                  <td>
                    <div className="text-dark fw-semibold">
                      {shift.date}
                    </div>
                  </td>
                  <td>
                    <div className="time-badge">
                      <Clock size={14} />
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </td>
                  <td>{getStatusBadge(shift.status)}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Link to={`/admin/shifts/edit/${shift.id}`} className="btn btn-sm btn-light rounded-3 p-2 text-primary border shadow-sm">
                        <Edit3 size={16} />
                      </Link>
                      <Button variant="light" size="sm" className="rounded-3 p-2 text-danger border shadow-sm" onClick={() => window.confirm('Xóa ca làm này?')}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShifts.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">Không tìm thấy ca làm việc nào</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ShiftManagement;