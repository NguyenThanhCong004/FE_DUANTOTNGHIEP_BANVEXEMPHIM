import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiFetch, withQuery } from '../../utils/apiClient';
import { ROOMS, ROOM_CLOSURE } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';
import { apiMessage, MESSAGES } from '../../utils/uiMessages';
import AdminPagination from '../../components/admin/AdminPagination';

const ROOM_STATUS_CLOSED = 2;

const RoomManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [roomsFromStore, setRoomsFromStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useAdminToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [roomToClose, setRoomToClose] = useState(null);
  const [closeReason, setCloseReason] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closingBusy, setClosingBusy] = useState(false);

  const effectiveCinemaId = staffSession?.cinemaId ?? selectedCinemaId ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(withQuery(ROOMS.LIST, {
          cinemaId: effectiveCinemaId,
          search: searchTerm,
        }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setRoomsFromStore(
          arr.map((r) => ({
            id: r.id ?? r.roomId,
            name: r.name ?? '',
            status: Number.isFinite(Number(r.status)) ? Number(r.status) : 0,
            roomTypeName: r.roomTypeName ?? null,
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
  }, [effectiveCinemaId, searchTerm]);

  const filteredRooms = roomsFromStore
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  const handleDelete = async (roomId) => {
    try {
      const res = await apiFetch(ROOMS.BY_ID(roomId), { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setDeleteError(apiMessage(json, 'Xóa phòng chiếu thất bại'));
        return;
      }
      setRoomsFromStore((prev) => prev.filter((r) => String(r.id) !== String(roomId)));
      setShowDeleteModal(false);
      setRoomToDelete(null);
      setDeleteError('');
      showToast('Xóa phòng chiếu thành công');
    } catch {
      setDeleteError(MESSAGES.networkError);
    }
  };

  const submitCloseRoom = async () => {
    if (!roomToClose) return;
    if (!closeReason.trim()) {
      setCloseError('Vui lòng nhập lý do đóng phòng');
      return;
    }
    setClosingBusy(true);
    setCloseError('');
    try {
      const res = await apiFetch(ROOM_CLOSURE.CLOSE(roomToClose.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: closeReason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCloseError(apiMessage(json, 'Đóng phòng thất bại'));
        return;
      }
      setRoomsFromStore((prev) => prev.map((r) => (
        String(r.id) === String(roomToClose.id) ? { ...r, status: ROOM_STATUS_CLOSED } : r
      )));
      setShowCloseModal(false);
      setRoomToClose(null);
      setCloseReason('');
      showToast('Đã đóng phòng tạm thời');
      navigate(`${prefix}/rooms/${roomToClose.id}/closure`);
    } catch {
      setCloseError(MESSAGES.networkError);
    } finally {
      setClosingBusy(false);
    }
  };

  const handleReopenRoom = async (room) => {
    try {
      const res = await apiFetch(ROOM_CLOSURE.REOPEN(room.id), { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(apiMessage(json, 'Mở lại phòng thất bại'), 'error');
        return;
      }
      setRoomsFromStore((prev) => prev.map((r) => (
        String(r.id) === String(room.id) ? { ...r, status: 1 } : r
      )));
      showToast(json?.message || 'Đã mở lại phòng');
    } catch {
      showToast(MESSAGES.networkError, 'error');
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header mb-4">
        <div className="admin-header-content d-flex justify-content-between align-items-center flex-nowrap w-100">
          <div>
            <h1 className="h3 mb-1">
              Quản lý Phòng chiếu
            </h1>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="admin-search-wrapper shadow-sm" style={{ maxWidth: 300 }}>
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
              style={{ background: 'var(--admin-bg-card)', color: '#6366f1', height: '38px' }}
            >
              Thêm phòng chiếu
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            Danh sách phòng chiếu
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
                  <th>Tên phòng</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
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
                ) : currentItems.map((room, index) => (
                  <tr key={room.id}>
                    <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="fw-semibold text-dark">{room.name}</div>
                    </td>
                    <td>
                      {room.roomTypeName
                        ? <span className="admin-badge admin-badge-info">{room.roomTypeName}</span>
                        : <span className="text-muted small">Chưa phân loại</span>}
                    </td>
                    <td>
                      <span
                        className={
                          room.status === ROOM_STATUS_CLOSED
                            ? 'admin-badge admin-badge-warning'
                            : room.status === 1
                              ? 'admin-badge admin-badge-success'
                              : 'admin-badge admin-badge-danger'
                        }
                      >
                        {room.status === ROOM_STATUS_CLOSED
                          ? 'Đóng tạm thời (bảo trì)'
                          : room.status === 1
                            ? 'Hoạt động'
                            : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <Link
                          to={`${prefix}/seats`}
                          state={{ roomId: room.id }}
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          title="Xem sơ đồ ghế"
                        >Xem</Link>
                        <Link
                          to={`${prefix}/rooms/edit/${room.id}`}
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          title="Chỉnh sửa"
                        >Sửa</Link>
                        {room.status === ROOM_STATUS_CLOSED ? (
                          <>
                            <Link
                              to={`${prefix}/rooms/${room.id}/closure`}
                              className="admin-btn admin-btn-sm admin-btn-warning"
                              title="Xử lý dời/hủy vé bị ảnh hưởng"
                            >Xử lý dời vé</Link>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              title="Mở lại phòng"
                              onClick={() => handleReopenRoom(room)}
                            >Mở lại phòng</button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            title="Đóng phòng tạm thời (hỏng ghế/sự cố)"
                            onClick={() => {
                              setRoomToClose(room);
                              setCloseReason('');
                              setCloseError('');
                              setShowCloseModal(true);
                            }}
                          >Đóng phòng</button>
                        )}
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          title="Xóa"
                          onClick={() => {
                            setRoomToDelete(room);
                            setDeleteError('');
                            setShowDeleteModal(true);
                          }}
                        >Xóa</button>
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
        totalItems={filteredRooms.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="phòng chiếu"
      />
      {showDeleteModal && roomToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
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
      {showCloseModal && roomToClose && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => !closingBusy && setShowCloseModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="mb-0">Đóng phòng tạm thời</h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowCloseModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="alert alert-warning">
                <strong>Phòng:</strong> {roomToClose.name}
              </div>
              <p className="text-muted small">
                Phòng sẽ ngừng nhận đặt/bán vé mới ngay lập tức. Sau khi đóng, bạn sẽ được chuyển sang màn hình
                xử lý dời/hủy các vé đã bán cho các suất sắp chiếu trong phòng này.
              </p>
              <label className="form-label fw-semibold">Lý do đóng phòng</label>
              <textarea
                className="form-control"
                rows={3}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="VD: Ghế C5, C6 bị hỏng, cần sửa chữa"
              />
              {closeError && (
                <div className="alert alert-danger mt-3 mb-0">{closeError}</div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowCloseModal(false)} disabled={closingBusy}>Hủy</button>
              <button type="button" className="admin-btn admin-btn-warning" onClick={submitCloseRoom} disabled={closingBusy}>
                {closingBusy ? 'Đang đóng...' : 'Xác nhận đóng phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastComponent />
    </div>
  );
};

export default RoomManagement;
