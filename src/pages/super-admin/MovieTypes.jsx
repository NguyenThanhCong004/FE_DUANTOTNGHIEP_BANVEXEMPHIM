import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MovieTypeManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Dữ liệu ảo cho thể loại phim
  const [genres] = useState([
    { id: 1, name: 'Hành động' }, { id: 2, name: 'Tình cảm' },
    { id: 3, name: 'Kinh dị' }, { id: 4, name: 'Hoạt hình' },
    { id: 5, name: 'Hài hước' }, { id: 6, name: 'Khoa học viễn tưởng' },
    { id: 7, name: 'Tâm lý' }, { id: 8, name: 'Phiêu lưu' },
    { id: 9, name: 'Gia đình' }, { id: 10, name: 'Tài liệu' }
  ]);

  // Logic lọc và tìm kiếm
  const filteredGenres = genres.filter(genre => 
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGenres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGenres.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="movie-type-management p-4">
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
          transition: all 0.2s ease;
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
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: black;
          color: white;
        }

        .genre-badge {
          background: #f8f9fa;
          padding: 6px 15px;
          border-radius: 8px;
          font-weight: 600;
          border: 1px solid #dee2e6;
          color: black;
        }

        /* Đồng bộ phân trang với trang Users/Employees */
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
          transition: all 0.2s;
        }

        .pagination-btn.active {
          background: black;
          color: white;
        }

        .pagination-btn:hover:not(.active) {
          background: whitesmoke;
        }
        
        /* Ép buộc màu chữ bảng luôn là đen */
        .table tbody td {
          color: black !important;
        }
        .table thead th {
          color: black !important;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Quản lý loại phim</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/movie-types/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm thể loại
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm nhanh tên thể loại..."
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
                <th className="py-3 text-center" style={{ width: '100px' }}>STT</th>
                <th className="py-3 px-4">Tên thể loại</th>
                <th className="py-3 text-center" style={{ width: '150px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((genre, index) => (
                <tr key={genre.id}>
                  <td className="text-center fw-bold text-dark">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className="px-4">
                    <span className="genre-badge">{genre.name}</span>
                  </td>
                  <td className="text-center">
                    <button 
                      className="btn btn-sm btn-outline-primary fw-bold"
                      onClick={() => navigate('/super-admin/movie-types/create', { state: { editData: genre } })}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang đồng bộ */}
        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-dark small">
            Tổng cộng: <b>{filteredGenres.length}</b> thể loại phim
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

export default MovieTypeManagement;
