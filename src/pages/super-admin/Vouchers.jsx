import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { VOUCHERS } from '../../constants/apiEndpoints';

const VoucherManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(VOUCHERS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setVouchers(
          arr.map((v) => ({
            id: v.id,
            code: v.code ?? '',
            discount_type: v.discountType ?? 'PERCENTAGE',
            value: v.value ?? 0,
            min_order_value: v.minOrderValue ?? 0,
            start_date: v.startDate ?? '',
            end_date: v.endDate ?? '',
            point_voucher: v.pointVoucher ?? 0,
            status: v.status === 1 ? 'Active' : 'Inactive',
          }))
        );
      } catch {
        if (mounted) setVouchers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Logic lọc
  const filteredVouchers = vouchers.filter(v =>
    String(v.code || '').toLowerCase().includes(searchTerm.toLowerCase())
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Đang tải...
                  </td>
                </tr>
              ) : (
              currentItems.map((voucher) => (
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
                  <td className="text-center fw-bold text-dark">
                    {voucher.point_voucher} điểm
                  </td>
                  <td className="text-center">
                    <span className={voucher.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {voucher.status === 'Active' ? 'Đang áp dụng' : 'Ngưng/Hết hạn'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedItem(voucher);
                          setShowModal(true);
                        }}
                      >
                        Xem
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Sửa"
                        onClick={() => navigate('/super-admin/vouchers/create', { state: { editData: voucher } })}
                      >
                        Sửa 
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Modal Chi tiết */}
        {showModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
              <div className="modal-header-custom">
                <h4 className="m-0 fw-bold">Chi Tiết Voucher</h4>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body-custom">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-info">
                      <label>Mã Voucher:</label>
                      <p className="fw-bold fs-4 text-dark"><span className="code-badge">{selectedItem.code}</span></p>
                      
                      <label>Loại giảm giá:</label>
                      <p>{selectedItem.discount_type === 'PERCENTAGE' ? 'Giảm theo phần trăm (%)' : 'Giảm số tiền cố định (đ)'}</p>
                      
                      <label>Giá trị giảm:</label>
                      <p className="fw-bold fs-5 text-dark">
                        {selectedItem.discount_type === 'PERCENTAGE' 
                          ? `${selectedItem.value}%` 
                          : `${selectedItem.value.toLocaleString('vi-VN')} đ`}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-info">
                      <label>Đơn tối thiểu:</label>
                      <p className="fw-bold">{selectedItem.min_order_value.toLocaleString('vi-VN')} đ</p>
                      
                      <label>Điểm cần đổi:</label>
                      <p className="fw-bold text-dark">{selectedItem.point_voucher} điểm</p>

                      <label>Thời gian hiệu lực:</label>
                      <p>
                        Từ: <b>{new Date(selectedItem.start_date).toLocaleDateString('vi-VN')}</b><br/>
                        Đến: <b>{new Date(selectedItem.end_date).toLocaleDateString('vi-VN')}</b>
                      </p>

                      <label>Trạng thái:</label>
                      <div>
                        <span className={selectedItem.status === 'Active' ? 'status-active' : 'status-inactive'}>
                          {selectedItem.status === 'Active' ? 'Đang áp dụng' : 'Ngưng/Hết hạn'}
                        </span>
                      </div>
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
            max-width: 700px;
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
