import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { SEAT_TYPES } from "../../constants/apiEndpoints";
import { hexColorForSeatTypeName, normalizeHex } from "../../utils/seatTypeColors";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";

const SeatTypeManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  const { showToast, ToastComponent } = useAdminToast();
  const [seatTypes, setSeatTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || "success");
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(withQuery(SEAT_TYPES.LIST, { search: searchTerm }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setSeatTypes(
          arr.map((t) => ({
            id: t.seatTypeId ?? t.id,
            name: t.name ?? "",
            surcharge: t.surcharge != null ? Number(t.surcharge) : 0,
            coupleSeat: Boolean(t.coupleSeat),
            color: t.color || "",
          }))
        );
      } catch {
        if (mounted) setSeatTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  const filteredTypes = seatTypes
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  // Function to delete seat type
  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(SEAT_TYPES.BY_ID(id), {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setDeleteError(apiMessage(errorData, "Xóa loại ghế thất bại"));
        return;
      }

      // Refresh the list
      const listRes = await apiFetch(withQuery(SEAT_TYPES.LIST, { search: searchTerm }));
      const json = await listRes.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      
      setSeatTypes(
        arr.map((t) => ({
          id: t.seatTypeId ?? t.id,
          name: t.name ?? "",
          surcharge: t.surcharge != null ? Number(t.surcharge) : 0,
          coupleSeat: Boolean(t.coupleSeat),
          color: t.color || "",
        }))
      );

      // Reset to first page if current page is empty
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setTypeToDelete(null);
      setDeleteError("");
      showToast("Xóa loại ghế thành công");
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError(MESSAGES.networkError);
    }
  };

  const openDeleteModal = (type) => {
    setTypeToDelete(type);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTypeToDelete(null);
    setDeleteError("");
  };

  return (
    <AdminPanelPage
      icon="ui-checks-grid"
      title="Loại ghế"
      description="Đặt tên, phụ thu và loại ghế đơn/đôi. Ghế đôi hiển thị rộng 2 cột trên sơ đồ phòng (chỉ đặt ở cột số lẻ)."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/seat-types/create")}
        >
          Thêm loại ghế
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            Danh sách loại ghế
          </h4>
          <span className="text-muted small">Tổng: {filteredTypes.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm loại ghế..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm loại ghế"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
                  <th style={{ width: 48 }} className="text-center">
                    Màu
                  </th>
                  <th>Tên loại ghế</th>
                  <th style={{ width: 130 }} className="text-center">
                    Dạng
                  </th>
                  <th className="text-end" style={{ minWidth: 140 }}>
                    Phụ thu (VNĐ)
                  </th>
                  <th className="text-center" style={{ width: 200 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                      Đang tải…
                    </td>
                  </tr>
                ) : filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      {searchTerm ? "Không tìm thấy loại ghế phù hợp." : "Chưa có loại ghế. Nhấn «Thêm loại ghế» để tạo."}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((type, index) => (
                    <tr key={type.id}>
                      <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                      <td className="text-center align-middle">
                        <span
                          title="Màu trên sơ đồ"
                          style={{
                            display: "inline-block",
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            backgroundColor:
                              normalizeHex(type.color) || hexColorForSeatTypeName(type.name),
                            border: "1px solid rgba(0,0,0,0.12)",
                            verticalAlign: "middle",
                          }}
                        />
                      </td>
                      <td className="fw-semibold align-middle">{type.name}</td>
                      <td className="text-center align-middle">
                        {type.coupleSeat ? (
                          <Badge bg="danger">Ghế đôi</Badge>
                        ) : (
                          <Badge bg="secondary">Ghế đơn</Badge>
                        )}
                      </td>
                      <td className="text-end fw-semibold align-middle">
                        {formatVnd(type.surcharge)}
                      </td>
                      <td className="text-center align-middle">
                        <div className="d-flex flex-wrap gap-1 justify-content-center">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/seat-types/create", { state: { editData: type } })}
                          >
                            <span className="ms-1">Sửa</span>
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openDeleteModal(type)}
                            title="Xóa loại ghế"
                          >
                            <span className="ms-1">Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTypes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="loại ghế"
          />
        </div>
      </div>
      {showDeleteModal && typeToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                Xác nhận xóa loại ghế
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa loại ghế này?</p>
              <div className="alert alert-warning mb-0">
                <div>
                  <strong>Tên:</strong> {typeToDelete.name}
                </div>
                <div className="small mt-1">
                  <strong>Dạng:</strong> {typeToDelete.coupleSeat ? "Ghế đôi" : "Ghế đơn"} ·{" "}
                  <strong>Phụ thu:</strong> {formatVnd(typeToDelete.surcharge)}
                </div>
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline-secondary" onClick={closeDeleteModal}>
                Hủy
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDelete(typeToDelete.id)}>
                Xóa loại ghế
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastComponent />
    </AdminPanelPage>
  );
};

export default SeatTypeManagement;
