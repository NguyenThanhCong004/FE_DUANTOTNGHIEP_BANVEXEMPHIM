import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { CINEMAS } from '../../constants/apiEndpoints';

const CinemaManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cinemaToDelete, setCinemaToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(CINEMAS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setCinemas(
          arr.map((c) => ({
            id: c.cinemaId ?? c.id,
            name: c.name ?? '',
            address: c.address ?? '',
            status: c.status === 1 ? 'Active' : 'Inactive',
          }))
        );
      } catch {
        if (mounted) setCinemas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCinemas = cinemas.filter(cinema =>
    String(cinema.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(cinema.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCinemas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCinemas.length / itemsPerPage);

  const handleDeleteCinema = async (cinema) => {
    try {
      const res = await apiFetch(CINEMAS.BY_ID(cinema.id), {
        method: "DELETE"
      });
      
      if (res.ok) {
        // Refresh danh sách
        const refreshRes = await apiFetch(CINEMAS.LIST);
        const json = await refreshRes.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        setCinemas(
          arr.map((c) => ({
            id: c.cinemaId ?? c.id,
            name: c.name ?? '',
            address: c.address ?? '',
            status: c.status === 1 ? 'Active' : 'Inactive',
          }))
        );
        setShowDeleteModal(false);
        setCinemaToDelete(null);
        setDeleteError('');
        setSuccessMessage(`Đã xóa rạp "${cinema.name}" thành công!`);
        
        // Clear success message sau 3 giây
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Xử lý error từ BE
        const json = await res.json().catch(() => null);
        setDeleteError(json?.message || "Xóa rạp thất bại");
        setSuccessMessage('');
      }
    } catch (error) {
      console.error("Error deleting cinema:", error);
      setDeleteError("Không thể kết nối tới server");
      setSuccessMessage('');
    }
  };

  const openDeleteModal = (cinema) => {
    setCinemaToDelete(cinema);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCinemaToDelete(null);
    setDeleteError('');
  };

  return (
    <AdminPanelPage
      icon="building"
      title="Quản lý rạp"
      description="Danh sách cụm rạp trong hệ thống."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: 'white', color: '#6366f1' }}
          onClick={() => navigate('/super-admin/cinemas/create')}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Thêm rạp mới
        </button>
      }
    >
      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách rạp
          </h4>
          <span className="text-muted small">Tổng: {filteredCinemas.length} cụm rạp</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tên rạp hoặc địa chỉ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm rạp"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>STT</th>
                  <th>Tên cụm rạp</th>
                  <th>Địa chỉ chi tiết</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      Đang tải danh sách rạp…
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      Không có dữ liệu rạp.
                    </td>
                  </tr>
                ) : currentItems.map((cinema, index) => (
                  <tr key={cinema.id}>
                    <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                    <td className="fw-semibold">{cinema.name}</td>
                    <td>{cinema.address}</td>
                    <td>
                      <span
                        className={
                          cinema.status === 'Active'
                            ? 'admin-badge admin-badge-success'
                            : 'admin-badge admin-badge-danger'
                        }
                      >
                        {cinema.status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1 flex-wrap">
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => {
                            setSelectedItem(cinema);
                            setShowModal(true);
                          }}
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => navigate('/super-admin/cinemas/create', { state: { editData: cinema } })}
                          title="Sửa rạp"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => openDeleteModal(cinema)}
                          title="Xóa rạp"
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

          {totalPages > 1 && (
            <div className="admin-pagination-wrap mt-3">
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    className={`admin-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedItem && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setShowModal(false)}
        >
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi tiết cụm rạp</h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-form-label mb-1">Tên cụm rạp</p>
              <p className="fw-bold mb-3">{selectedItem.name}</p>
              <p className="admin-form-label mb-1">Địa chỉ</p>
              <p className="mb-3">{selectedItem.address}</p>
              <p className="admin-form-label mb-1">Trạng thái</p>
              <span
                className={
                  selectedItem.status === 'Active'
                    ? 'admin-badge admin-badge-success'
                    : 'admin-badge admin-badge-danger'
                }
              >
                {selectedItem.status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
              </span>
              <p className="text-muted small mt-3 mb-0">
                Thông tin cơ sở vật chất, số phòng chiếu có thể bổ sung sau.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa cinema */}
      {showDeleteModal && cinemaToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa Rạp
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa cụm rạp này?</p>
              <div className="alert alert-warning">
                <strong>Tên rạp:</strong> {cinemaToDelete.name}<br/>
                <strong>Địa chỉ:</strong> {cinemaToDelete.address}<br/>
                <strong>Trạng thái:</strong> <span className={`admin-badge ${cinemaToDelete.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                  {cinemaToDelete.status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {deleteError}
                </div>
              )}
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Hành động này không thể hoàn tác. Tất cả phòng chiếu, suất chiếu và lịch trình của rạp này sẽ bị ảnh hưởng.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={closeDeleteModal}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteCinema(cinemaToDelete)}
              >
                <i className="bi bi-trash me-2"></i>
                Xóa rạp
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default CinemaManagement;
