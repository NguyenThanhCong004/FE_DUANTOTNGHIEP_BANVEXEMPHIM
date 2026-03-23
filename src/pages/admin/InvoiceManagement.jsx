import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { ORDERS_ONLINE } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

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
    switch (status) {
      case 'completed':
        return <span className="admin-badge admin-badge-success">Hoàn thành</span>;
      case 'pending':
        return <span className="admin-badge admin-badge-warning">Chờ thanh toán</span>;
      case 'cancelled':
        return <span className="admin-badge admin-badge-danger">Đã hủy</span>;
      default:
        return <span className="admin-badge admin-badge-neutral">Không xác định</span>;
    }
  };

  const statItems = [
    {
      label: 'Tổng doanh thu',
      value: `${invoiceStats.totalRev.toLocaleString('vi-VN')}đ`,
      icon: 'bi-currency-exchange',
      color: '#10b981',
    },
    {
      label: 'Chờ thanh toán',
      value: String(invoiceStats.pending),
      icon: 'bi-clock-history',
      color: '#f59e0b',
    },
    {
      label: 'Đã hoàn thành',
      value: String(invoiceStats.completed),
      icon: 'bi-receipt',
      color: '#3b82f6',
    },
    {
      label: 'Đã hủy',
      value: String(invoiceStats.cancelled),
      icon: 'bi-trash',
      color: '#ef4444',
    },
  ];

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-receipt-cutoff me-3"></i>
              Quản lý Hóa đơn
            </h1>
            <p className="lead">Theo dõi và quản lý hóa đơn vé phim</p>
          </div>
          <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm hóa đơn"
            />
          </div>
        </div>
      </div>

      <div className="admin-stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {statItems.map((s, index) => (
          <div
            key={s.label}
            className="admin-stat-card admin-slide-up"
            style={{
              '--stat-color': s.color,
              '--icon-bg': `${s.color}15`,
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div className="admin-stat-icon">
              <i className={`bi ${s.icon}`}></i>
            </div>
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Danh sách Hóa đơn
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
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
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-receipt"></i>
                        </div>
                        <h5 className="mb-2">Không có hóa đơn</h5>
                        <p className="mb-0">Chưa có hóa đơn nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.map((invoice) => (
                  <tr key={invoice.apiId}>
                    <td className="fw-bold">{invoice.displayCode}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="admin-table-icon-tile" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                          <i className="bi bi-person"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{invoice.customerName}</div>
                          <small className="text-muted">{invoice.customerEmail}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-film text-primary"></i>
                        <span>{invoice.movieTitle}</span>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {invoice.showtime}
                      </small>
                    </td>
                    <td>
                      <span className="fw-bold" style={{ color: 'var(--admin-success)' }}>
                        {invoice.total.toLocaleString()}đ
                      </span>
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td className="text-center">
                      <div className="admin-table-action-group d-inline-flex">
                        <Link
                          to={`${prefix}/invoices/view/${invoice.apiId}`}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <button
                          type="button"
                          className="admin-table-action-btn admin-table-action-btn--danger"
                          title="Xóa đơn"
                          onClick={() => handleDelete(invoice.apiId)}
                        >
                          <i className="bi bi-trash"></i>
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
