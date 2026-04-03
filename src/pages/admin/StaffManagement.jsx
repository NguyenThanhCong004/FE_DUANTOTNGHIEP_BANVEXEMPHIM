import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { STAFF } from '../../constants/apiEndpoints';
import { getStoredStaff } from '../../utils/authStorage';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();

  const addPath = `${prefix}/staff/add`;
  const viewPath = (id) => `${prefix}/staff/view/${id}`;
  const editPath = (id) => `${prefix}/staff/edit/${id}`;

  const [staffDtos, setStaffDtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân viên #${id} không?`)) return;
    try {
      const res = await apiFetch(STAFF.BY_ID(id), { method: 'DELETE' });
      if (res.ok) {
        setStaffDtos((prev) => prev.filter((s) => s.staffId !== id));
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Xóa nhân viên thất bại");
      }
    } catch {
      alert("Không thể kết nối tới server để xóa nhân viên");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(STAFF.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        let data = Array.isArray(list) ? list : [];
        if (!isSuperAdmin && staffSession?.cinemaId != null) {
          data = data.filter((s) => String(s.cinemaId) === String(staffSession.cinemaId));
        } else if (isSuperAdmin && selectedCinemaId != null) {
          data = data.filter((s) => String(s.cinemaId) === String(selectedCinemaId));
        }
        const norm = (r) => String(r || "").replace(/^ROLE_/i, "").toUpperCase();
        // Danh sách nhân viên sàn: loại ADMIN / SUPER_ADMIN (họ nằm ở trang Quản trị viên rạp).
        data = data.filter((s) => {
          const r = norm(s.role);
          return r !== "ADMIN" && r !== "SUPER_ADMIN";
        });
        setStaffDtos(data);
      } catch {
        if (mounted) {
          setStaffDtos([]);
          setError('Không tải được danh sách nhân viên.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSuperAdmin, staffSession?.cinemaId, selectedCinemaId]);

  const staffUI = useMemo(() => {
    return staffDtos.map((s) => ({
      id: s.staffId,
      name: s.fullname ?? "",
      username: s.username ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      role: s.role ?? "",
      status: s.status === 0 ? "Khóa" : "Hoạt động",
      image: s.avatar ?? "https://via.placeholder.com/40",
    }));
  }, [staffDtos]);

  const filteredStaff = staffUI.filter((staff) => {
    const q = searchTerm.toLowerCase();
    return (
      staff.name.toLowerCase().includes(q) ||
      staff.username.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      String(staff.id).includes(searchTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-people-fill me-3"></i>
              Quản lý nhân viên rạp
            </h1>
            <p className="lead">Quản lý thông tin và phân công nhân viên</p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm nhân viên"
              />
            </div>
            <Link to={addPath} className="admin-btn" style={{ background: "white", color: "#6366f1" }}>
              <i className="bi bi-person-plus-fill me-2"></i>
              Thêm nhân viên
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Danh sách nhân viên
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nhân viên</th>
                  <th>Liên hệ</th>
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
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                      {error}
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-people"></i>
                        </div>
                        <h5 className="mb-2">Không có dữ liệu nhân viên</h5>
                        <p className="mb-0">Chưa có nhân viên nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((staff) => (
                    <tr key={staff.id}>
                      <td className="fw-bold">#{staff.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="admin-table-avatar">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{staff.name}</div>
                            <small className="text-muted">@{staff.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-envelope text-muted small"></i>
                            <small className="text-muted">{staff.email}</small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-telephone text-muted small"></i>
                            <small className="text-muted">{staff.phone || 'Chưa có'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            staff.status === 'Hoạt động'
                              ? 'admin-badge admin-badge-success'
                              : 'admin-badge admin-badge-danger'
                          }
                        >
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-action-group">
                          <Link
                            to={viewPath(staff.id)}
                            className="admin-table-action-btn admin-table-action-btn--view"
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            to={editPath(staff.id)}
                            className="admin-table-action-btn admin-table-action-btn--edit"
                            title="Chỉnh sửa"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            type="button"
                            className="admin-table-action-btn admin-table-action-btn--danger"
                            title="Xóa nhân viên"
                            onClick={() => handleDelete(staff.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination-wrap">
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`admin-pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="admin-pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

export default StaffManagement;
