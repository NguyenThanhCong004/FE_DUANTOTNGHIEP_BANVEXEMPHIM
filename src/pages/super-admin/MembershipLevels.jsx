import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { MEMBERSHIP_RANKS } from "../../constants/apiEndpoints";

const MembershipLevelManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
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
            rank_name: l.rankName ?? "",
            min_spending: l.minSpending ?? 0,
            description: l.description ?? "",
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

  const filteredLevels = levels.filter((level) =>
    String(level.rank_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLevels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="award"
      title="Hạng thành viên"
      description="Mức độ hội viên, chi tiêu tối thiểu và ưu đãi."
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
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách hạng
          </h4>
          <span className="text-muted small">Tổng: {filteredLevels.length} hạng</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm tên hạng hội viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm hạng"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>STT</th>
                  <th>Tên hạng</th>
                  <th className="text-end">Chi tiêu tối thiểu</th>
                  <th>Mô tả</th>
                  <th className="text-center">Giảm giá (%)</th>
                  <th className="text-center">Điểm thưởng</th>
                  <th className="text-center">Thao tác</th>
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
                      <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <span className="admin-badge admin-badge-neutral text-uppercase">{level.rank_name}</span>
                      </td>
                      <td className="text-end fw-semibold">{level.min_spending.toLocaleString("vi-VN")} đ</td>
                      <td className="small text-muted" style={{ maxWidth: 220 }}>
                        {level.description}
                      </td>
                      <td className="text-center fw-semibold">{level.discount_percent}%</td>
                      <td className="text-center fw-semibold">x{level.bonus_point}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(level);
                              setShowModal(true);
                            }}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() =>
                              navigate("/super-admin/membership-levels/create", { state: { editData: level } })
                            }
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

          {totalPages > 1 && (
            <div className="admin-pagination-wrap mt-3">
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    className={`admin-pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi tiết hạng {selectedItem.rank_name}</h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-form-label mb-1">Tên hạng</p>
              <p className="fw-bold mb-3">{selectedItem.rank_name}</p>
              <p className="admin-form-label mb-1">Chi tiêu tối thiểu</p>
              <p className="mb-3">{selectedItem.min_spending.toLocaleString("vi-VN")} đ</p>
              <p className="admin-form-label mb-1">Giảm giá vé</p>
              <p className="mb-3">{selectedItem.discount_percent}%</p>
              <p className="admin-form-label mb-1">Hệ số điểm thưởng</p>
              <p className="mb-3">x{selectedItem.bonus_point}</p>
              <p className="admin-form-label mb-1">Mô tả đặc quyền</p>
              <div className="p-3 bg-light rounded small">
                {selectedItem.description}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default MembershipLevelManagement;
