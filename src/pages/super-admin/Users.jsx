import React, { useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '../../utils/authStorage';
import { apiUrl } from '../../utils/apiClient';
import { USERS } from '../../constants/apiEndpoints';

const UserManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch(apiUrl(USERS.LIST), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (mounted) setAllUsers(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setAllUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Logic lọc và tìm kiếm
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((user) => {
      const fullname = String(user.fullname ?? '').toLowerCase();
      const username = String(user.username ?? '').toLowerCase();
      const email = String(user.email ?? '').toLowerCase();
      const phone = String(user.phone ?? '');
      return fullname.includes(q) || username.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [allUsers, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="user-management p-4">
      <style>{`
        .user-table-container {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          color: black !important;
        }

        .user-table-container table td,
        .user-table-container table th,
        .user-table-container table div,
        .user-table-container table span,
        .user-table-container table i {
          color: black !important;
        }

        /* Ngoại lệ cho badges trạng thái để không bị mất màu đặc trưng */
        .user-table-container .status-badge.status-active {
          background-color: #e8f5e9 !important;
          color: #2e7d32 !important;
        }

        .user-table-container .status-badge.status-inactive {
          background-color: #ffebee !important;
          color: #c62828 !important;
        }

        .user-table-container .table-light th {
          background-color: #f8f9fa !important;
          color: black !important;
          border-bottom: 2px solid #dee2e6 !important;
        }

        /* Ô tìm kiếm đồng bộ với Employee */
        .new-search-container {
          position: relative;
          max-width: 500px;
          margin-bottom: 30px;
        }

        .new-search-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px 10px 50px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .new-search-input::placeholder {
          color: #333;
        }

        .new-search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: black !important;
          font-size: 1.3rem;
          pointer-events: none;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-active {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .status-inactive {
          background-color: #ffebee;
          color: #c62828;
        }

        .user-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 12px;
          border: 1px solid #eee;
        }

        .pagination-btn {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          background: white;
          color: black;
          transition: all 0.2s;
        }

        .pagination-btn.active {
          background: #000;
          color: white;
          border-color: #000;
        }

        .pagination-btn:hover:not(.active) {
          background: #f8f9fa;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content-custom {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          position: relative;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          color: black !important;
        }

        .modal-content-custom h3,
        .modal-content-custom p,
        .modal-content-custom div,
        .modal-content-custom span,
        .modal-content-custom label,
        .modal-content-custom i {
          color: black !important;
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          border: none;
          background: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: black;
        }

        .user-detail-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 20px;
          display: block;
          border: 4px solid whitesmoke;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }

        .detail-label {
          font-weight: bold;
          color: black;
        }

        .detail-value {
          color: black;
          font-weight: 600;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="fw-bold m-0">Quản lý khách hàng</h2>
      </div>

      <div className="user-table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo tên, username, email, SĐT..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3">Tài khoản</th>
                <th className="py-3">Liên hệ</th>
                <th className="py-3">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 fw-bold text-muted">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 fw-bold text-muted">
                    Không có dữ liệu người dùng.
                  </td>
                </tr>
              ) : (
                currentItems.map((user) => {
                  const isActive = user.status === 1 || user.status === 'Active';
                  return (
                    <tr key={user.userId ?? user.id}>
                  <td className="px-4">
                    <div className="d-flex align-items-center">
                      <img src={user.avatar} alt={user.username} className="user-avatar-img" />
                      <div>
                        <div className="fw-bold">{user.fullname}</div>
                        <div className="text-dark small">ID: #{user.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="fw-medium text-dark">@{user.username}</span>
                  </td>
                  <td>
                    <div className="small">
                      <div><i className="bi bi-envelope me-2"></i>{user.email}</div>
                      <div><i className="bi bi-telephone me-2"></i>{user.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                      {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Chi tiết"
                        onClick={() => {
                          setSelectedItem(user);
                          setShowModal(true);
                        }}
                      >
                        Xem 
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-dark small">
            Hiển thị <b>{currentItems.length}</b> trên <b>{filteredUsers.length}</b> khách hàng
          </div>
          <div className="d-flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                className={`pagination-btn fw-bold ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
            
            <h3 className="text-center fw-bold mb-4">Thông Tin Khách Hàng</h3>
            
            <img src={selectedItem.avatar} alt={selectedItem.username} className="user-detail-avatar" />
            
            <div className="detail-row">
              <span className="detail-label">Họ và tên:</span>
              <span className="detail-value">{selectedItem.fullname}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Username:</span>
              <span className="detail-value">@{selectedItem.username}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{selectedItem.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Số điện thoại:</span>
              <span className="detail-value">{selectedItem.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Trạng thái:</span>
              <span className={`status-badge ${(selectedItem.status === 1 || selectedItem.status === 'Active') ? 'status-active' : 'status-inactive'}`}>
                {(selectedItem.status === 1 || selectedItem.status === 'Active') ? 'Đang hoạt động' : 'Đã khóa'}
              </span>
            </div>

            <div className="mt-4 pt-3 text-center">
              <button 
                className="btn btn-dark px-5 fw-bold"
                onClick={() => setShowModal(false)}
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
