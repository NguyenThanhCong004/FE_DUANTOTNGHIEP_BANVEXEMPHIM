import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { VOUCHERS } from "../../constants/apiEndpoints";

const VoucherManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const itemsPerPage = 10;

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

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

  const mapVoucher = (v) => ({
    id: v.id,
    code: v.code ?? "",
    value: v.value ?? 0,
    minOrderValue: v.minOrderValue ?? 0,
    maxDiscountAmount: v.maxDiscountAmount ?? 0,
    startDate: v.startDate ?? "",
    endDate: v.endDate ?? "",
    pointVoucher: v.pointVoucher ?? 0,
    status: v.status,
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(VOUCHERS.LIST);
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
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = vouchers.filter((v) =>
    String(v.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      } else {
        const errorMsg = json?.message || `Lỗi từ hệ thống (Mã: ${res.status})`;
        showToast(errorMsg, 'danger');
      }
    } catch (error) {
      console.error("Lỗi khi gọi API xóa:", error);
      showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!', 'danger');
    }
  };

  const openDeleteModal = (voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVoucherToDelete(null);
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
          <i className="bi bi-plus-lg me-2"></i>
          Tạo Voucher mới
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách voucher
          </h4>
          <span className="text-muted small">Tổng: {filteredVouchers.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
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
                    <td colSpan={8} className="text-center py-4 text-muted">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      Không tìm thấy voucher nào.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((voucher) => {
                    const statusInfo = getStatusInfo(voucher.status);
                    return (
                      <tr key={voucher.id}>
                        <td>
                          <span className="font-monospace fw-bold px-2 py-1 rounded border bg-light">{voucher.code}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{voucher.value}%</div>
                        </td>
                        <td className="fw-semibold text-danger">{voucher.maxDiscountAmount.toLocaleString("vi-VN")} đ</td>
                        <td className="fw-semibold">{voucher.minOrderValue.toLocaleString("vi-VN")} đ</td>
                        <td className="small">
                          <div>Từ: {new Date(voucher.startDate).toLocaleDateString("vi-VN")}</div>
                          <div>Đến: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}</div>
                        </td>
                        <td className="text-center fw-semibold">{voucher.pointVoucher} điểm</td>
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
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              onClick={() => navigate("/super-admin/vouchers/create", { state: { editData: voucher } })}
                              title="Sửa voucher"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => openDeleteModal(voucher)}
                              title="Xóa voucher"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination-wrap mt-3 d-flex justify-content-end">
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
                  <p className="fw-bold fs-5 text-danger mb-0">{selectedItem.maxDiscountAmount.toLocaleString("vi-VN")} đ</p>
                </div>
                <div className="col-md-6 ps-md-4">
                  <p className="admin-form-label mb-1 text-muted">Đơn tối thiểu</p>
                  <p className="fw-semibold mb-3">{selectedItem.minOrderValue.toLocaleString("vi-VN")} đ</p>
                  <p className="admin-form-label mb-1 text-muted">Điểm cần đổi</p>
                  <p className="fw-semibold mb-3">{selectedItem.pointVoucher} điểm</p>
                  <p className="admin-form-label mb-1 text-muted">Thời gian hiệu lực</p>
                  <div className="mb-3 small">
                    Từ: <b>{new Date(selectedItem.startDate).toLocaleDateString("vi-VN")}</b><br />
                    Đến: <b>{new Date(selectedItem.endDate).toLocaleDateString("vi-VN")}</b>
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
              <h3 className="text-danger mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Xác nhận xóa</h3>
              <button type="button" className="admin-modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <div className="admin-modal-body text-center py-4">
              <p className="mb-3">Bạn có chắc chắn muốn xóa voucher <b>{voucherToDelete.code}</b>?</p>
              <div className="alert alert-warning py-2 small">Hành động này không thể hoàn tác.</div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={closeDeleteModal}>Hủy</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDeleteVoucher(voucherToDelete)}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

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

export default VoucherManagement;
