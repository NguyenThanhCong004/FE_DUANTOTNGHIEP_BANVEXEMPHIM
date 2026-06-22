import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal, Button, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiFetch, withQuery } from '../../utils/apiClient';
import { PROMOTIONS } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';
import AdminPagination from '../../components/admin/AdminPagination';

const PromotionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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
  const { showToast, ToastComponent } = useAdminToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    if (effectiveCinemaId == null) {
      setPromotions([]);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch(withQuery(PROMOTIONS.LIST, {
        cinemaId: effectiveCinemaId,
        search: searchTerm,
      }));
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      setPromotions(
        arr.map((p) => {
          const label = String(p.status ?? '');
          let statusKey = 'upcoming';
          if (label.includes('Đang diễn ra')) statusKey = 'active';
          else if (label.includes('Đã kết thúc')) statusKey = 'ended';
          return {
            id: p.id,
            title: p.title ?? '',
            discount: p.discount_percent != null ? `${p.discount_percent}%` : (p.discountAmount != null ? `${p.discountAmount.toLocaleString()}đ` : '—'),
            startDate: p.startDate ?? '',
            endDate: p.endDate ?? '',
            status: statusKey,
          };
        })
      );
    } catch (err) {
      console.error("Lỗi tải khuyến mãi:", err);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId, searchTerm]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleOpenView = async (promoId) => {
    setSelectedPromo(null);
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
    try {
      const res = await apiFetch(PROMOTIONS.BY_ID(promoId), { method: "DELETE" });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => String(p.id) !== String(promoId)));
        setShowDeleteModal(false);
        setPromoToDelete(null);
        setDeleteError('');
        showToast('Xóa khuyến mãi thành công');
      } else {
        const json = await res.json().catch(() => null);
        setDeleteError(json?.message || "Xóa thất bại");
      }
    } catch {
      setDeleteError("Không thể kết nối server");
    }
  };

  const filteredPromotions = promotions
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  /** Danh sách tên phim áp dụng từ API (camelCase hoặc snake_case). */
  const appliedMovieLabels = (p) => {
    if (!p) return [];
    const titles = p.selectedMovieTitles ?? p.selected_movie_titles;
    const ids = p.selectedMovieIds ?? p.selected_movie_ids;
    if (Array.isArray(titles) && titles.length > 0) {
      return titles.filter(Boolean).map(String);
    }
    if (Array.isArray(ids) && ids.length > 0) {
      return ids.map((id) => `Phim #${id}`);
    }
    return [];
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
                  <th style={{ width: 56 }}>STT</th>
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
                        <p className="mb-0">{isSuperAdmin ? 'Vui lòng chọn rạp trên header.' : 'Tài khoản chưa được gán rạp.'}</p>
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
                ) : currentItems.map((promo, index) => (
                  <tr key={promo.id}>
                    <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
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
                      <Badge bg={promo.status === 'active' ? 'success' : promo.status === 'ended' ? 'secondary' : 'warning'}>
                        {promo.status === 'active' ? 'Đang diễn ra' : promo.status === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra'}
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
                          title={promo.status === 'active' ? 'Không thể xóa khi khuyến mãi đang diễn ra' : 'Xóa'}
                          disabled={promo.status === 'active'}
                          style={promo.status === 'active' ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                          onClick={() => {
                            if (promo.status === 'active') return;
                            setPromoToDelete(promo);
                            setDeleteError('');
                            setShowDeleteModal(true);
                          }}
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

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPromotions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="khuyến mãi"
      />

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
                  {(() => {
                    const st = String(selectedPromo.status || '');
                    const isActive = st.includes('Đang diễn ra');
                    const isEnded = st.includes('Đã kết thúc');
                    return (
                      <Badge bg={isActive ? 'success' : isEnded ? 'secondary' : 'warning'} className="px-3 py-2 fs-6">
                        {selectedPromo.status || 'Chưa xác định'}
                      </Badge>
                    );
                  })()}
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
                  <hr className="my-2" />
                  <div className="small text-muted fw-bold mb-2 text-uppercase d-flex align-items-center gap-2">
                    <i className="bi bi-film text-primary"></i>
                    Phim áp dụng
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {appliedMovieLabels(selectedPromo).length > 0 ? (
                      appliedMovieLabels(selectedPromo).map((name, idx) => (
                        <Badge key={`${idx}-${name}`} bg="primary" className="fw-normal px-3 py-2 rounded-pill">
                          {name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted small">Chưa có danh sách phim từ máy chủ.</span>
                    )}
                  </div>
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
      {showDeleteModal && promoToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa khuyến mãi
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa chương trình này?</p>
              <div className="alert alert-warning">
                <strong>Khuyến mãi:</strong> {promoToDelete.title}
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowDeleteModal(false)}>Hủy</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDelete(promoToDelete.id)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      <ToastComponent />
    </div>
  );
};

export default PromotionManagement;
