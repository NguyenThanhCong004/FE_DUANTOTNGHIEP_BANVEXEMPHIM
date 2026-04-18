import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { ReceiptText } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';
import { ORDERS_ONLINE } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

function formatMoneyInvoice(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return `${Number(v).toLocaleString('vi-VN')} đ`;
}

function formatDtInvoice(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN');
}

function orderStatusLabel(s) {
  if (s === 0) return 'Chờ thanh toán';
  if (s === 2) return 'Đã hủy';
  return 'Hoàn thành';
}

const InvoiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailErr, setDetailErr] = useState('');

  const openOrderDetail = async (orderId) => {
    setShowDetailModal(true);
    setDetailOrder(null);
    setDetailErr('');
    setDetailLoading(true);
    try {
      const res = await apiFetch(ORDERS_ONLINE.BY_ID(orderId));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setDetailErr(json?.message || 'Không tải được đơn');
        return;
      }
      setDetailOrder(json?.data ?? json);
    } catch {
      setDetailErr('Không thể kết nối server');
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
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = staffSession?.cinemaId ?? selectedCinemaId ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const query = effectiveCinemaId ? `?cinemaId=${effectiveCinemaId}` : '';
        const res = await apiFetch(`${ORDERS_ONLINE.LIST}${query}`);
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
            movieTitle: o.tickets?.[0]?.movieTitle || (o.foods?.length > 0 ? 'Chỉ đặt đồ ăn' : 'Đơn online'),
            showtime: formatShowtime(o.createdAt),
            total: o.finalAmount ?? 0,
            status: mapOrderStatus(o.status),
            createdAt: o.createdAt,
            cinemaName: o.cinemaName,
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

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return invoices.filter(invoice =>
      String(invoice.displayCode || '').toLowerCase().includes(q) ||
      String(invoice.apiId || '').toLowerCase().includes(q) ||
      String(invoice.customerName || '').toLowerCase().includes(q) ||
      String(invoice.movieTitle || '').toLowerCase().includes(q)
    );
  }, [invoices, searchTerm]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
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
                ) : currentItems.length === 0 ? (
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
                ) : currentItems.map((invoice) => (
                  <tr key={invoice.apiId}>
                    <td className="fw-bold">{invoice.displayCode}</td>
                    <td>
                      <div className="fw-semibold text-dark">{invoice.customerName}</div>
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
                        <button
                          type="button"
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                          onClick={() => openOrderDetail(invoice.apiId)}
                        >
                          <i className="bi bi-eye"></i>
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

      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span className="admin-pagination-meta">
            Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredInvoices.length)} / {filteredInvoices.length}{' '}
            hóa đơn
          </span>
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                type="button"
                className={`admin-pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      <Modal show={showDetailModal} onHide={closeOrderDetail} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-primary mb-0">
            <ReceiptText size={22} />
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
            <div className="invoice-detail-content">
              <div className="row g-3">
                <div className="col-md-6">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Thông tin chung</h6>
                  <dl className="row mb-0 small">
                    <dt className="col-5 text-muted">Mã đơn:</dt>
                    <dd className="col-7 fw-semibold">{detailOrder.orderCode || `#${detailOrder.id}`}</dd>
                    <dt className="col-5 text-muted">Thời gian đặt:</dt>
                    <dd className="col-7">{formatDtInvoice(detailOrder.createdAt)}</dd>
                    <dt className="col-5 text-muted">Rạp chiếu:</dt>
                    <dd className="col-7 text-primary fw-bold">{detailOrder.cinemaName || '—'}</dd>
                    <dt className="col-5 text-muted">Nhân viên:</dt>
                    <dd className="col-7">{detailOrder.staffName || 'Đặt online'}</dd>
                    <dt className="col-5 text-muted">Trạng thái:</dt>
                    <dd className="col-7">{getStatusBadge(detailOrder.status === 0 ? 'pending' : detailOrder.status === 2 ? 'cancelled' : 'completed')}</dd>
                  </dl>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Khách hàng</h6>
                  <dl className="row mb-0 small">
                    <dt className="col-5 text-muted">Họ tên:</dt>
                    <dd className="col-7">{detailOrder.customerName || '—'}</dd>
                    <dt className="col-5 text-muted">Email:</dt>
                    <dd className="col-7 text-break">{detailOrder.customerEmail || '—'}</dd>
                  </dl>
                </div>

                <div className="col-12">
                  <h6 className="fw-bold border-bottom pb-2 mb-3 mt-2">Chi tiết vé phim</h6>
                  {detailOrder.tickets && detailOrder.tickets.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered small">
                        <thead className="bg-light">
                          <tr>
                            <th>Phim</th>
                            <th>Suất chiếu</th>
                            <th className="text-center">Ghế</th>
                            <th className="text-end">Giá gốc</th>
                            <th className="text-end">Khuyến mãi</th>
                            <th className="text-end">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailOrder.tickets.map((t, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{t.movieTitle}</td>
                              <td>{formatDtInvoice(t.showtime)}</td>
                              <td className="text-center"><span className="badge bg-secondary">{t.seatNumber}</span></td>
                              <td className="text-end">{formatMoneyInvoice(t.originalPrice)}</td>
                              <td className="text-end text-danger">-{formatMoneyInvoice(t.promotionDiscount)}</td>
                              <td className="text-end fw-bold">{formatMoneyInvoice(t.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="small text-muted italic">Không có thông tin vé</p>
                  )}
                </div>

                {detailOrder.foods && detailOrder.foods.length > 0 && (
                  <div className="col-12">
                    <h6 className="fw-bold border-bottom pb-2 mb-3 mt-2">Bắp nước / Combo</h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered small">
                        <thead className="bg-light">
                          <tr>
                            <th>Sản phẩm</th>
                            <th className="text-center">Số lượng</th>
                            <th className="text-end">Đơn giá</th>
                            <th className="text-end">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailOrder.foods.map((f, idx) => (
                            <tr key={idx}>
                              <td>{f.productName}</td>
                              <td className="text-center">{f.quantity}</td>
                              <td className="text-end">{formatMoneyInvoice(f.price)}</td>
                              <td className="text-end fw-bold">{formatMoneyInvoice(f.price * f.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="col-12 mt-3">
                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="text-muted">Tổng tiền tạm tính:</span>
                      <span>{formatMoneyInvoice(detailOrder.originalAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-muted">Giảm giá / Voucher:</span>
                      <span className="text-danger">-{formatMoneyInvoice(detailOrder.discountAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 fw-bold">
                      <span>Tổng thanh toán:</span>
                      <span className="text-success fs-5">{formatMoneyInvoice(detailOrder.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={closeOrderDetail}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => window.print()} className="d-none d-print-inline-block">
            <i className="bi bi-printer me-2"></i>In hóa đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;
