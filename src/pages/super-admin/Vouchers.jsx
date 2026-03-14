import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VoucherManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Dữ liệu mẫu cho Voucher
  const [vouchers] = useState([
    { 
      id: 1, 
      code: 'SUMMER2024', 
      discount_type: 'PERCENTAGE', 
      value: 20, 
      min_order_value: 200000, 
      start_date: '2024-06-01', 
      end_date: '2024-08-31', 
      point_voucher: 100, 
      status: 'Active' 
    },
    { 
      id: 2, 
      code: 'WELCOME50K', 
      discount_type: 'FIXED_AMOUNT', 
      value: 50000, 
      min_order_value: 150000, 
      start_date: '2024-01-01', 
      end_date: '2024-12-31', 
      point_voucher: 50, 
      status: 'Active' 
    },
    { 
      id: 3, 
      code: 'EXPIRED10', 
      discount_type: 'PERCENTAGE', 
      value: 10, 
      min_order_value: 100000, 
      start_date: '2023-01-01', 
      end_date: '2023-12-31', 
      point_voucher: 20, 
      status: 'Inactive' 
    },
  ]);

  // Logic lọc
  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="voucher-management p-4">
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

        .code-badge {
          background: #f0f0f0;
          border: 2px dashed #000;
          padding: 5px 12px;
          font-family: monospace;
          font-weight: bold;
          font-size: 1rem;
          color: #000;
        }

        .status-active { color: #2e7d32; background: #e8f5e9; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }
        .status-inactive { color: #c62828; background: #ffebee; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }

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
          <h2 className="fw-bold m-0 text-dark">Quản lý Voucher</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/vouchers/create')}
        >
          <i className="bi bi-ticket-perforated me-2 fs-5"></i>
          Tạo Voucher mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo mã code..."
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
                <th className="py-3">Mã Code</th>
                <th className="py-3">Giảm giá</th>
                <th className="py-3">Đơn tối thiểu</th>
                <th className="py-3">Thời gian</th>
                <th className="py-3 text-center">Điểm đổi</th>
                <th className="py-3 text-center">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((voucher) => (
                <tr key={voucher.id}>
                  <td>
                    <span className="code-badge">{voucher.code}</span>
                  </td>
                  <td>
                    <div className="fw-bold">
                      {voucher.discount_type === 'PERCENTAGE' 
                        ? `${voucher.value}%` 
                        : `${voucher.value.toLocaleString('vi-VN')} đ`}
                    </div>
                    <div className="small text-black">
                      {voucher.discount_type === 'PERCENTAGE' ? 'Giảm theo %' : 'Giảm số tiền cố định'}
                    </div>
                  </td>
                  <td className="fw-bold text-dark">
                    {voucher.min_order_value.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="small">
                    <div>Bắt đầu: {new Date(voucher.start_date).toLocaleDateString('vi-VN')}</div>
                    <div>Kết thúc: {new Date(voucher.end_date).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="text-center fw-bold text-primary">
                    {voucher.point_voucher} điểm
                  </td>
                  <td className="text-center">
                    <span className={voucher.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {voucher.status === 'Active' ? 'Đang áp dụng' : 'Ngưng/Hết hạn'}
                    </span>
                  </td>
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
            Tổng cộng: <b>{filteredVouchers.length}</b> mã voucher
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

export default VoucherManagement;
