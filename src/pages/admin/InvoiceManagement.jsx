import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { apiFetch, withQuery } from '../../utils/apiClient';
import { ORDERS_ONLINE } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';
import { formatDateTime, formatVnd } from '../../utils/formatters';
import { apiMessage, MESSAGES } from '../../utils/uiMessages';
import AdminPagination from '../../components/admin/AdminPagination';
import InvoiceSummaryCard from '../../components/common/InvoiceSummaryCard';

const InvoiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailErr, setDetailErr] = useState('');
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith('/super-admin');

  const openOrderDetail = async (orderId) => {
    setShowDetailModal(true);
    setDetailOrder(null);
    setDetailErr('');
    setDetailLoading(true);
    try {
      const res = await apiFetch(ORDERS_ONLINE.BY_ID(orderId));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setDetailErr(apiMessage(json, 'Không tải được đơn'));
        return;
      }
      setDetailOrder(json?.data ?? json);
    } catch {
      setDetailErr(MESSAGES.networkError);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetail = () => {
    setShowDetailModal(false);
    setDetailOrder(null);
    setDetailErr('');
  };

  const staffSession = getStoredStaff();
  const { selectedCinemaId, selectedCinemaName } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? (selectedCinemaId ?? null) : (staffSession?.cinemaId ?? null);
  const requiresCinemaSelection = effectiveCinemaId == null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      if (requiresCinemaSelection) {
        setInvoices([]);
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch(withQuery(ORDERS_ONLINE.LIST, {
          cinemaId: effectiveCinemaId,
          search: searchTerm,
        }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];

        const formatShowtime = (iso) => formatDateTime(iso);

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
            movieTitle: o.tickets?.[0]?.movieTitle || (o.foods?.length > 0 ? 'Chỉ đặt đồ ăn' : 'Đơn online'),
            showtime: formatShowtime(o.createdAt),
            total: o.finalAmount ?? 0,
            status: mapOrderStatus(o.status),
            createdAt: o.createdAt,
            cinemaName: o.cinemaName,
            cinemaId: o.cinemaId,
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
  }, [effectiveCinemaId, requiresCinemaSelection, searchTerm]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [invoices]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, effectiveCinemaId]);

  const invoiceStats = useMemo(() => {
    // Chỉ cộng dồn doanh thu nếu trạng thái là 'completed'
    const totalRev = invoices.reduce((a, i) => {
      if (i.status === 'completed') {
        return a + (Number(i.total) || 0);
      }
      return a;
    }, 0);
    
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
      value: formatVnd(invoiceStats.totalRev),
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
              Quản lý Hóa đơn
            </h1>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
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
            </div>
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            Danh sách Hóa đơn
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
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
                    <td colSpan={8} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                        </div>
                        <h5 className="mb-2">
                          {requiresCinemaSelection ? 'Chưa chọn rạp' : 'Không có hóa đơn'}
                        </h5>
                        <p className="mb-0">
                          {requiresCinemaSelection
                            ? (isSuperAdmin
                                ? 'Vui lòng chọn rạp trên header để xem hóa đơn của rạp đó.'
                                : 'Tài khoản quản lý chưa được gán rạp, không thể tải hóa đơn.')
                            : 'Chưa có hóa đơn nào trong rạp này'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map((invoice, index) => (
                  <tr key={invoice.apiId}>
                    <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                    <td className="fw-bold">{invoice.displayCode}</td>
                    <td>
                      <div className="fw-semibold text-dark">{invoice.customerName}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span>{invoice.movieTitle}</span>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {invoice.showtime}
                      </small>
                    </td>
                    <td>
                      <span className="fw-bold" style={{ color: 'var(--admin-success)' }}>
                        {formatVnd(invoice.total)}
                      </span>
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          title="Xem chi tiết"
                          onClick={() => openOrderDetail(invoice.apiId)}
                        >Xem</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredInvoices.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="hóa đơn"
      />

      <Modal show={showDetailModal} onHide={closeOrderDetail} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-primary mb-0">
            Chi tiết hóa đơn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark">
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : detailErr ? (
            <p className="text-danger mb-0">{detailErr}</p>
          ) : !detailOrder ? (
            <p className="text-muted mb-0">Không có dữ liệu</p>
          ) : (
            <InvoiceSummaryCard order={detailOrder} />
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={closeOrderDetail}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => window.print()} className="d-none d-print-inline-block">In hóa đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;
