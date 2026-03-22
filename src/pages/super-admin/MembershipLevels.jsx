import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { MEMBERSHIP_RANKS } from '../../constants/apiEndpoints';

const MembershipLevelManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(MEMBERSHIP_RANKS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setLevels(
          arr.map((l) => ({
            id: l.id,
            rank_name: l.rankName ?? '',
            min_spending: l.minSpending ?? 0,
            description: l.description ?? '',
            discount_percent: l.discountPercent ?? 0,
            bonus_point: l.bonusPoint ?? 1,
          }))
        );
      } catch {
        if (mounted) setLevels([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Logic lọc
  const filteredLevels = levels.filter((level) =>
    String(level.rank_name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content-custom {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          position: relative;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          color: black !important;
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          border: none;
          background: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: black;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }

        .detail-label {
          font-weight: bold;
          color: black;
        }

        .detail-value {
          color: black;
          font-weight: 600;
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                currentItems.map((level, index) => (
                <tr key={level.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td>
                    <span className="rank-badge">{level.rank_name}</span>
                  </td>
                  <td className="text-end fw-bold text-dark">
                    {level.min_spending.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="small text-dark" style={{ maxWidth: '200px' }}>{level.description}</td>
                  <td className="text-center fw-bold">{level.discount_percent}%</td>
                  <td className="text-center fw-bold text-dark">x{level.bonus_point}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedItem(level);
                          setShowModal(true);
                        }}
                      >
                        Xem
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Sửa"
                        onClick={() => navigate('/super-admin/membership-levels/create', { state: { editData: level } })}
                      >
                        Sửa 
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-dark small">
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

      {/* View Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
            
            <h3 className="text-center fw-bold mb-4 text-uppercase">Chi tiết hạng {selectedItem.rank_name}</h3>
            
            <div className="detail-row">
              <span className="detail-label">Tên hạng:</span>
              <span className="detail-value text-dark">{selectedItem.rank_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Chi tiêu tối thiểu:</span>
              <span className="detail-value">{selectedItem.min_spending.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Giảm giá vé:</span>
              <span className="detail-value">{selectedItem.discount_percent}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Hệ số điểm thưởng:</span>
              <span className="detail-value">x{selectedItem.bonus_point}</span>
            </div>
            <div className="mt-3">
              <label className="detail-label d-block mb-2">Mô tả đặc quyền:</label>
              <div className="p-3 bg-light rounded small">
                {selectedItem.description}
              </div>
            </div>

            <div className="mt-4 pt-3 text-center">
              <button 
                className="btn btn-dark px-5 fw-bold"
                onClick={() => setShowModal(false)}
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipLevelManagement;
