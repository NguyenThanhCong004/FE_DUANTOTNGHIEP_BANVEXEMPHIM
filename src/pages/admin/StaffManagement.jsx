import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mockStaff = [
    { id: 1, name: 'Nguyễn Văn A', email: 'vana@cinema.com', phone: '0901234567', role: 'Bán vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 2, name: 'Trần Thị B', email: 'thib@cinema.com', phone: '0902345678', role: 'Soát vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 3, name: 'Lê Văn C', email: 'vanc@cinema.com', phone: '0903456789', role: 'Phục vụ', status: 'Khóa', image: 'https://via.placeholder.com/40' },
    { id: 4, name: 'Phạm Minh D', email: 'minhd@cinema.com', phone: '0904567890', role: 'Bán vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 5, name: 'Hoàng Thị E', email: 'thie@cinema.com', phone: '0905678901', role: 'Soát vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 6, name: 'Đặng Văn F', email: 'vanf@cinema.com', phone: '0906789012', role: 'Phục vụ', status: 'Khóa', image: 'https://via.placeholder.com/40' },
    { id: 7, name: 'Bùi Thị G', email: 'thig@cinema.com', phone: '0907890123', role: 'Soát vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 8, name: 'Vũ Văn H', email: 'vanh@cinema.com', phone: '0908901234', role: 'Bán vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 9, name: 'Ngô Thị I', email: 'thii@cinema.com', phone: '0909012345', role: 'Phục vụ', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 10, name: 'Đỗ Văn K', email: 'vank@cinema.com', phone: '0900123456', role: 'Soát vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 11, name: 'Lý Thị L', email: 'thil@cinema.com', phone: '0901122334', role: 'Bán vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
    { id: 12, name: 'Trịnh Văn M', email: 'vanm@cinema.com', phone: '0902233445', role: 'Soát vé', status: 'Hoạt động', image: 'https://via.placeholder.com/40' },
  ];

  const filteredStaff = mockStaff.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.id.toString().includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const getStatusBadge = (status) => {
    return status === 'Hoạt động' ? 'bg-success' : 'bg-danger';
  };

  return (
    <div className="staff-management">
      <style>
        {`
          .black-input {
            border: 1px solid rgba(0,0,0,0.1) !important;
            color: #000 !important;
            font-weight: 500 !important;
            background-color: #fff !important;
            border-radius: 8px !important;
          }
          .black-input:focus {
            box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.05) !important;
            border-color: #000 !important;
          }
        `}
      </style>

      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-dark">Quản lý nhân viên rạp</h2>
        <Link 
          to="/admin/staff/add"
          className="btn btn-primary px-4 shadow-sm border-0 fw-bold d-flex align-items-center" 
          style={{ borderRadius: '10px', textDecoration: 'none' }}
        >
          <i className="fas fa-plus me-2"></i>Thêm nhân viên
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="col-md-4 px-0 position-relative">
          <input 
            type="text" 
            className="form-control black-input shadow-sm pe-5" 
            placeholder="Tìm nhân viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i 
            className="fas fa-search position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
            style={{ pointerEvents: 'none' }}
          ></i>
        </div>
      </div>

      {/* Table Section */}
      <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-dark">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr className="text-secondary small text-uppercase">
                  <th className="ps-4 py-3">ID</th>
                  <th className="py-3">Nhân viên</th>
                  <th className="py-3">Liên hệ</th>
                  <th className="py-3">Vai trò</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-center py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((staff) => (
                  <tr key={staff.id}>
                    <td className="ps-4 fw-bold">{staff.id}</td>
                    <td>
                      <div>
                        <div className="fw-bold">{staff.name}</div>
                        <small className="text-muted">{staff.email}</small>
                      </div>
                    </td>
                    <td>{staff.phone}</td>
                    <td><span className="fw-semibold">{staff.role}</span></td>
                    <td>
                      <span className={`badge rounded-pill ${getStatusBadge(staff.status)}`} style={{ minWidth: '85px', padding: '6px 12px' }}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <Link 
                        to={`/admin/staff/view/${staff.id}`} 
                        className="btn btn-sm btn-link text-info fw-bold me-2 p-0 text-decoration-none"
                      >
                        Xem
                      </Link>
                      <Link 
                        to={`/admin/staff/edit/${staff.id}`} 
                        className="btn btn-sm btn-link text-primary fw-bold p-0 text-decoration-none"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 pb-4">
          <nav>
            <ul className="pagination pagination-sm gap-2">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link rounded-circle border-0 shadow-sm" onClick={() => setCurrentPage(prev => prev - 1)}>
                  <i className="fas fa-chevron-left"></i>
                </button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button 
                    className={`page-link rounded-circle border-0 shadow-sm ${currentPage === index + 1 ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link rounded-circle border-0 shadow-sm" onClick={() => setCurrentPage(prev => prev + 1)}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
