import React, { useState } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Search, Eye, Download, Calendar, User, ShoppingBasket, Ticket, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, Hash } from 'lucide-react';

const InvoiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Dữ liệu mẫu Hóa đơn tại rạp (Counter Orders)
  const [orders] = useState([
    { 
      order_id: 'ORD-8801', 
      staff_id: 'NV-001', 
      staff_name: 'Nguyễn Minh Tuấn',
      OderDetails_food_id: 'FD-102', 
      ticket_id: 'TK-5509', 
      created_at: '2024-03-15 09:15:00', 
      original_amount: 155000, 
      discount_amount: 15000, 
      final_amount: 140000, 
      status: 'Đã thanh toán',
      payment_method: 'Tiền mặt'
    },
    { 
      order_id: 'ORD-8802', 
      staff_id: 'NV-002', 
      staff_name: 'Lê Thanh Thảo',
      OderDetails_food_id: 'FD-105', 
      ticket_id: 'TK-5510', 
      created_at: '2024-03-15 10:30:45', 
      original_amount: 90000, 
      discount_amount: 0, 
      final_amount: 90000, 
      status: 'Đã thanh toán',
      payment_method: 'Thẻ ATM'
    },
    { 
      order_id: 'ORD-8803', 
      staff_id: 'NV-001', 
      staff_name: 'Nguyễn Minh Tuấn',
      OderDetails_food_id: null, 
      ticket_id: 'TK-5511', 
      created_at: '2024-03-15 11:00:12', 
      original_amount: 75000, 
      discount_amount: 0, 
      final_amount: 75000, 
      status: 'Chờ thanh toán',
      payment_method: 'Chưa chọn'
    },
    { 
      order_id: 'ORD-8804', 
      staff_id: 'NV-003', 
      staff_name: 'Phạm Đức Anh',
      OderDetails_food_id: 'FD-200', 
      ticket_id: 'TK-5512', 
      created_at: '2024-03-15 12:45:33', 
      original_amount: 320000, 
      discount_amount: 50000, 
      final_amount: 270000, 
      status: 'Đã hủy',
      payment_method: 'Tiền mặt'
    }
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đã thanh toán': return <Badge bg="success-subtle" text="success" className="px-3 py-2 rounded-pill"><CheckCircle2 size={12} className="me-1"/> {status}</Badge>;
      case 'Chờ thanh toán': return <Badge bg="warning-subtle" text="warning" className="px-3 py-2 rounded-pill"><Clock size={12} className="me-1"/> {status}</Badge>;
      case 'Đã hủy': return <Badge bg="danger-subtle" text="danger" className="px-3 py-2 rounded-pill"><XCircle size={12} className="me-1"/> {status}</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ord.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="invoice-management text-dark pb-5">
      <style>{`
        .table-custom thead { background: #f8fafc; border-bottom: 2px solid #f1f5f9; }
        .table-custom th { font-size: 0.75rem; text-transform: uppercase; padding: 15px 20px; color: #64748b; border: none; }
        .table-custom td { padding: 18px 20px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        .order-id-txt { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0d6efd; }
        .search-container { background: #fff; border-radius: 16px; padding: 10px; border: 1px solid #e2e8f0; }
        .input-no-border { border: none; background: #f8fafc; border-radius: 10px; padding: 8px 15px 8px 40px; }
        .action-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: #f0f7ff; color: #0d6efd; border-color: #0d6efd; }
        .detail-card { background: #f8fafc; border-radius: 16px; padding: 15px; border: 1px solid #f1f5f9; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1">Quản lý hóa đơn tại rạp</h2>
          <p className="text-muted small mb-0">Theo dõi doanh thu bán vé và bắp nước trực tiếp tại quầy.</p>
        </div>
        <Button variant="outline-dark" className="rounded-3 fw-bold d-flex align-items-center gap-2">
          <Download size={18} /> Xuất Excel
        </Button>
      </div>

      <div className="search-container mb-4">
        <Row className="g-2">
          <Col md={8} className="position-relative">
            <Search size={18} className="position-absolute" style={{left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 5}} />
            <Form.Control 
              className="input-no-border w-100"
              placeholder="Tìm mã hóa đơn hoặc tên nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select 
              className="input-no-border border-0"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
              <option value="Chờ thanh toán">Chờ thanh toán</option>
              <option value="Đã hủy">Đã hủy</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
        <Table hover responsive className="table-custom mb-0">
          <thead>
            <tr>
              <th>Hóa đơn</th>
              <th>Nhân viên bán</th>
              <th>Thời gian</th>
              <th className="text-end">Số tiền</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((ord) => (
                <tr key={ord.order_id}>
                  <td>
                    <div className="order-id-txt">{ord.order_id}</div>
                    <div className="d-flex gap-2 mt-1">
                      {ord.ticket_id && <Badge bg="primary-subtle" text="primary" className="fw-normal" style={{fontSize: '0.65rem'}}>Vé: {ord.ticket_id}</Badge>}
                      {ord.OderDetails_food_id && <Badge bg="warning-subtle" text="dark" className="fw-normal" style={{fontSize: '0.65rem'}}>Food: {ord.OderDetails_food_id}</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold">{ord.staff_name}</div>
                    <div className="small text-muted">{ord.staff_id}</div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2 small text-muted fw-semibold">
                      <Calendar size={14}/> {ord.created_at}
                    </div>
                  </td>
                  <td className="text-end">
                    <div className="fw-black text-dark">{ord.final_amount.toLocaleString()}đ</div>
                    {ord.discount_amount > 0 && <div className="small text-danger">-{ord.discount_amount.toLocaleString()}đ</div>}
                  </td>
                  <td className="text-center">
                    {getStatusBadge(ord.status)}
                  </td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <OverlayTrigger overlay={<Tooltip>Chi tiết hóa đơn</Tooltip>}>
                        <button className="action-btn" onClick={() => handleViewDetail(ord)}><Eye size={18}/></button>
                      </OverlayTrigger>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <AlertCircle size={40} className="text-muted opacity-25 mb-2" />
                  <p className="text-muted small mb-0">Không tìm thấy hóa đơn nào khớp với yêu cầu.</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* MODAL CHI TIẾT HÓA ĐƠN TẠI RẠP */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered contentClassName="border-0 shadow-lg" style={{ borderRadius: '28px' }}>
        <Modal.Header closeButton className="border-0 p-4 pb-0">
          <Modal.Title className="fw-black">Hóa đơn: {selectedOrder?.order_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <div>
              <div className="detail-card mb-4 bg-primary bg-opacity-10 border-primary border-opacity-10">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-white rounded-3 shadow-sm text-primary"><User size={24}/></div>
                  <div>
                    <div className="text-muted small fw-bold text-uppercase">Nhân viên phụ trách</div>
                    <div className="fw-black">{selectedOrder.staff_name} ({selectedOrder.staff_id})</div>
                  </div>
                </div>
              </div>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="detail-card h-100">
                    <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2"><Ticket size={16}/> MÃ VÉ</div>
                    <div className="fw-bold">{selectedOrder.ticket_id || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-card h-100">
                    <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2"><ShoppingBasket size={16}/> MÃ ĐỒ ĂN</div>
                    <div className="fw-bold">{selectedOrder.OderDetails_food_id || 'Không mua'}</div>
                  </div>
                </Col>
              </Row>

              <div className="detail-card mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tổng tiền gốc</span>
                  <span className="fw-bold">{selectedOrder.original_amount.toLocaleString()}đ</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Giảm giá/Chiết khấu</span>
                  <span className="fw-bold text-danger">-{selectedOrder.discount_amount.toLocaleString()}đ</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top">
                  <span className="fw-black text-primary">TỔNG THANH TOÁN</span>
                  <span className="fw-black text-primary fs-4">{selectedOrder.final_amount.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="detail-card mb-4 bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-bold text-muted text-uppercase">Phương thức: {selectedOrder.payment_method}</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button variant="light" className="w-100 fw-bold border" onClick={() => setShowDetailModal(false)}>Đóng</Button>
                <Button variant="primary" className="w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                  <Download size={18}/> Tải về máy
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;