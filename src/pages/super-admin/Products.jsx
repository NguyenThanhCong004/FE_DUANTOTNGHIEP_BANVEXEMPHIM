import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 8;

  // Dữ liệu mẫu cho sản phẩm
  const [products] = useState([
    { 
      id: 1, 
      name: 'Bắp rang bơ (M)', 
      description: 'Bắp rang bơ vị truyền thống size vừa', 
      price: 45000, 
      image: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?q=80&w=200&auto=format&fit=crop', 
      status: 'Active' 
    },
    { 
      id: 2, 
      name: 'Coca Cola 600ml', 
      description: 'Nước uống giải khát Coca Cola đóng chai', 
      price: 25000, 
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop', 
      status: 'Active' 
    },
    { 
      id: 3, 
      name: 'Combo Solo', 
      description: '1 Bắp lớn + 1 Nước lớn', 
      price: 65000, 
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=200&auto=format&fit=crop', 
      status: 'Active' 
    },
    { 
      id: 4, 
      name: 'Bắp phô mai (L)', 
      description: 'Bắp rang vị phô mai đặc biệt size lớn', 
      price: 55000, 
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=200&auto=format&fit=crop', 
      status: 'Inactive' 
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: i + 5,
      name: `Sản phẩm mẫu ${i + 5}`,
      description: 'Mô tả chi tiết sản phẩm mẫu...',
      price: 30000 + i * 5000,
      image: 'https://via.placeholder.com/100',
      status: i % 3 === 0 ? 'Inactive' : 'Active'
    }))
  ]);

  // Logic lọc
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="product-management p-4">
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

        .product-img-mini {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .status-active { color: #2e7d32; background: #e8f5e9; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }
        .status-inactive { color: #c62828; background: #ffebee; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }

        .price-text { font-weight: 700; color: black; }

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
        }

        .modal-content-custom {
          background: white;
          padding: 30px;
          border-radius: 20px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          color: black !important;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Quản lý sản phẩm</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/products/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm sản phẩm mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm tên sản phẩm..."
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
                <th className="py-3">Sản phẩm</th>
                <th className="py-3">Mô tả</th>
                <th className="py-3 text-end">Giá bán (VNĐ)</th>
                <th className="py-3 text-center">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((product, index) => (
                <tr key={product.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img src={product.image} alt={product.name} className="product-img-mini" />
                      <div className="fw-bold">{product.name}</div>
                    </div>
                  </td>
                  <td className="small text-dark" style={{ maxWidth: '250px' }}>{product.description}</td>
                  <td className="text-end price-text">
                    {product.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="text-center">
                    <span className={product.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {product.status === 'Active' ? 'Đang bán' : 'Ngưng bán'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedItem(product);
                          setShowModal(true);
                        }}
                      >
                        Xem
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Sửa"
                        onClick={() => navigate('/super-admin/products/create', { state: { editData: product } })}
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

        {/* Modal Chi tiết */}
        {showModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
              <div className="modal-header-custom">
                <h4 className="m-0 fw-bold">Chi Tiết Sản Phẩm</h4>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body-custom">
                <div className="row">
                  <div className="col-md-5">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name} 
                      className="img-fluid rounded-4 border shadow-sm mb-3"
                    />
                  </div>
                  <div className="col-md-7">
                    <div className="detail-info">
                      <label>Tên sản phẩm:</label>
                      <p className="fw-bold fs-5 text-dark">{selectedItem.name}</p>
                      
                      <label>Giá bán:</label>
                      <p className="fw-bold text-dark fs-5">{selectedItem.price.toLocaleString('vi-VN')} đ</p>
                      
                      <label>Trạng thái:</label>
                      <div>
                        <span className={selectedItem.status === 'Active' ? 'status-active' : 'status-inactive'}>
                          {selectedItem.status === 'Active' ? 'Đang bán' : 'Ngưng bán'}
                        </span>
                      </div>
                      
                      <label className="mt-3">Mô tả:</label>
                      <p className="text-dark">{selectedItem.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer-custom">
                <button className="btn btn-dark px-4 fw-bold" onClick={() => setShowModal(false)}>ĐÓNG</button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1050;
            backdrop-filter: blur(5px);
          }
          .modal-content-custom {
            background: white;
            padding: 30px;
            border-radius: 20px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            color: black !important;
          }
          .modal-header-custom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .detail-info label {
            font-size: 0.8rem;
            text-transform: uppercase;
            color: black !important;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-top: 10px;
            display: block;
          }
          .modal-footer-custom {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #f0f0f0;
            text-align: right;
          }
        `}</style>

        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-dark small">
            Tổng cộng: <b>{filteredProducts.length}</b> sản phẩm
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

export default ProductManagement;
