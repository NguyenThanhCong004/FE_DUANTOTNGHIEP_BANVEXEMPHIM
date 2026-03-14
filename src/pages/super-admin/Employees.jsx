import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  // Dữ liệu ảo (Mock Data)
  const allEmployees = [
    { id: 1, name: 'Nguyễn Văn A', email: 'admin1@gmail.com', role: 'ADMIN', phone: '0901234567', status: 'Active' },
    { id: 2, name: 'Trần Thị B', email: 'admin2@gmail.com', role: 'ADMIN', phone: '0907654321', status: 'Active' },
    { id: 3, name: 'Lê Văn C', role: 'STAFF', email: 'staff1@gmail.com', phone: '0912345678', status: 'Active' },
    { id: 4, name: 'Phạm Minh D', role: 'STAFF', email: 'staff2@gmail.com', phone: '0918765432', status: 'Inactive' },
    { id: 5, name: 'Hoàng Anh E', role: 'STAFF', email: 'staff3@gmail.com', phone: '0922334455', status: 'Active' },
    ...Array.from({ length: 25 }, (_, i) => ({
      id: i + 6,
      name: `Nhân viên ${i + 6}`,
      email: `staff${i + 6}@gmail.com`,
      role: i < 2 ? 'ADMIN' : 'STAFF',
      phone: `09334455${(i + 10).toString().slice(0, 2)}`,
      status: 'Active'
    }))
  ];

  // Logic lọc và tìm kiếm
  const filteredEmployees = allEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone.includes(searchTerm)
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
    <div className="employee-management p-4">
      <style>{`
        .table-container {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          color: black !important;
        }

        .table-container table td,
        .table-container table th,
        .table-container table div,
        .table-container table span,
        .table-container table i {
          color: black !important;
        }

        /* Ngoại lệ cho badges và trạng thái */
        .table-container .role-badge.role-admin {
          background: #000 !important;
          color: #fff !important;
        }

        .table-container .role-badge.role-staff {
          background: #eee !important;
          color: #000 !important;
          border: 1px solid #ccc !important;
        }

        .table-container .status-active {
          color: #28a745 !important;
          font-weight: 500;
        }

        .table-container .status-inactive {
          color: #dc3545 !important;
          font-weight: 500;
        }

        .table-container .table-light th {
          background-color: #f8f9fa !important;
          color: black !important;
          border-bottom: 2px solid #dee2e6 !important;
        }

        /* Ô tìm kiếm mới */
        .new-search-container {
          position: relative;
          max-width: 500px;
          margin-bottom: 30px;
        }

        .new-search-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px 10px 50px;
          background-color: whitesmoke !important; /* Nền Whitesmoke */
          border: 2px solid black !important; /* Viền đen */
          border-radius: 10px;
          color: black !important; /* Chữ đen */
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
          color: black !important; /* Kính lúp đen */
          font-size: 1.3rem;
          pointer-events: none;
        }

        .role-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .role-admin { background: #000; color: #fff; }
        .role-staff { background: #eee; color: #000; border: 1px solid #ccc; }
        
        .status-active { color: #28a745; font-weight: 500; }
        .status-inactive { color: #dc3545; font-weight: 500; }
        
        .btn-add {
          background: blue;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .btn-add:hover {
          opacity: 0.8;
          color: white;
          background: black;
        }

        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }

        .custom-modal-content {
          background: white;
          border-radius: 15px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          padding: 30px;
          border: 2px solid black;
          color: black !important;
        }

        .custom-modal-content h2,
        .custom-modal-content h3,
        .custom-modal-content p,
        .custom-modal-content div,
        .custom-modal-content span,
        .custom-modal-content strong,
        .custom-modal-content label,
        .custom-modal-content i {
          color: black !important;
        }

        .close-modal {
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 2rem;
          cursor: pointer;
          color: black;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0">Quản lý nhân viên</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/employees/create')}
        >
          <i className="bi bi-person-plus me-2 fs-5"></i>
          Thêm nhân viên
        </button>
      </div>

      <div className="table-container">
        {/* Thanh tìm kiếm MỚI */}
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo tên, email, số điện thoại..."
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
                <th className="py-3">ID</th>
                <th className="py-3">Nhân viên</th>
                <th className="py-3">Liên hệ</th>
                <th className="py-3">Vai trò</th>
                <th className="py-3">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((emp) => (
                <tr key={emp.id}>
                  <td className="fw-bold">#{emp.id}</td>
                  <td>
                    <div className="fw-bold">{emp.name}</div>
                    <div className="small text-dark">{emp.email}</div>
                  </td>
                  <td>{emp.phone}</td>
                  <td>
                    <span className={`role-badge ${emp.role === 'ADMIN' ? 'role-admin' : 'role-staff'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td>
                    <span className={emp.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {emp.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => {
                          setSelectedItem(emp);
                          setShowModal(true);
                        }}
                      >
                        Xem
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => navigate('/super-admin/employees/create', { state: { editData: emp } })}
                      >
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {showModal && selectedItem && (
          <div className="custom-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-modal" onClick={() => setShowModal(false)}>&times;</span>
              <h2 className="fw-bold mb-4">Chi tiết nhân viên</h2>
              <div className="row g-3">
                <div className="col-md-4 text-center">
                  <div className="bg-light rounded border p-3 mb-3">
                    <i className="bi bi-person-circle" style={{ fontSize: '5rem' }}></i>
                  </div>
                  <span className={`role-badge ${selectedItem.role === 'ADMIN' ? 'role-admin' : 'role-staff'}`}>
                    {selectedItem.role}
                  </span>
                </div>
                <div className="col-md-8">
                  <h3 className="text-dark fw-bold mb-3">{selectedItem.name}</h3>
                  <div className="row g-3">
                    <div className="col-12">
                      <p><strong>Email:</strong> {selectedItem.email}</p>
                      <p><strong>Số điện thoại:</strong> {selectedItem.phone}</p>
                      <p><strong>Trạng thái:</strong> 
                        <span className={selectedItem.status === 'Active' ? 'ms-2 status-active' : 'ms-2 status-inactive'}>
                          {selectedItem.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </p>
                      <p><strong>Vai trò:</strong> {selectedItem.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phân trang */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-dark small">
            Tổng cộng: {sortedEmployees.length} nhân viên
          </div>
          <nav>
            <ul className="pagination mb-0 gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1} className="page-item">
                  <button 
                    className="page-link fw-bold" 
                    style={
                      currentPage === i + 1 
                        ? { backgroundColor: 'black', color: 'white', border: '2px solid black', borderRadius: '8px' } 
                        : { backgroundColor: 'white', color: 'black', border: '2px solid black', borderRadius: '8px' }
                    }
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

      </div>
    </div>
  );
};

export default EmployeeManagement;
