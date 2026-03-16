import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mockUsers = [
    { id: 101, name: 'Nguyễn Văn Nam', phone: '0912345678', birthDate: '15/05/1998', rank: 'Bạch kim', status: 'Hoạt động' },
    { id: 102, name: 'Trần Thị Mai', phone: '0923456789', birthDate: '22/10/2000', rank: 'Vàng', status: 'Hoạt động' },
    { id: 103, name: 'Lê Hoàng Anh', phone: '0934567890', birthDate: '05/02/1995', rank: 'Bạc', status: 'Khóa' },
    { id: 104, name: 'Phạm Thu Thủy', phone: '0945678901', birthDate: '12/12/1992', rank: 'Kim cương', status: 'Hoạt động' },
    { id: 105, name: 'Vũ Quốc Bảo', phone: '0956789012', birthDate: '30/08/1997', rank: 'Vàng', status: 'Hoạt động' },
    { id: 106, name: 'Đặng Thùy Chi', phone: '0967890123', birthDate: '18/03/2001', rank: 'Bạc', status: 'Hoạt động' },
    { id: 107, name: 'Bùi Đức Duy', phone: '0978901234', birthDate: '25/07/1994', rank: 'Bạch kim', status: 'Hoạt động' },
    { id: 108, name: 'Ngô Minh Hải', phone: '0989012345', birthDate: '02/11/1996', rank: 'Bạc', status: 'Khóa' },
    { id: 109, name: 'Lý Kim Liên', phone: '0990123456', birthDate: '09/01/1999', rank: 'Đồng', status: 'Hoạt động' },
    { id: 110, name: 'Trịnh Gia Bảo', phone: '0901234455', birthDate: '14/04/1993', rank: 'Vàng', status: 'Hoạt động' },
    { id: 111, name: 'Đỗ Anh Tuấn', phone: '0911223344', birthDate: '21/06/1997', rank: 'Bạc', status: 'Hoạt động' },
    { id: 112, name: 'Phan Minh Khôi', phone: '0922334455', birthDate: '30/12/1995', rank: 'Vàng', status: 'Hoạt động' },
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.id.toString().includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getStatusBadge = (status) => {
    return status === 'Hoạt động' ? 'bg-success' : 'bg-danger';
  };

  const getRankBadge = (rank) => {
    switch(rank) {
      case 'Kim cương': return 'text-info fw-bold';
      case 'Bạch kim': return 'text-primary fw-bold';
      case 'Vàng': return 'text-warning fw-bold';
      case 'Bạc': return 'text-secondary fw-bold';
      default: return 'text-dark fw-bold';
    }
  };

  return (
    <div className="user-management">
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
        <h2 className="mb-0 fw-bold text-dark">Quản lý người dùng</h2>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="col-md-4 px-0 position-relative">
          <input 
            type="text" 
            className="form-control black-input shadow-sm pe-5" 
            placeholder="Tìm người dùng..." 
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
                  <th className="py-3">Tên người dùng</th>
                  <th className="py-3">Số điện thoại</th>
                  <th className="py-3">Ngày sinh</th>
                  <th className="py-3">Hạng (Rank)</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-center py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((user) => (
                  <tr key={user.id}>
                    <td className="ps-4 fw-bold">{user.id}</td>
                    <td className="fw-semibold">{user.name}</td>
                    <td>{user.phone}</td>
                    <td>{user.birthDate}</td>
                    <td>
                      <span className={getRankBadge(user.rank)}>
                        {user.rank}
                      </span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${getStatusBadge(user.status)}`} style={{ minWidth: '85px', padding: '6px 12px' }}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <Link 
                        to={`/admin/users/edit/${user.id}`} 
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

export default UserManagement;