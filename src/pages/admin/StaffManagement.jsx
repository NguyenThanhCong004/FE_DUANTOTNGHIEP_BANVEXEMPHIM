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
      } catch (e) {
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

  const handleDelete = async (staffId) => {
    if (!window.confirm("Xóa nhân viên này?")) return;
    try {
      const res = await apiFetch(STAFF.BY_ID(staffId), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Xóa thất bại");
        return;
      }
      setStaffDtos((prev) => prev.filter((s) => String(s.staffId) !== String(staffId)));
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const getStatusBadge = (status) => {
    return status === 'Hoạt động' ? 'bg-success' : 'bg-danger';
  };

  return (
    <div className="staff-management">
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
        
        .staff-table {
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
        
        .staff-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .staff-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .staff-details h6 {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .staff-details small {
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
        
        .action-btn:hover {
          transform: scale(1.1);
          color: white;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }
        
        .page-btn {
          min-width: 40px;
          height: 40px;
          border: 2px solid #e9ecef;
          background: white;
          color: #6c757d;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .page-btn:hover {
          background: #f8f9fa;
          border-color: #dee2e6;
          color: #495057;
        }
        
        .page-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
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
                <i className="fas fa-users me-3"></i>Quản lý nhân viên rạp
              </h1>
              <p className="mb-0" style={{ opacity: 0.9 }}>Quản lý thông tin và phân công nhân viên</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm nhân viên..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link to={addPath} className="add-btn">
                <i className="fas fa-plus"></i>
                Thêm nhân viên
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="main-container">
        {/* Table Section */}
        <div className="staff-table">
          <div className="table-header">
            <h3 className="table-title">
              <i className="fas fa-list me-2"></i>Danh sách nhân viên
            </h3>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table table">
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
                      <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                      {error}
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <i className="fas fa-users-slash"></i>
                        <h5>Không có dữ liệu nhân viên</h5>
                        <p>Chưa có nhân viên nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((staff) => (
                    <tr key={staff.id}>
                      <td className="fw-bold">#{staff.id}</td>
                      <td>
                        <div className="staff-info">
                          <div className="staff-avatar">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="staff-details">
                            <h6>{staff.name}</h6>
                            <small>@{staff.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="fas fa-envelope text-muted small"></i>
                            <small className="text-muted">{staff.email}</small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-phone text-muted small"></i>
                            <small className="text-muted">{staff.phone || 'Chưa có'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${staff.status === 'Hoạt động' ? 'status-active' : 'status-inactive'}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={viewPath(staff.id)} className="action-btn view-btn" title="Xem chi tiết">
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link to={editPath(staff.id)} className="action-btn edit-btn" title="Chỉnh sửa">
                            <i className="fas fa-edit"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
