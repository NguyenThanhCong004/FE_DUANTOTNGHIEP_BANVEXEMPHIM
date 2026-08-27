import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { PRODUCT_CATEGORIES } from "../../constants/apiEndpoints";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import AdminPagination from "../../components/admin/AdminPagination";

const ProductTypeManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast, ToastComponent } = useAdminToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const itemsPerPage = 5;

  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const res = await apiFetch(withQuery(PRODUCT_CATEGORIES.LIST, { search: searchTerm }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setProductTypes(arr.map((c) => ({ id: c.id, name: c.name ?? "" })));
      } catch {
        if (mounted) setProductTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  const filteredTypes = productTypes
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  const handleDeleteProductType = async (type) => {
    try {
      const res = await apiFetch(PRODUCT_CATEGORIES.BY_ID(type.id), {
        method: "DELETE"
      });
      
      if (res.ok) {
        // Refresh danh sách
        const refreshRes = await apiFetch(withQuery(PRODUCT_CATEGORIES.LIST, { search: searchTerm }));
        const json = await refreshRes.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        setProductTypes(arr.map((c) => ({ id: c.id, name: c.name ?? "" })));
        setShowDeleteModal(false);
        setTypeToDelete(null);
        setDeleteError('');
        showToast(`Đã xóa loại sản phẩm "${type.name}" thành công`);
      } else {
        // Xử lý error từ BE
        const json = await res.json().catch(() => null);
        setDeleteError(apiMessage(json, "Xóa loại sản phẩm thất bại"));
      }
    } catch (error) {
      console.error("Error deleting product type:", error);
      setDeleteError(MESSAGES.networkError);
    }
  };

  const openDeleteModal = (type) => {
    setTypeToDelete(type);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTypeToDelete(null);
    setDeleteError('');
  };

  return (
    <AdminPanelPage
      icon="tags"
      title="Loại sản phẩm"
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "var(--admin-bg-card)", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/product-types/create")}
        >
          Thêm loại sản phẩm
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            Danh sách loại
          </h4>
          <span className="text-muted small">Tổng: {filteredTypes.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm tên loại sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm loại"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>STT</th>
                  <th>Tên loại sản phẩm</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  currentItems.map((type, index) => (
                    <tr key={type.id}>
                      <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-semibold">{type.name}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/product-types/create", { state: { editData: type } })}
                            title="Sửa loại sản phẩm"
                          >Sửa</button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openDeleteModal(type)}
                            title="Xóa loại sản phẩm"
                          >Xóa</button>
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
            itemLabel="loại sản phẩm"
          />
        </div>
      </div>

      {/* Modal xác nhận xóa product type */}
      {showDeleteModal && typeToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                Xác nhận xóa Loại sản phẩm
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa loại sản phẩm này?</p>
              <div className="alert alert-warning">
                <strong>Tên loại:</strong> {typeToDelete.name}
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  {deleteError}
                </div>
              )}
              <p className="text-muted small mb-0">
                Hành động này không thể hoàn tác. Tất cả sản phẩm thuộc loại này có thể bị ảnh hưởng.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={closeDeleteModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteProductType(typeToDelete)}
              >
                Xóa loại sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastComponent />
    </AdminPanelPage>
  );
};

export default ProductTypeManagement;
