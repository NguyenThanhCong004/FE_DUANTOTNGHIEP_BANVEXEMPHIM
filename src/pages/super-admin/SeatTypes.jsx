import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { SEAT_TYPES } from "../../constants/apiEndpoints";

const SeatTypeManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [seatTypes, setSeatTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(SEAT_TYPES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setSeatTypes(
          arr.map((t) => ({
            id: t.seatTypeId ?? t.id,
            name: t.name ?? "",
            price: t.surcharge != null ? t.surcharge : 0,
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
  }, []);

  const filteredTypes = seatTypes.filter((type) => type.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  // Function to delete seat type
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa loại ghế "${name}" không?`)) {
      return;
    }

    try {
      const res = await apiFetch(SEAT_TYPES.BY_ID(id), {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || "Xóa loại ghế thất bại");
        return;
      }

      // Refresh the list
      const listRes = await apiFetch(SEAT_TYPES.LIST);
      const json = await listRes.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      
      setSeatTypes(
        arr.map((t) => ({
          id: t.seatTypeId ?? t.id,
          name: t.name ?? "",
          price: t.surcharge != null ? t.surcharge : 0,
        }))
      );

      // Reset to first page if current page is empty
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      alert("Xóa loại ghế thành công!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Không thể kết nối đến máy chủ");
    }
  };

  return (
    <AdminPanelPage
      icon="ui-checks-grid"
      title="Loại ghế"
      description="Phụ phí theo loại ghế (thường, VIP, đôi…)."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/seat-types/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Thêm loại ghế
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách loại ghế
          </h4>
          <span className="text-muted small">Tổng: {filteredTypes.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
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
                  <th style={{ width: 72 }}>STT</th>
                  <th>Tên loại ghế</th>
                  <th className="text-end">Giá loại ghế (VNĐ)</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  currentItems.map((type, index) => (
                    <tr key={type.id}>
                      <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-semibold">{type.name}</td>
                      <td className="text-end fw-semibold">{type.price.toLocaleString("vi-VN")} đ</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/seat-types/create", { state: { editData: type } })}
                          >
                            <i className="bi bi-pencil"></i>
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleDelete(type.id, type.name)}
                            title="Xóa loại ghế"
                          >
                            <i className="bi bi-trash"></i>
                            Xóa
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
    </AdminPanelPage>
  );
};

export default SeatTypeManagement;
