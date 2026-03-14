import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CinemaManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  // Dữ liệu mẫu cho rạp chiếu phim
  const [cinemas] = useState([
    { id: 1, name: 'CGV Vincom Center', address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', status: 'Active' },
    { id: 2, name: 'Lotte Cinema Gò Vấp', address: '242 Nguyễn Văn Lượng, Gò Vấp, TP.HCM', status: 'Active' },
    { id: 3, name: 'BHD Star Thảo Điền', address: 'Tầng 5, Vincom Mega Mall, Thảo Điền, Quận 2, TP.HCM', status: 'Active' },
    { id: 4, name: 'Galaxy Nguyễn Du', address: '116 Nguyễn Du, Quận 1, TP.HCM', status: 'Inactive' },
  ]);

  // Logic lọc
  const filteredCinemas = cinemas.filter(cinema => 
    cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cinema.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCinemas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCinemas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="cinema-management p-4">
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

        .status-active { 
          color: #2e7d32; 
          background: #e8f5e9;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.85rem;
        }
        
        .status-inactive { 
          color: #c62828; 
          background: #ffebee;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.85rem;
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
          <h2 className="fw-bold m-0 text-dark">Quản lý rạp</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/cinemas/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm rạp mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo tên rạp hoặc địa chỉ..."
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
                <th className="py-3">Tên cụm rạp</th>
                <th className="py-3">Địa chỉ chi tiết</th>
                <th className="py-3 text-center">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((cinema, index) => (
                <tr key={cinema.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td className="fw-bold">{cinema.name}</td>
                  <td>{cinema.address}</td>
                  <td className="text-center">
                    <span className={cinema.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {cinema.status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedItem(cinema);
                          setShowModal(true);
                        }}
                      >
                        Xem
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Sửa"
                        onClick={() => navigate('/super-admin/cinemas/create', { state: { editData: cinema } })}
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
                <h4 className="m-0 fw-bold">Chi Tiết Cụm Rạp</h4>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body-custom">
                <div className="detail-info">
                  <label>Tên cụm rạp:</label>
                  <p className="fw-bold fs-5 text-dark">{selectedItem.name}</p>
                  
                  <label>Địa chỉ:</label>
                  <p className="fs-6">{selectedItem.address}</p>
                  
                  <label>Trạng thái:</label>
                  <div>
                    <span className={selectedItem.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {selectedItem.status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </span>
                  </div>

                  <label className="mt-4">Thông tin bổ sung:</label>
                  <p className="text-dark italic">Thông tin về cơ sở vật chất, số lượng phòng chiếu và các tiện ích khác của rạp sẽ được cập nhật sau...</p>
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
            max-width: 600px;
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
            margin-top: 15px;
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
            Tổng cộng: <b>{filteredCinemas.length}</b> cụm rạp
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

export default CinemaManagement;
