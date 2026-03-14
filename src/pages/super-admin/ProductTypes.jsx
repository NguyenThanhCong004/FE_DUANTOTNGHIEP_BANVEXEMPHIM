import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductTypeManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Dữ liệu mẫu cho loại sản phẩm
  const [productTypes] = useState([
    { id: 1, name: 'Bắp (Popcorn)' },
    { id: 2, name: 'Nước uống (Drink)' },
    { id: 3, name: 'Combo Bắp Nước' },
    { id: 4, name: 'Đồ ăn nhẹ (Snack)' },
    { id: 5, name: 'Quà tặng (Merchandise)' },
  ]);

  // Logic lọc
  const filteredTypes = productTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="product-type-management p-4">
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
          <h2 className="fw-bold m-0 text-dark">Quản lý loại sản phẩm</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/product-types/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm loại sản phẩm
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm tên loại sản phẩm..."
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
                <th className="py-3 px-4">Tên loại sản phẩm</th>
                <th className="py-3 text-center" style={{ width: '150px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((type, index) => (
                <tr key={type.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td className="px-4 fw-bold">{type.name}</td>
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
            Tổng cộng: <b>{filteredTypes.length}</b> loại sản phẩm
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

export default ProductTypeManagement;
