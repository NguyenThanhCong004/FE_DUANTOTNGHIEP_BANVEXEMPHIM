import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { MEMBERSHIP_RANKS } from "../../constants/apiEndpoints";
import { isActiveStatus } from "../../utils/statusFormat";
import { formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";

const MembershipLevelManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 5;

  const { showToast, ToastComponent } = useAdminToast();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(withQuery(MEMBERSHIP_RANKS.LIST, { search: searchTerm }));
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
          status: l.status ?? 1,
          is_default: l.isDefault ?? (l.minSpending === 0),
        }))
      );
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const filteredLevels = levels
    .sort((a, b) => (Number(a.min_spending) || 0) - (Number(b.min_spending) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLevels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="award"
      title="Hạng thành viên"
    >
      <div className="admin-table-container">
        {/* Search Bar */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          <div className="admin-search-wrapper" style={{ maxWidth: '400px', flex: '1' }}>
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
                    <th className="text-center">Điểm thưởng cộng thêm</th>
                    <th className="text-center">Trạng thái</th>
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
                          {level.is_default && (
                            <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1" style={{ fontSize: '0.65rem' }}>
                              MẶC ĐỊNH
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-end fw-bold text-dark">
                        {level.is_default ? (
                          <span className="text-muted italic fw-normal">0đ (Mặc định)</span>
                        ) : (
                          formatVnd(level.min_spending)
                        )}
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-success">{level.discount_percent}%</span>
                      </td>
                      <td className="text-center fw-medium">+{level.bonus_point}</td>
                      <td className="text-center">
                        <span className={`admin-badge ${isActiveStatus(level.status) ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                          {isActiveStatus(level.status) ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(level);
                              setShowModal(true);
                            }}
                            title="Xem chi tiết"
                          >Xem</button>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/membership-levels/create", { state: { editData: level } })}
                            title={level.is_default ? "Không thể sửa hạng mặc định" : "Sửa hạng"}
                            disabled={level.is_default}
                            style={level.is_default ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLevels.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="hạng"
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                Chi tiết hạng thành viên
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
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
                    <div className="fs-5 fw-bold text-dark">{formatVnd(selectedItem.min_spending)}</div>
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
                    <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Điểm thưởng cộng thêm</small>
                    <div className="fs-5 fw-bold text-dark">+{selectedItem.bonus_point} điểm (Cộng thêm vào điểm tích lũy mỗi hóa đơn)</div>
                  </div>
                </div>
                <div className="col-sm-12">
                  <div className="p-3 border rounded-4 bg-light">
                    <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Trạng thái</small>
                    <div>
                      <span className={`admin-badge ${isActiveStatus(selectedItem.status) ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                        {isActiveStatus(selectedItem.status) ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </div>
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
                disabled={selectedItem.is_default}
                style={selectedItem.is_default ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={selectedItem.is_default ? "Không thể sửa hạng mặc định" : "Chỉnh sửa hạng"}
              >
                Chỉnh sửa hạng
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastComponent />
    </AdminPanelPage>
  );
};

export default MembershipLevelManagement;
