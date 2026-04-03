import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { USERS } from '../../constants/apiEndpoints';

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
    switch (status) {
      case 1:
        return <span className="admin-badge admin-badge-success">Hoạt động</span>;
      case 0:
        return <span className="admin-badge admin-badge-danger">Đã khóa</span>;
      default:
        return <span className="admin-badge admin-badge-neutral">Không xác định</span>;
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-people-fill me-3"></i>
              Quản lý Khách hàng
            </h1>
            <p className="lead">Quản lý thông tin và tài khoản người dùng</p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Tìm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm khách hàng"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-people me-2 text-primary"></i>
            Danh sách Khách hàng
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
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
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-people"></i>
                        </div>
                        <h5 className="mb-2">Không có khách hàng</h5>
                        <p className="mb-0">Chưa có khách hàng nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map((user) => (
                  <tr key={user.userId}>
                    <td className="fw-bold">#{user.userId}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="admin-table-icon-tile">
                          <i className="bi bi-person"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{user.fullname}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-telephone"></i>
                          {user.phone || 'Chưa có'}
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-envelope"></i>
                          {user.email || 'Chưa có'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar-event text-muted"></i>
                        <span>{formatBirthday(user.birthday)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-points-badge">
                        <i className="bi bi-star-fill"></i>
                        {user.points || 0} điểm
                      </span>
                    </td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      <div className="admin-table-action-group">
                        <Link
                          to={`${prefix}/users/view/${user.userId}`}
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                          to={`${prefix}/users/edit/${user.userId}`}
                          className="admin-table-action-btn admin-table-action-btn--edit"
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span className="admin-pagination-meta">
            Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} / {filteredUsers.length}{' '}
            khách hàng
          </span>
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                type="button"
                className={`admin-pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
