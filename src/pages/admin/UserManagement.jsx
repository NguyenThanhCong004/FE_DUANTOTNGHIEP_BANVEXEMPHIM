import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { USERS } from '../../constants/apiEndpoints';
import { Users, Search, Plus, Eye, Edit3, Calendar, Phone, Mail, Star, Shield } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatBirthday = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(USERS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setUsers(
          arr.map((u) => ({
            userId: u.userId ?? u.id,
            fullname: u.fullname ?? u.username ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            birthday: u.birthday,
            status: u.status ?? 1,
            points: u.points ?? 0,
          }))
        );
      } catch {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = String(u.fullname ?? u.username ?? '').toLowerCase();
      const phone = String(u.phone ?? '');
      const idStr = String(u.userId ?? '');
      return name.includes(q) || phone.includes(q) || idStr.includes(q);
    });
  }, [searchTerm, users]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getStatusBadge = (status) => {
    switch(status) {
      case 1:
        return <span className="status-badge status-active">Hoạt động</span>;
      case 0:
        return <span className="status-badge status-inactive">Đã khóa</span>;
      default:
        return <span className="status-badge status-unknown">Không xác định</span>;
    }
  };

  return (
    <div className="user-management">
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
        
        .user-table {
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
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .user-avatar {
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
        
        .user-details h6 {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .user-details small {
          color: #6c757d;
          display: block;
          margin-top: 0.25rem;
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        .points-badge {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #92400e;
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .status-inactive {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .status-unknown {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .edit-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .delete-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }
        
        .page-btn {
          background: white;
          border: 1px solid #dee2e6;
          color: #6c757d;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .page-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #adb5bd;
        }
        
        .page-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
        }
        
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .page-info {
          color: #6c757d;
          font-size: 0.9rem;
        }
      `}</style>

      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: '700' }}>
                <Users className="me-3" />Quản lý Khách hàng
              </h1>
              <p className="mb-0" style={{ opacity: 0.9 }}>Quản lý thông tin và tài khoản người dùng</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="search-container">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link to={`${prefix}/users/add`} className="add-btn">
                <Plus />Thêm khách hàng
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {/* Table Section */}
        <div className="user-table">
          <div className="table-header">
            <h3 className="table-title">
              <Users className="me-2" />Danh sách Khách hàng
            </h3>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Ngày sinh</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Users />
                        <h5>Không có khách hàng</h5>
                        <p>Chưa có khách hàng nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map((user) => (
                  <tr key={user.userId}>
                    <td className="fw-bold">#{user.userId}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          <Users />
                        </div>
                        <div className="user-details">
                          <h6>{user.fullname}</h6>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Phone size={14} />
                          {user.phone || 'Chưa có'}
                        </div>
                        <div className="contact-item">
                          <Mail size={14} />
                          {user.email || 'Chưa có'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Calendar size={14} className="text-muted" />
                        <span>{formatBirthday(user.birthday)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="points-badge">
                        <Star size={14} />
                        {user.points || 0} điểm
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(user.status)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`${prefix}/users/view/${user.userId}`} className="action-btn view-btn" title="Xem chi tiết">
                          <Eye />
                        </Link>
                        <Link to={`${prefix}/users/edit/${user.userId}`} className="action-btn edit-btn" title="Chỉnh sửa">
                          <Edit3 />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-info">
              Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} / {filteredUsers.length} khách hàng
            </span>
            <div className="d-flex align-items-center gap-2">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >
                ←
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button 
                  key={index}
                  className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;