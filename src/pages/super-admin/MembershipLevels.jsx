import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { MEMBERSHIP_RANKS } from "../../constants/apiEndpoints";

const MembershipLevelManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const itemsPerPage = 8;

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(MEMBERSHIP_RANKS.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      setLevels(
        arr.map((l) => ({
          id: l.id,
          rank_name: l.rankName ?? "",
          min_spending: l.minSpending ?? 0,
          description: l.description ?? "",
          discount_percent: l.discountPercent ?? 0,
          bonus_point: l.bonusPoint ?? 1,
        }))
      );
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const filteredLevels = levels.filter((level) =>
    String(level.rank_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLevels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(MEMBERSHIP_RANKS.DELETE(id), {
        method: "DELETE"
      });
      
      if (res.ok) {
        showToast('Xóa hạng thành công!');
        await fetchLevels();
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        showToast('Xóa hạng thất bại!', 'danger');
      }
    } catch (error) {
      console.error("Error deleting membership rank:", error);
      showToast('Lỗi kết nối máy chủ!', 'danger');
    }
  };

  return (
    <AdminPanelPage
      icon="award"
      title="Hạng thành viên"
      description="Quản lý mức độ hội viên, chi tiêu tối thiểu và các ưu đãi đặc quyền."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/membership-levels/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Thêm mức độ mới
        </button>
      }
    >
      <div className="admin-table-container">
        {/* Search Bar */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          <div className="admin-search-wrapper" style={{ maxWidth: '400px', flex: '1' }}>
            <i className="bi bi-search admin-search-icon"></i>
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Tìm theo tên hạng hội viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Đang tải danh sách hạng thành viên...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="admin-empty">
            <i className="bi bi-award admin-empty-icon"></i>
            <p>Chưa có hạng thành viên nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>STT</th>
                    <th>Tên hạng</th>
                    <th className="text-end">Chi tiêu tối thiểu</th>
                    <th className="text-center">Giảm giá (%)</th>
                    <th className="text-center">Hệ số điểm</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((level, index) => (
                    <tr key={level.id}>
                      <td className="fw-medium text-muted">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="admin-badge admin-badge-primary text-uppercase fw-bold">
                            {level.rank_name}
                          </span>
                        </div>
                      </td>
                      <td className="text-end fw-bold text-dark">
                        {level.min_spending.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-success">{level.discount_percent}%</span>
                      </td>
                      <td className="text-center fw-medium">x{level.bonus_point}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(level);
                              setShowModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/membership-levels/create", { state: { editData: level } })}
                            title="Sửa hạng"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => {
                              setItemToDelete(level);
                              setShowDeleteModal(true);
                            }}
                            title="Xóa hạng"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="text-muted small">
                Tổng cộng: {filteredLevels.length} hạng
              </span>
              <nav>
                <ul className="admin-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1}>
                      <button 
                        className={`admin-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => paginate(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-award me-2"></i>
                Chi tiết hạng thành viên
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="text-center mb-4">
                <div className="display-6 fw-bold text-primary text-uppercase mb-2">{selectedItem.rank_name}</div>
                <div className="text-muted">ID định danh: #{selectedItem.id}</div>
              </div>
              
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="p-3 border rounded-4 bg-light">
                    <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Chi tiêu tối thiểu</small>
                    <div className="fs-5 fw-bold text-dark">{selectedItem.min_spending.toLocaleString("vi-VN")}đ</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 border rounded-4 bg-light">
                    <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Ưu đãi giảm giá</small>
                    <div className="fs-5 fw-bold text-success">{selectedItem.discount_percent}%</div>
                  </div>
                </div>
                <div className="col-sm-12">
                  <div className="p-3 border rounded-4 bg-light">
                    <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Hệ số tích điểm</small>
                    <div className="fs-5 fw-bold text-dark">x{selectedItem.bonus_point} (Nhân với giá trị hóa đơn)</div>
                  </div>
                </div>
                <div className="col-sm-12">
                  <div className="p-3 border rounded-4">
                    <small className="text-muted d-block mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Mô tả đặc quyền</small>
                    <div className="text-dark" style={{ lineHeight: '1.6' }}>
                      {selectedItem.description || "Chưa có mô tả chi tiết cho hạng thành viên này."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/super-admin/membership-levels/create", { state: { editData: selectedItem } });
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Chỉnh sửa hạng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa hạng
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowDeleteModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa hạng thành viên này?</p>
              <div className="alert alert-warning">
                <strong>Tên hạng:</strong> {itemToDelete.rank_name.toUpperCase()}<br/>
                <strong>Chi tiêu tối thiểu:</strong> {itemToDelete.min_spending.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Hành động này có thể ảnh hưởng đến hạng hội viên của khách hàng hiện tại. Cân nhắc kỹ trước khi thực hiện.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDelete(itemToDelete.id)}
              >
                <i className="bi bi-trash me-2"></i>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast.show && (
        <div 
          className={`position-fixed bottom-0 end-0 m-4 admin-slide-up z-3 alert alert-${toast.type} border-0 shadow-lg d-flex align-items-center gap-2`}
          style={{ minWidth: '300px' }}
        >
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} fs-5`}></i>
          <div className="fw-bold">{toast.message}</div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default MembershipLevelManagement;
