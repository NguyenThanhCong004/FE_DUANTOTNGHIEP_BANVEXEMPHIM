import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { ORDERS_ONLINE } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';
import { ReceiptText, Search, Eye, Trash2, DollarSign, User, Film, Clock } from 'lucide-react';

const InvoiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = staffSession?.cinemaId ?? selectedCinemaId ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(ORDERS_ONLINE.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];

        const formatShowtime = (iso) => {
          if (!iso) return '— —';
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return '— —';
          const date = d.toLocaleDateString('vi-VN');
          const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          return `${date} ${time}`;
        };

        const mapOrderStatus = (s) => {
          if (s === 0) return 'pending';
          if (s === 2) return 'cancelled';
          return 'completed';
        };

        if (!mounted) return;
        setInvoices(
          arr.map((o) => ({
            apiId: o.id,
            displayCode: o.orderCode ? String(o.orderCode) : `#${o.id}`,
            customerName: o.customerName || '—',
            customerEmail: o.customerEmail || '—',
            movieTitle: 'Đơn online',
            showtime: formatShowtime(o.createdAt),
            roomName: '—',
            seats: [],
            subtotal: o.originalAmount ?? 0,
            tax: o.discountAmount ?? 0,
            total: o.finalAmount ?? 0,
            status: mapOrderStatus(o.status),
            paymentMethod: 'bank_transfer',
            createdAt: o.createdAt,
          }))
        );
      } catch {
        if (mounted) setInvoices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveCinemaId]);

  const handleDelete = async (apiId) => {
    if (apiId == null) return;
    if (!window.confirm("Xóa đơn online này? Thao tác không hoàn tác.")) return;
    try {
      const res = await apiFetch(ORDERS_ONLINE.BY_ID(apiId), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Xóa thất bại");
        return;
      }
      setInvoices((prev) => prev.filter((inv) => inv.apiId !== apiId));
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return invoices.filter(invoice => 
      String(invoice.displayCode || '').toLowerCase().includes(q) ||
      String(invoice.apiId || '').toLowerCase().includes(q) ||
      String(invoice.customerName || '').toLowerCase().includes(q) ||
      String(invoice.movieTitle || '').toLowerCase().includes(q)
    );
  }, [invoices, searchTerm]);

  const invoiceStats = useMemo(() => {
    const totalRev = invoices.reduce((a, i) => a + (Number(i.total) || 0), 0);
    const pending = invoices.filter((i) => i.status === 'pending').length;
    const completed = invoices.filter((i) => i.status === 'completed').length;
    const cancelled = invoices.filter((i) => i.status === 'cancelled').length;
    return { totalRev, pending, completed, cancelled };
  }, [invoices]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="status-badge status-completed">Hoàn thành</span>;
      case 'pending':
        return <span className="status-badge status-pending">Chờ thanh toán</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Đã hủy</span>;
      default:
        return <span className="status-badge status-unknown">Không xác định</span>;
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch(method) {
      case 'credit_card':
        return <span className="payment-badge payment-card">Thẻ tín dụng</span>;
      case 'bank_transfer':
        return <span className="payment-badge payment-bank">Chuyển khoản</span>;
      case 'cash':
        return <span className="payment-badge payment-cash">Tiền mặt</span>;
      default:
        return <span className="payment-badge payment-unknown">Khác</span>;
    }
  };

  return (
    <div className="invoice-management">
      <style jsx>{`
        .admin-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem 0;
          margin-bottom: 2rem;
          border-radius: 0 0 1rem 1rem;
        }
        
        .admin-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .search-container {
          max-width: 400px;
          position: relative;
        }
        
        .search-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border-radius: 50px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
        }
        
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .add-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          color: white;
        }
        
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .invoice-table {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .table-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1.5rem;
          border-bottom: 2px solid #dee2e6;
        }
        
        .table-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }
        
        .modern-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .modern-table thead th {
          background: #f8f9fa;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          border: none;
          padding: 1rem;
        }
        
        .modern-table tbody tr {
          transition: all 0.2s ease;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .modern-table tbody tr:hover {
          background: #f8f9fa;
          transform: scale(1.01);
        }
        
        .modern-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border: none;
        }
        
        .invoice-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .invoice-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
        }
        
        .invoice-details h6 {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .invoice-details small {
          color: #6c757d;
          display: block;
          margin-top: 0.25rem;
        }
        
        .amount-display {
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        .amount-display.total {
          color: #10b981;
        }
        
        .status-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-completed {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .status-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        
        .status-cancelled {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .payment-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .payment-card {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .payment-bank {
          background: #dcfce7;
          color: #166534;
        }
        
        .payment-cash {
          background: #fef3c7;
          color: #92400e;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
          color: white;
        }
        
        .view-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .download-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .edit-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .delete-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .action-btn:hover {
          transform: scale(1.1);
          color: white;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
        
        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }
        
        .stat-card.total {
          border-left-color: #10b981;
        }
        
        .stat-card.pending {
          border-left-color: #f59e0b;
        }
        
        .stat-card.completed {
          border-left-color: #3b82f6;
        }
        
        .stat-card.cancelled {
          border-left-color: #ef4444;
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          color: #6c757d;
          font-size: 0.9rem;
        }
      `}</style>

      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: '700' }}>
                <ReceiptText className="me-3" />Quản lý Hóa đơn
              </h1>
              <p className="mb-0" style={{ opacity: 0.9 }}>Theo dõi và quản lý hóa đơn vé phim</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="search-container">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm hóa đơn..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <DollarSign />
            </div>
            <div className="stat-value">{invoiceStats.totalRev.toLocaleString('vi-VN')}đ</div>
            <div className="stat-label">Tổng doanh thu</div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Clock />
            </div>
            <div className="stat-value">{invoiceStats.pending}</div>
            <div className="stat-label">Chờ thanh toán</div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <ReceiptText />
            </div>
            <div className="stat-value">{invoiceStats.completed}</div>
            <div className="stat-label">Đã hoàn thành</div>
          </div>
          
          <div className="stat-card cancelled">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <Trash2 />
            </div>
            <div className="stat-value">{invoiceStats.cancelled}</div>
            <div className="stat-label">Đã hủy</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="invoice-table">
          <div className="table-header">
            <h3 className="table-title">
              <ReceiptText className="me-2" />Danh sách Hóa đơn
            </h3>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table table">
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Khách hàng</th>
                  <th>Phim</th>
                  <th>Suất chiếu</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <ReceiptText />
                        <h5>Không có hóa đơn</h5>
                        <p>Chưa có hóa đơn nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.map(invoice => (
                  <tr key={invoice.apiId}>
                    <td className="fw-bold">{invoice.displayCode}</td>
                    <td>
                      <div className="invoice-info">
                        <div className="invoice-avatar">
                          <User />
                        </div>
                        <div className="invoice-details">
                          <h6>{invoice.customerName}</h6>
                          <small>{invoice.customerEmail}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Film size={16} className="text-primary" />
                        <span>{invoice.movieTitle}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <small className="text-muted">
                          <Clock size={12} className="me-1" />
                          {invoice.showtime}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="amount-display total">
                        {invoice.total.toLocaleString()}đ
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="text-center">
                      <div className="action-buttons d-inline-flex">
                        <Link
                          to={`${prefix}/invoices/view/${invoice.apiId}`}
                          className="action-btn view-btn"
                          title="Xem chi tiết"
                        >
                          <Eye />
                        </Link>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          title="Xóa đơn"
                          onClick={() => handleDelete(invoice.apiId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
