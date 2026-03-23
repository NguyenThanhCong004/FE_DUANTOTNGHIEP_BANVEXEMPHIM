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
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => {
                            setSelectedItem(cinema);
                            setShowModal(true);
                          }}
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => navigate('/super-admin/cinemas/create', { state: { editData: cinema } })}
                        >
                          Sửa
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
    </AdminPanelPage>
  );
};

export default CinemaManagement;
