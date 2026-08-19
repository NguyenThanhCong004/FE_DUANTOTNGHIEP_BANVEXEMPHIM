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

      <ToastComponent />
    </AdminPanelPage>
  );
};

export default MembershipLevelManagement;
