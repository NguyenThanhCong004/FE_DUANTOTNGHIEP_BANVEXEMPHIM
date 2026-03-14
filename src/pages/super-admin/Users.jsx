import React, { useState } from 'react';

const UserManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Dữ liệu mẫu cho khách hàng (Users)
  const allUsers = [
    { 
      id: 1, 
      username: 'customer01', 
      fullname: 'Trần Văn An', 
      email: 'an.tran@gmail.com', 
      phone: '0901234567', 
      avatar: 'https://ui-avatars.com/api/?name=Tran+Van+An&background=0D8ABC&color=fff', 
      status: 'Active' 
    },
    { 
      id: 2, 
      username: 'linh_chi99', 
      fullname: 'Phạm Linh Chi', 
      email: 'chi.pham@gmail.com', 
      phone: '0987654321', 
      avatar: 'https://ui-avatars.com/api/?name=Pham+Linh+Chi&background=FF4081&color=fff', 
      status: 'Active' 
    },
    { 
      id: 3, 
      username: 'hoang_long', 
      fullname: 'Lê Hoàng Long', 
      email: 'long.le@gmail.com', 
      phone: '0912345678', 
      avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Long&background=7B1FA2&color=fff',
      status: 'Inactive'
    },
    ...Array.from({ length: 25 }, (_, i) => ({
      id: i + 4,
      username: `user_test_${i + 4}`,
      fullname: `Khách hàng ${i + 4}`,
      email: `user${i + 4}@example.com`,
      phone: `03456789${(i + 10).toString().slice(0, 2)}`,
      avatar: `https://ui-avatars.com/api/?name=User+${i + 4}&background=random`,
      status: i % 4 === 0 ? 'Inactive' : 'Active'
    }))
  ];

  // Logic lọc và tìm kiếm
  const filteredUsers = allUsers.filter(user => 
    user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

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
          color: #333;
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
              {currentItems.map((user) => (
                <tr key={user.id}>
                  <td className="px-4">
                    <div className="d-flex align-items-center">
                      <img src={user.avatar} alt={user.username} className="user-avatar-img" />
                      <div>
                        <div className="fw-bold">{user.fullname}</div>
                        <div className="text-muted small">ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="fw-medium text-primary">@{user.username}</span>
                  </td>
                  <td>
                    <div className="small">
                      <div><i className="bi bi-envelope me-2"></i>{user.email}</div>
                      <div><i className="bi bi-telephone me-2"></i>{user.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                      {user.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-outline-dark" title="Chi tiết">
                        Xem 
                      </button>
                      <button className="btn btn-sm btn-outline-primary" title="Chỉnh sửa">
                        Sửa
                      </button>                    
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-muted small">
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
    </div>
  );
};

export default UserManagement;
