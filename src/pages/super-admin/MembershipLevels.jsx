import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MembershipLevelManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Dữ liệu mẫu cho mức độ hội viên
  const [levels] = useState([
    { id: 1, rank_name: 'MEMBER', min_spending: 0, description: 'Hạng thành viên mới đăng ký', discount_percent: 0, bonus_point: 1 },
    { id: 2, rank_name: 'SILVER', min_spending: 2000000, description: 'Hạng bạc dành cho khách hàng thân thiết', discount_percent: 5, bonus_point: 2 },
    { id: 3, rank_name: 'GOLD', min_spending: 5000000, description: 'Hạng vàng với nhiều ưu đãi hấp dẫn', discount_percent: 10, bonus_point: 3 },
    { id: 4, rank_name: 'DIAMOND', min_spending: 10000000, description: 'Hạng kim cương cao cấp nhất', discount_percent: 15, bonus_point: 5 },
  ]);

  // Logic lọc
  const filteredLevels = levels.filter(level => 
    level.rank_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLevels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="membership-management p-4">
      <style>{`
        .table-container {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

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

        .btn-add {
          background: blue;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
        }

        .btn-add:hover {
          background: black;
          color: white;
        }

        .rank-badge {
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.85rem;
          background: #333;
          color: #fff;
          text-transform: uppercase;
        }

        .pagination-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 2px solid black;
          background: white;
          color: black;
          font-weight: bold;
        }

        .pagination-btn.active {
          background: black;
          color: white;
        }

        .table tbody td {
          color: black !important;
          padding: 15px 20px;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Quản lý mức độ hội viên</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/membership-levels/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm mức độ mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm tên hạng hội viên..."
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
                <th className="py-3 text-center" style={{ width: '80px' }}>STT</th>
                <th className="py-3">Tên hạng</th>
                <th className="py-3 text-end">Chi tiêu tối thiểu</th>
                <th className="py-3">Mô tả</th>
                <th className="py-3 text-center">Giảm giá (%)</th>
                <th className="py-3 text-center">Điểm thưởng</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((level, index) => (
                <tr key={level.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td>
                    <span className="rank-badge">{level.rank_name}</span>
                  </td>
                  <td className="text-end fw-bold text-primary">
                    {level.min_spending.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="small text-muted" style={{ maxWidth: '200px' }}>{level.description}</td>
                  <td className="text-center fw-bold">{level.discount_percent}%</td>
                  <td className="text-center fw-bold text-success">x{level.bonus_point}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-dark" title="Sửa">
                      Sửa 
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-muted small">
            Tổng cộng: <b>{filteredLevels.length}</b> mức độ hội viên
          </div>
          <div className="d-flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
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

export default MembershipLevelManagement;
