import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin-design-system.css';
import { apiFetch } from '../../utils/apiClient';
import { STAFF } from '../../constants/apiEndpoints';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const { selectedCinemaId } = useSuperAdminCinema();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      if (selectedCinemaId == null) {
        if (mounted) {
          setAllEmployees([]);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await apiFetch(STAFF.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        const norm = (r) => String(r || "").replace(/^ROLE_/i, "").toUpperCase();
        const adminsOnly = arr.filter((s) => norm(s.role) === "ADMIN");
        const forCinema = adminsOnly.filter(
          (s) => String(s.cinemaId ?? "") === String(selectedCinemaId)
        );
        setAllEmployees(
          forCinema.map((s) => ({
            id: s.staffId,
            name: s.fullname || s.username || "—",
            email: s.email || "—",
            phone: s.phone || "—",
            role: "ADMIN",
            status: s.status === 1 ? "Active" : "Inactive",
            birthday: s.birthday,
            cinemaId: s.cinemaId,
            avatar: s.avatar,
          }))
        );
      } catch {
        if (mounted) setAllEmployees([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedCinemaId]);

  // Logic lọc và tìm kiếm
  const filteredEmployees = allEmployees.filter(emp => 
    String(emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp.phone || '').includes(searchTerm)
  );

  // Sắp xếp: ADMIN lên đầu
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-page employee-management admin-fade-in">
      {/* Header */}
      <div className="admin-action-bar">
        <h2 className="admin-section-title m-0">
          <i className="bi bi-person-badge"></i>
          Quản trị viên rạp
        </h2>
        <button 
          className="admin-btn admin-btn-success"
          disabled={selectedCinemaId == null}
          title={selectedCinemaId == null ? "Chọn rạp trên header trước" : undefined}
          onClick={() => navigate('/super-admin/employees/create')}
        >
          <i className="bi bi-person-plus me-2"></i>
          Thêm quản trị viên
        </button>
      </div>

      {/* Table Container */}
      <div className="admin-table-container">
        {/* Search Bar */}
        <div className="admin-search-wrapper mb-4" style={{ maxWidth: '400px' }}>
          <i className="bi bi-search admin-search-icon"></i>
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Đang tải nhân viên...</p>
          </div>
        ) : selectedCinemaId == null ? (
          <div className="admin-empty">
            <i className="bi bi-building admin-empty-icon"></i>
            <p className="fw-semibold">Chưa chọn rạp</p>
            <p className="text-muted small mb-0">
              Super Admin: chọn rạp trên <strong>thanh header</strong> (dropdown &quot;Chọn rạp&quot;) để xem quản trị
              viên theo <code>cinemaId</code>.
            </p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="admin-empty">
            <i className="bi bi-inbox admin-empty-icon"></i>
            <p>Chưa có quản trị viên rạp (ADMIN) cho rạp này</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nhân viên</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((emp) => (
                    <tr key={emp.id}>
                      <td className="fw-bold">#{emp.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-person text-muted"></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{emp.name}</div>
                            <small className="text-muted">{emp.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{emp.phone}</td>
                      <td>
                        <span className="admin-badge admin-badge-primary">Quản trị viên rạp</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${emp.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {emp.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-outline me-2"
                          onClick={() => {
                            setSelectedItem(emp);
                            setShowModal(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                          Xem
                        </button>
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => navigate('/super-admin/employees/create', { state: { editId: emp.id } })}
                        >
                          <i className="bi bi-pencil"></i>
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="text-muted small">
                Tổng cộng: {sortedEmployees.length} quản trị viên
              </span>
              <nav>
                <ul className="admin-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1}>
                      <button 
                        className={`admin-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => paginate(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-person-circle me-2"></i>
                Chi tiết nhân viên
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-4">
                <div className="col-md-4 text-center">
                  <div className="bg-light rounded-4 p-4 mb-3">
                    <i className="bi bi-person-circle" style={{ fontSize: '5rem', color: '#6366f1' }}></i>
                  </div>
                  <span className="admin-badge admin-badge-primary">Quản trị viên rạp</span>
                </div>
                <div className="col-md-8">
                  <h4 className="fw-bold mb-3">{selectedItem.name}</h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <p className="mb-2"><strong className="text-muted">Email:</strong> {selectedItem.email}</p>
                      <p className="mb-2"><strong className="text-muted">Số điện thoại:</strong> {selectedItem.phone}</p>
                      <p className="mb-2">
                        <strong className="text-muted">Trạng thái:</strong>
                        <span className={`ms-2 admin-badge ${selectedItem.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {selectedItem.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </p>
                      <p className="mb-0"><strong className="text-muted">Vai trò:</strong> Quản trị viên rạp (ADMIN)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate('/super-admin/employees/create', { state: { editId: selectedItem.id } });
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
