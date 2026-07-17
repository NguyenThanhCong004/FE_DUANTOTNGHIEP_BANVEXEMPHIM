import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { VOUCHERS } from "../../constants/apiEndpoints";
import { formatDate, formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";

const VoucherManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const itemsPerPage = 5;

  const { showToast, ToastComponent } = useAdminToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  // Mapping trạng thái sang text và màu sắc
  const getStatusInfo = (status) => {
    switch (status) {
      case 1: return { label: "Đang phát hành", class: "admin-badge-success" };
      case 2: return { label: "Chờ phát hành", class: "admin-badge-warning" };
      case 3: return { label: "Đã kết thúc", class: "admin-badge-danger" };
      case 0: return { label: "Dừng phát hành", class: "admin-badge-secondary" };
      default: return { label: "Không xác định", class: "admin-badge-secondary" };
    }
  };

  const mapVoucher = useCallback((v) => ({
    id: v.id,
    code: v.code ?? "",
    value: v.value ?? 0,
    minOrderValue: v.minOrderValue ?? 0,
    maxDiscountAmount: v.maxDiscountAmount ?? 0,
    startDate: v.startDate ?? "",
    endDate: v.endDate ?? "",
    pointVoucher: v.pointVoucher ?? 0,
    status: v.status,
  }), []);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(withQuery(VOUCHERS.LIST, { search: searchTerm }));
      const json = await res.json().catch(() => null);
      
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      
      setVouchers(arr.map(mapVoucher));
    } catch (err) {
      console.error("Lỗi fetch voucher:", err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [mapVoucher, searchTerm]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const filteredVouchers = vouchers
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  const handleDeleteVoucher = async (voucher) => {
    try {
      const res = await apiFetch(VOUCHERS.BY_ID(voucher.id), {
        method: "DELETE"
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (res.ok) {
        showToast('Xóa voucher thành công!');
        await fetchVouchers();
        setShowDeleteModal(false);
        setVoucherToDelete(null);
        setDeleteError("");
      } else {
        const errorMsg = json?.message || `Lỗi từ hệ thống (Mã: ${res.status})`;
        setDeleteError(errorMsg);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API xóa:", error);
      setDeleteError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!");
    }
  };

  const openDeleteModal = (voucher) => {
    setVoucherToDelete(voucher);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVoucherToDelete(null);
    setDeleteError("");
  };

  return (
    <AdminPanelPage
      icon="ticket-perforated"
      title="Voucher"
      description="Quản lý mã giảm giá, chương trình tích điểm và thời hạn áp dụng."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/vouchers/create")}
        >
          Tạo Voucher mới
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            Danh sách voucher
          </h4>
          <span className="text-muted small">Tổng: {filteredVouchers.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo mã code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
                  <th>Mã Code</th>
                  <th>Giảm giá (%)</th>
                  <th>Giảm tối đa</th>
                  <th>Đơn tối thiểu</th>
                  <th>Thời gian</th>
                  <th className="text-center">Điểm đổi</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      Không tìm thấy voucher nào.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((voucher, index) => {
                    const statusInfo = getStatusInfo(voucher.status);
                    return (
                      <tr key={voucher.id}>
                        <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                        <td>
                          <span className="font-monospace fw-bold px-2 py-1 rounded border bg-light">{voucher.code}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{voucher.value}%</div>
                        </td>
                        <td className="fw-semibold text-danger">{formatVnd(voucher.maxDiscountAmount)}</td>
                        <td className="fw-semibold">{formatVnd(voucher.minOrderValue)}</td>
                        <td className="small">
                          <div>Từ: {formatDate(voucher.startDate)}</div>
                          <div>Đến: {formatDate(voucher.endDate)}</div>
                        </td>
                        <td className="text-center fw-semibold">
                          {Number(voucher.pointVoucher) > 0 ? `${voucher.pointVoucher} điểm` : "Miễn phí"}
                        </td>
                        <td className="text-center">
                          <span className={`admin-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              onClick={() => {
                                setSelectedItem(voucher);
                                setShowModal(true);
                              }}
                              title="Xem chi tiết"
                            >Xem</button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              onClick={() => navigate("/super-admin/vouchers/create", { state: { editData: voucher } })}
                              title="Sửa voucher"
                            >Sửa</button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => openDeleteModal(voucher)}
                              title="Xóa voucher"
                            >Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredVouchers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="voucher"
          />
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 720 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Chi tiết Voucher</h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-3">
                <div className="col-md-6 border-end">
                  <p className="admin-form-label mb-1 text-muted">Mã Voucher</p>
                  <p className="fw-bold fs-5 text-dark mb-4">
                    <span className="font-monospace px-2 py-1 rounded border bg-light">{selectedItem.code}</span>
                  </p>
                  <p className="admin-form-label mb-1 text-muted">Giá trị giảm</p>
                  <p className="fw-bold fs-5 mb-4 text-primary">{selectedItem.value}%</p>
                  <p className="admin-form-label mb-1 text-muted">Giảm tối đa</p>
                  <p className="fw-bold fs-5 text-danger mb-0">{formatVnd(selectedItem.maxDiscountAmount)}</p>
                </div>
                <div className="col-md-6 ps-md-4">
                  <p className="admin-form-label mb-1 text-muted">Đơn tối thiểu</p>
                  <p className="fw-semibold mb-3">{formatVnd(selectedItem.minOrderValue)}</p>
                  <p className="admin-form-label mb-1 text-muted">Điểm cần đổi</p>
                  <p className="fw-semibold mb-3">
                    {Number(selectedItem.pointVoucher) > 0 ? `${selectedItem.pointVoucher} điểm` : "Miễn phí / không cần điểm"}
                  </p>
                  <p className="admin-form-label mb-1 text-muted">Thời gian hiệu lực</p>
                  <div className="mb-3 small">
                    Từ: <b>{formatDate(selectedItem.startDate)}</b><br />
                    Đến: <b>{formatDate(selectedItem.endDate)}</b>
                  </div>
                  <p className="admin-form-label mb-1 text-muted">Trạng thái hiện tại</p>
                  <span className={`admin-badge ${getStatusInfo(selectedItem.status).class}`}>
                    {getStatusInfo(selectedItem.status).label}
                  </span>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Đóng</button>
              <button 
                type="button" 
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/super-admin/vouchers/create", { state: { editData: selectedItem } });
                }}
              >Sửa Voucher</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && voucherToDelete && (
        <div className="admin-modal-overlay" onClick={closeDeleteModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">Xác nhận xóa</h3>
              <button type="button" className="admin-modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <div className="admin-modal-body text-center py-4">
              <p className="mb-3">Bạn có chắc chắn muốn xóa voucher <b>{voucherToDelete.code}</b>?</p>
              <div className="alert alert-warning py-2 small">Hành động này không thể hoàn tác.</div>
              {deleteError && (
                <div className="alert alert-danger mb-0 mt-3 text-start">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={closeDeleteModal}>Hủy</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDeleteVoucher(voucherToDelete)}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      <ToastComponent />
    </AdminPanelPage>
  );
};

export default VoucherManagement;
