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
    if (!window.confirm('Xóa phòng chiếu này? (Ghế trong phòng cũng bị xóa theo ràng buộc DB)')) return;
    try {
      const res = await apiFetch(ROOMS.BY_ID(roomId), { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Xóa thất bại');
        return;
      }
      setRoomsFromStore((prev) => prev.filter((r) => String(r.id) !== String(roomId)));
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-door-open me-3"></i>
              Quản lý Phòng chiếu
            </h1>
            <p className="lead">Quản lý thông tin và trạng thái phòng chiếu</p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Tìm phòng chiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm phòng chiếu"
              />
            </div>
            <Link to={`${prefix}/rooms/add`} className="admin-btn" style={{ background: 'white', color: '#6366f1' }}>
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
                          to={`${prefix}/rooms/view/${room.id}`}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
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
                          onClick={() => handleDelete(room.id)}
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

export default RoomManagement;
