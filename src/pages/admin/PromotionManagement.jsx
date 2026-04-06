import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal, Button, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { apiFetch } from '../../utils/apiClient';
import { PROMOTIONS } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

const PromotionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal States
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    if (effectiveCinemaId == null) {
      setPromotions([]);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch(`${PROMOTIONS.LIST}?cinemaId=${effectiveCinemaId}`);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      setPromotions(
        arr.map((p) => ({
          id: p.id,
          title: p.title ?? '',
          discount: p.discount_percent != null ? `${p.discount_percent}%` : (p.discountAmount != null ? `${p.discountAmount.toLocaleString()}đ` : '—'),
          startDate: p.startDate ?? '',
          endDate: p.endDate ?? '',
          status: String(p.status || '').toLowerCase().includes('đang') ? 'active' : 'upcoming',
        }))
      );
    } catch (err) {
      console.error("Lỗi tải khuyến mãi:", err);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleOpenView = async (promoId) => {
    setModalLoading(true);
    setShowViewModal(true);
    try {
      const res = await apiFetch(PROMOTIONS.BY_ID(promoId));
      const json = await res.json().catch(() => null);
      const data = json?.data ?? json;
      if (res.ok && data) {
        setSelectedPromo(data);
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết khuyến mãi:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm("Xóa nhóm khuyến mãi này?")) return;
    try {
      const res = await apiFetch(PROMOTIONS.BY_ID(promoId), { method: "DELETE" });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => String(p.id) !== String(promoId)));
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Xóa thất bại");
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const filteredPromotions = promotions.filter(p =>
    String(p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-tags-fill me-3"></i>
              Chương trình Khuyến mãi
            </h1>
            <p className="lead">Quản lý khuyến mãi và ưu đãi đặc biệt</p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Tìm khuyến mãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm khuyến mãi"
              />
            </div>
            <Link to={`${prefix}/promotions/add`} className="admin-btn" style={{ background: 'white', color: '#6366f1' }}>
              <i className="bi bi-plus-lg me-2"></i>
              Tạo khuyến mãi
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Danh sách khuyến mãi
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khuyến mãi</th>
                  <th>Giảm giá</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : effectiveCinemaId == null ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon"><i className="bi bi-building"></i></div>
                        <h5 className="mb-2">Chưa chọn rạp</h5>
                        <p className="mb-0">{isSuperAdmin ? 'Vui lòng chọn rạp ở thanh sidebar.' : 'Tài khoản chưa được gán rạp.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon"><i className="bi bi-tags"></i></div>
                        <h5 className="mb-2">Không có khuyến mãi</h5>
                        <p className="mb-0">Chưa có chương trình khuyến mãi nào cho rạp này</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPromotions.map((promo) => (
                  <tr key={promo.id}>
                    <td className="fw-bold">#{promo.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="admin-table-icon-tile"><i className="bi bi-percent"></i></div>
                        <div>
                          <div className="fw-semibold text-dark">{promo.title}</div>
                          <small className="text-muted">Chương trình ưu đãi</small>
                        </div>
                      </div>
                    </td>
                    <td><Badge bg="success" className="px-2 py-1">{promo.discount}</Badge></td>
                    <td>
                      <div className="d-flex flex-column gap-1 small text-muted">
                        <div><i className="bi bi-calendar-event me-1"></i>{promo.startDate}</div>
                        <div><i className="bi bi-calendar-check me-1"></i>{promo.endDate}</div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={promo.status === 'active' ? 'success' : 'warning'}>
                        {promo.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-table-action-group justify-content-center">
                        <button
                          onClick={() => handleOpenView(promo.id)}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <Link
                          to={`${prefix}/promotions/edit/${promo.id}`}
                          className="admin-table-action-btn admin-table-action-btn--edit"
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          type="button"
                          className="admin-table-action-btn admin-table-action-btn--danger"
                          title="Xóa"
                          onClick={() => handleDelete(promo.id)}
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

      {/* View Promotion Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Chi tiết chương trình khuyến mãi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : selectedPromo ? (
            <div className="p-2">
              <div className="bg-light p-3 rounded-3 mb-4 border-start border-primary border-4">
                <h4 className="fw-bold text-dark mb-1">{selectedPromo.title}</h4>
                <p className="text-muted mb-0">{selectedPromo.description || "Không có mô tả chi tiết."}</p>
              </div>
              <Row className="g-4">
                <Col md={6}>
                  <div className="small text-muted fw-bold mb-1 text-uppercase">Mức giảm giá</div>
                  <h5 className="fw-bold text-success">
                    {selectedPromo.discount_percent ? `${selectedPromo.discount_percent}%` : (selectedPromo.discountAmount ? `${selectedPromo.discountAmount.toLocaleString()}đ` : "—")}
                  </h5>
                </Col>
                <Col md={6}>
                  <div className="small text-muted fw-bold mb-1 text-uppercase">Trạng thái</div>
                  <Badge bg={String(selectedPromo.status || '').toLowerCase().includes('đang') ? 'success' : 'warning'} className="px-3 py-2 fs-6">
                    {selectedPromo.status || "Chưa xác định"}
                  </Badge>
                </Col>
                <Col md={6}>
                  <div className="small text-muted fw-bold mb-1 text-uppercase">Ngày bắt đầu</div>
                  <div className="fw-bold text-dark"><i className="bi bi-calendar-event me-2"></i>{formatDate(selectedPromo.startDate)}</div>
                </Col>
                <Col md={6}>
                  <div className="small text-muted fw-bold mb-1 text-uppercase">Ngày kết thúc</div>
                  <div className="fw-bold text-dark"><i className="bi bi-calendar-check me-2"></i>{formatDate(selectedPromo.endDate)}</div>
                </Col>
                <Col md={12}>
                  <hr />
                  <div className="small text-muted fw-bold mb-2 text-uppercase">Ghi chú & Điều kiện</div>
                  <div className="p-3 bg-light rounded text-muted">
                    {selectedPromo.termsAndConditions || "Áp dụng cho tất cả khách hàng khi mua vé tại rạp."}
                  </div>
                </Col>
              </Row>
            </div>
          ) : <div className="text-center py-5">Không tìm thấy dữ liệu chương trình.</div>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Đóng</Button>
          <Link to={`${prefix}/promotions/edit/${selectedPromo?.id}`} className="btn btn-primary">
            <i className="bi bi-pencil me-2"></i>Chỉnh sửa
          </Link>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PromotionManagement;
