import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { ROOMS } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

const RoomManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomsFromStore, setRoomsFromStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
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
        const q = effectiveCinemaId != null ? `?cinemaId=${effectiveCinemaId}` : '';
        const res = await apiFetch(`${ROOMS.LIST}${q}`);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setRoomsFromStore(
          arr.map((r) => ({
            id: r.id ?? r.roomId,
            name: r.name ?? '',
            status: r.status === 1 || r.status === 'active' ? 1 : r.status,
          }))
        );
      } catch {
        if (mounted) setRoomsFromStore([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveCinemaId]);

  const filteredRooms = roomsFromStore.filter(r =>
    String(r.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (roomId) => {
    try {
      const res = await apiFetch(ROOMS.BY_ID(roomId), { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setDeleteError(json?.message || 'Xóa thất bại');
        return;
      }
      setRoomsFromStore((prev) => prev.filter((r) => String(r.id) !== String(roomId)));
      setShowDeleteModal(false);
      setRoomToDelete(null);
      setDeleteError('');
      setToast({ show: true, message: 'Xóa phòng chiếu thành công', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch {
      setDeleteError('Không thể kết nối server');
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header mb-4">
        <div className="admin-header-content d-flex justify-content-between align-items-center flex-nowrap w-100">
          <div>
            <h1 className="h3 mb-1">
              <i className="bi bi-door-open me-2"></i>
              Quản lý Phòng chiếu
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>Quản lý thông tin và trạng thái phòng chiếu</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="admin-search-wrapper shadow-sm" style={{ maxWidth: 300 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input py-1"
                style={{ fontSize: '0.8rem' }}
                placeholder="Tìm phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link 
              to={`${prefix}/rooms/add`} 
              className="admin-btn shadow-sm d-flex align-items-center fw-bold" 
              style={{ background: 'white', color: '#6366f1', height: '38px' }}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Thêm phòng chiếu
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Danh sách phòng chiếu
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên phòng</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-door-closed"></i>
                        </div>
                        <h5 className="mb-2">Không có phòng chiếu</h5>
                        <p className="mb-0">
                          {effectiveCinemaId == null
                            ? 'Chọn rạp (Super Admin) hoặc đăng nhập tài khoản có cinemaId.'
                            : 'Chưa có phòng chiếu nào trong hệ thống'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td className="fw-bold">#{room.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="admin-table-icon-tile">
                          <i className="bi bi-film"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{room.name}</div>
                          <small className="text-muted">Phòng chiếu {room.name}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          room.status === 1
                            ? 'admin-badge admin-badge-success'
                            : 'admin-badge admin-badge-danger'
                        }
                      >
                        {room.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-action-group">
                        <Link
                          to={`${prefix}/seats`}
                          state={{ roomId: room.id }}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem sơ đồ ghế"
                        >
                          <i className="bi bi-grid-3x3-gap"></i>
                        </Link>
                        <Link
                          to={`${prefix}/rooms/edit/${room.id}`}
                          className="admin-table-action-btn admin-table-action-btn--edit"
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          type="button"
                          className="admin-table-action-btn admin-table-action-btn--danger"
                          title="Xóa"
                          onClick={() => {
                            setRoomToDelete(room);
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
      {showDeleteModal && roomToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa phòng
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa phòng chiếu này?</p>
              <div className="alert alert-warning">
                <strong>Phòng:</strong> {roomToDelete.name}
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {deleteError}
                </div>
              )}
              <p className="text-muted small mb-0">Ghế trong phòng có thể bị ảnh hưởng theo ràng buộc dữ liệu.</p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowDeleteModal(false)}>Hủy</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDelete(roomToDelete.id)}>Xóa phòng</button>
            </div>
          </div>
        </div>
      )}
      {toast.show && (
        <div
          className={`position-fixed bottom-0 start-0 m-4 admin-slide-up z-3 alert alert-${toast.type} border-0 shadow-lg d-flex align-items-center gap-2`}
          style={{ minWidth: '300px' }}
        >
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} fs-5`}></i>
          <div className="fw-bold">{toast.message}</div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
