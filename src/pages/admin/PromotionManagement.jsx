import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  /** Admin rạp: theo cinema đăng nhập. Super admin: bắt buộc chọn rạp ở sidebar. */
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      if (effectiveCinemaId == null) {
        if (mounted) {
          setPromotions([]);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await apiFetch(`${PROMOTIONS.LIST}?cinemaId=${effectiveCinemaId}`);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setPromotions(
          arr.map((p) => ({
            id: p.id,
            title: p.title ?? '',
            discount: p.discount_percent != null ? `${p.discount_percent}%` : '—',
            startDate: p.startDate ?? '',
            endDate: p.endDate ?? '',
            status: String(p.status || '').toLowerCase().includes('đang') ? 'active' : 'upcoming',
          }))
        );
      } catch {
        if (mounted) setPromotions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveCinemaId]);

  const handleDelete = async (promoId) => {
    if (!window.confirm("Xóa nhóm khuyến mãi này?")) return;
    try {
      const res = await apiFetch(PROMOTIONS.BY_ID(promoId), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Xóa thất bại");
        return;
      }
      setPromotions((prev) => prev.filter((p) => String(p.id) !== String(promoId)));
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const filteredPromotions = promotions.filter(p =>
    String(p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : effectiveCinemaId == null ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-building"></i>
                        </div>
                        <h5 className="mb-2">Chưa chọn rạp</h5>
                        <p className="mb-0">
                          {isSuperAdmin
                            ? 'Vui lòng chọn rạp ở thanh sidebar để xem khuyến mãi theo rạp.'
                            : 'Tài khoản chưa được gán rạp (cinemaId).'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-tags"></i>
                        </div>
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
                        <div className="admin-table-icon-tile">
                          <i className="bi bi-percent"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{promo.title}</div>
                          <small className="text-muted">Chương trình ưu đãi</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-success">{promo.discount}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <small className="text-muted">
                          <i className="bi bi-calendar-event me-1"></i>
                          {promo.startDate}
                        </small>
                        <small className="text-muted">
                          <i className="bi bi-calendar-check me-1"></i>
                          {promo.endDate}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          promo.status === 'active'
                            ? 'admin-badge admin-badge-success'
                            : 'admin-badge admin-badge-warning'
                        }
                      >
                        {promo.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-action-group">
                        <Link
                          to={`${prefix}/promotions/view/${promo.id}`}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
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
    </div>
  );
};

export default PromotionManagement;
