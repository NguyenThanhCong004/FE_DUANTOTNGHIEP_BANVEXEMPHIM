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
    <div className="room-management">
      <style jsx>{`
        .admin-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem 0;
          margin-bottom: 2rem;
          border-radius: 0 0 1rem 1rem;
        }
        
        .admin-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .search-container {
          max-width: 400px;
          position: relative;
        }
        
        .search-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border-radius: 50px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
        }
        
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .add-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: none;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
          color: white;
        }
        
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .room-table {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .table-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1.5rem;
          border-bottom: 2px solid #dee2e6;
        }
        
        .table-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }
        
        .modern-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .modern-table thead th {
          background: #f8f9fa;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          border: none;
          padding: 1rem;
        }
        
        .modern-table tbody tr {
          transition: all 0.2s ease;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .modern-table tbody tr:hover {
          background: #f8f9fa;
          transform: scale(1.01);
        }
        
        .modern-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border: none;
        }
        
        .room-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .room-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
        }
        
        .room-details h6 {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .room-details small {
          color: #6c757d;
          display: block;
          margin-top: 0.25rem;
        }
        
        .status-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-active {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }
        
        .status-inactive {
          background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
          color: white;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
          color: white;
        }
        
        .view-btn {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        }
        
        .edit-btn {
          background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        }
        
        .delete-btn {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        }
        
        .action-btn:hover {
          transform: scale(1.1);
          color: white;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }
        
        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
      `}</style>

      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: '700' }}>
                <i className="fas fa-door-open me-3"></i>Quản lý Phòng chiếu
              </h1>
              <p className="mb-0" style={{ opacity: 0.9 }}>Quản lý thông tin và trạng thái phòng chiếu</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm phòng chiếu..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link to={`${prefix}/rooms/add`} className="add-btn">
                <i className="fas fa-plus"></i>
                Thêm phòng chiếu
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {/* Table Section */}
        <div className="room-table">
          <div className="table-header">
            <h3 className="table-title">
              <i className="fas fa-list me-2"></i>Danh sách phòng chiếu
            </h3>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table table">
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
                      <div className="empty-state">
                        <i className="fas fa-door-closed"></i>
                        <h5>Không có phòng chiếu</h5>
                        <p>{effectiveCinemaId == null ? 'Chọn rạp (Super Admin) hoặc đăng nhập tài khoản có cinemaId.' : 'Chưa có phòng chiếu nào trong hệ thống'}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRooms.map(room => (
                  <tr key={room.id}>
                    <td className="fw-bold">#{room.id}</td>
                    <td>
                      <div className="room-info">
                        <div className="room-avatar">
                          <i className="fas fa-film"></i>
                        </div>
                        <div className="room-details">
                          <h6>{room.name}</h6>
                          <small>Phòng chiếu {room.name}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${room.status === 1 ? 'status-active' : 'status-inactive'}`}>
                        {room.status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`${prefix}/rooms/view/${room.id}`} className="action-btn view-btn" title="Xem chi tiết">
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link to={`${prefix}/rooms/edit/${room.id}`} className="action-btn edit-btn" title="Chỉnh sửa">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button 
                          className="action-btn delete-btn" 
                          title="Xóa"
                          onClick={() => handleDelete(room.id)}
                        >
                          <i className="fas fa-trash"></i>
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
