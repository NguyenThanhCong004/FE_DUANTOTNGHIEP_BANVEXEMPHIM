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
            code: v.code ?? "",
            discount_type: v.discountType ?? "PERCENTAGE",
            value: v.value ?? 0,
            min_order_value: v.minOrderValue ?? 0,
            start_date: v.startDate ?? "",
            end_date: v.endDate ?? "",
            point_voucher: v.pointVoucher ?? 0,
            status: v.status === 1 ? "Active" : "Inactive",
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

  const filteredVouchers = vouchers.filter((v) =>
    String(v.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="ticket-perforated"
      title="Voucher"
      description="Mã giảm giá, điều kiện và thời hạn áp dụng."
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
              aria-label="Tìm voucher"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>Mã Code</th>
                  <th>Giảm giá</th>
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
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  currentItems.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>
                        <span className="font-monospace fw-bold px-2 py-1 rounded border bg-light">{voucher.code}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">
                          {voucher.discount_type === "PERCENTAGE"
                            ? `${voucher.value}%`
                            : `${voucher.value.toLocaleString("vi-VN")} đ`}
                        </div>
                        <div className="small text-muted">
                          {voucher.discount_type === "PERCENTAGE" ? "Giảm theo %" : "Giảm số tiền cố định"}
                        </div>
                      </td>
                      <td className="fw-semibold">{voucher.min_order_value.toLocaleString("vi-VN")} đ</td>
                      <td className="small">
                        <div>Bắt đầu: {new Date(voucher.start_date).toLocaleDateString("vi-VN")}</div>
                        <div>Kết thúc: {new Date(voucher.end_date).toLocaleDateString("vi-VN")}</div>
                      </td>
                      <td className="text-center fw-semibold">{voucher.point_voucher} điểm</td>
                      <td className="text-center">
                        <span
                          className={
                            voucher.status === "Active"
                              ? "admin-badge admin-badge-success"
                              : "admin-badge admin-badge-danger"
                          }
                        >
                          {voucher.status === "Active" ? "Đang áp dụng" : "Ngưng/Hết hạn"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(voucher);
                              setShowModal(true);
                            }}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/vouchers/create", { state: { editData: voucher } })}
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
          <div
            className="admin-modal"
            style={{ maxWidth: 720 }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Chi tiết Voucher</h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Mã Voucher</p>
                  <p className="fw-bold fs-5 text-dark mb-3">
                    <span className="font-monospace px-2 py-1 rounded border bg-light">{selectedItem.code}</span>
                  </p>
                  <p className="admin-form-label mb-1">Loại giảm giá</p>
                  <p className="mb-3">
                    {selectedItem.discount_type === "PERCENTAGE"
                      ? "Giảm theo phần trăm (%)"
                      : "Giảm số tiền cố định (đ)"}
                  </p>
                  <p className="admin-form-label mb-1">Giá trị giảm</p>
                  <p className="fw-bold fs-5 mb-0">
                    {selectedItem.discount_type === "PERCENTAGE"
                      ? `${selectedItem.value}%`
                      : `${selectedItem.value.toLocaleString("vi-VN")} đ`}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Đơn tối thiểu</p>
                  <p className="fw-semibold mb-3">{selectedItem.min_order_value.toLocaleString("vi-VN")} đ</p>
                  <p className="admin-form-label mb-1">Điểm cần đổi</p>
                  <p className="fw-semibold mb-3">{selectedItem.point_voucher} điểm</p>
                  <p className="admin-form-label mb-1">Thời gian hiệu lực</p>
                  <p className="mb-3">
                    Từ: <b>{new Date(selectedItem.start_date).toLocaleDateString("vi-VN")}</b>
                    <br />
                    Đến: <b>{new Date(selectedItem.end_date).toLocaleDateString("vi-VN")}</b>
                  </p>
                  <p className="admin-form-label mb-1">Trạng thái</p>
                  <span
                    className={
                      selectedItem.status === "Active"
                        ? "admin-badge admin-badge-success"
                        : "admin-badge admin-badge-danger"
                    }
                  >
                    {selectedItem.status === "Active" ? "Đang áp dụng" : "Ngưng/Hết hạn"}
                  </span>
                </div>
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

export default VoucherManagement;
