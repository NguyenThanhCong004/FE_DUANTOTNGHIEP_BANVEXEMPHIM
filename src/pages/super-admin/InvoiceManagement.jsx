import React, { useCallback, useEffect, useState } from "react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { ORDERS_ONLINE } from "../../constants/apiEndpoints";
import { Spinner, Badge } from "react-bootstrap";
import { formatDateTime, formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";
import InvoiceSummaryCard from "../../components/common/InvoiceSummaryCard";

const GlobalInvoiceManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setDetailLoading(true);
    setDetailError("");
    try {
      const res = await apiFetch(ORDERS_ONLINE.BY_ID(order.id));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setDetailError(json?.message || "Không tải được chi tiết hóa đơn");
        return;
      }
      setSelectedOrder(json?.data ?? json ?? order);
    } catch {
      setDetailError("Không kết nối được máy chủ.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetail = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setDetailError("");
  };

  // Fetch dữ liệu và sắp xếp mới nhất lên đầu
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(withQuery(ORDERS_ONLINE.LIST, { search: searchTerm }));
      const json = await res.json();
      if (res.ok) {
        // Sắp xếp theo ngày tạo giảm dần (mới nhất lên trên)
        const sorted = (json.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sorted);
      }
    } catch (error) {
      console.error("Error fetching global orders:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Xử lý xuất PDF trực tiếp có lề 15mm
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
      
      const margin = 15; 
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

  const formatMoney = (val) => formatVnd(val, { compact: true });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

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
        ) : orders.length === 0 ? (
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
                    <th style={{ width: 56 }}>STT</th>
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
                  {currentItems.map((order, index) => (
                    <tr key={order.id}>
                      <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-bold text-primary">{order.orderCode}</td>
                      <td className="small">
                        {formatDateTime(order.createdAt, { fallback: "N/A" })}
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
                          onClick={() => openOrderDetail(order)}
                        >
                          <i className="bi bi-eye me-1"></i> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={orders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="hóa đơn"
            />
          </>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="admin-modal-overlay" onClick={closeOrderDetail}>
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-receipt me-2"></i>
                Chi tiết hóa đơn #{selectedOrder.orderCode}
              </h3>
              <button className="admin-modal-close" onClick={closeOrderDetail}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body invoice-print-area">
              {detailLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : detailError ? (
                <div className="alert alert-danger mb-0">{detailError}</div>
              ) : (
                <InvoiceSummaryCard order={selectedOrder} />
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={closeOrderDetail}>
                Đóng cửa sổ
              </button>
              <button className="admin-btn admin-btn-primary btn-pdf-download" onClick={handleDownloadPDF} disabled={detailLoading || !!detailError}>
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
