import React, { useEffect, useState } from "react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { ORDERS_ONLINE } from "../../constants/apiEndpoints";
import { Spinner, Badge } from "react-bootstrap";

const GlobalInvoiceManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(ORDERS_ONLINE.LIST);
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
      }
    } catch (error) {
      console.error("Error fetching global orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDownloadPDF = async () => {
    const element = document.querySelector(".invoice-print-area");
    if (!element) return;

    const btn = document.querySelector(".btn-pdf-download");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang tạo PDF...';
    btn.disabled = true;

    try {
      if (!window.html2canvas) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.jspdf) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const margin = 15; // Lề 15mm cho 4 góc
      const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      pdf.save(`HoaDon_${selectedOrder.orderCode}.pdf`);

    } catch (error) {
      console.error("Lỗi khi tạo PDF:", error);
      alert("Không thể tạo file PDF. Vui lòng thử lại.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 1: return <Badge bg="success">Đã thanh toán</Badge>;
      case 2: return <Badge bg="danger">Đã hủy</Badge>;
      case 0: return <Badge bg="warning" text="dark">Chờ thanh toán</Badge>;
      default: return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const filteredOrders = orders.filter(o => 
    (o.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.cinemaName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="receipt"
      title="Quản lý hóa đơn toàn hệ thống"
      description="Xem và theo dõi tất cả giao dịch, hóa đơn từ mọi chi nhánh rạp trên toàn hệ thống."
    >
      <div className="admin-table-container">
        <div className="d-flex flex-wrap gap-3 mb-4">
          <div className="admin-search-wrapper" style={{ maxWidth: '500px', flex: '1' }}>
            <i className="bi bi-search admin-search-icon"></i>
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Tìm theo mã đơn, tên khách hàng hoặc tên rạp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="admin-btn admin-btn-outline" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise me-2"></i> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Đang tải danh sách hóa đơn hệ thống...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <i className="bi bi-receipt admin-empty-icon"></i>
            <p>Không tìm thấy hóa đơn nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Thời gian</th>
                    <th>Chi nhánh</th>
                    <th>Khách hàng</th>
                    <th className="text-end">Tổng tiền</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-bold text-primary">{order.orderCode}</td>
                      <td className="small">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{order.cinemaName}</span>
                      </td>
                      <td>
                        <div className="fw-medium">{order.customerName}</div>
                        <div className="small text-muted">{order.customerEmail}</div>
                      </td>
                      <td className="text-end fw-bold text-dark">
                        {formatMoney(order.finalAmount)}
                      </td>
                      <td className="text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="text-center">
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                        >
                          <i className="bi bi-eye me-1"></i> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="text-muted small">
                Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} của {filteredOrders.length} hóa đơn
              </span>
              <nav>
                <ul className="admin-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1}>
                      <button 
                        className={`admin-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-receipt me-2"></i>
                Chi tiết hóa đơn #{selectedOrder.orderCode}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body invoice-print-area bg-white">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-1" style={{ color: '#6366f1' }}>CINEMAX</h2>
                <h4 className="fw-bold text-dark">HÓA ĐƠN THANH TOÁN</h4>
                <p className="text-muted small">Mã hóa đơn: {selectedOrder.orderCode} | Ngày: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                <hr style={{ borderTop: '2px dashed #eee' }} />
              </div>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="text-uppercase small text-muted fw-bold mb-3">Thông tin giao dịch</h6>
                    <p className="mb-1"><strong>Mã đơn:</strong> {selectedOrder.orderCode}</p>
                    <p className="mb-1"><strong>Thời gian:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                    <p className="mb-1"><strong>Rạp:</strong> {selectedOrder.cinemaName}</p>
                    <p className="mb-0"><strong>Nhân viên:</strong> {selectedOrder.staffName}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="text-uppercase small text-muted fw-bold mb-3">Thông tin khách hàng</h6>
                    <p className="mb-1"><strong>Họ tên:</strong> {selectedOrder.customerName}</p>
                    <p className="mb-1"><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p className="mb-0"><strong>Trạng thái:</strong> {getStatusBadge(selectedOrder.status)}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3"><i className="bi bi-ticket-perforated me-2"></i>Danh sách vé xem phim</h6>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle border-bottom">
                      <thead className="table-light">
                        <tr>
                          <th>Phim</th>
                          <th>Suất chiếu</th>
                          <th>Ghế</th>
                          <th className="text-end">Giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.tickets.map((t, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{t.movieTitle}</td>
                            <td className="small">{t.showtime ? new Date(t.showtime).toLocaleString('vi-VN') : 'N/A'}</td>
                            <td><span className="badge bg-secondary">{t.seatNumber}</span></td>
                            <td className="text-end">{formatMoney(t.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedOrder.foods && selectedOrder.foods.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3"><i className="bi bi-cup-straw me-2"></i>Dịch vụ kèm theo</h6>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle border-bottom">
                      <thead className="table-light">
                        <tr>
                          <th>Sản phẩm</th>
                          <th className="text-center">Số lượng</th>
                          <th className="text-end">Đơn giá</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.foods.map((f, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{f.productName}</td>
                            <td className="text-center">{f.quantity}</td>
                            <td className="text-end">{formatMoney(f.price)}</td>
                            <td className="text-end fw-bold">{formatMoney(f.price * f.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end pt-3 border-top">
                <div className="text-end" style={{ minWidth: '250px' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính:</span>
                    <span>{formatMoney(selectedOrder.originalAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 text-danger">
                    <span>Giảm giá:</span>
                    <span>-{formatMoney(selectedOrder.discountAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between fs-5 fw-bold text-primary pt-2 border-top">
                    <span>TỔNG CỘNG:</span>
                    <span>{formatMoney(selectedOrder.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                Đóng cửa sổ
              </button>
              <button className="admin-btn admin-btn-primary btn-pdf-download" onClick={handleDownloadPDF}>
                <i className="bi bi-printer me-2"></i> In hóa đơn (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default GlobalInvoiceManagement;
