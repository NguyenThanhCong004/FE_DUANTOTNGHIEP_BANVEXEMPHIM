import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { PRODUCTS, PRODUCT_CATEGORIES } from "../../constants/apiEndpoints";
import { codeToAdminStatus } from "../../utils/statusFormat";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";

const ProductManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const itemsPerPage = 5;

  const { showToast, ToastComponent } = useAdminToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(withQuery(PRODUCTS.LIST, {
        search: searchTerm,
        categoryId: categoryFilter === "All" ? undefined : categoryFilter,
      }));
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      setProducts(
        arr.map((p) => ({
          id: p.id,
          name: p.name ?? "",
          description: p.description ?? "",
          price: p.price ?? 0,
          categoryName: p.categoryName ?? "Chưa phân loại",
          categoryId: p.categoryId,
          status: codeToAdminStatus(p.status, { allowUpcoming: false }),
          image: p.image || "https://placehold.co/200x200?text=Product",
        })).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch(PRODUCT_CATEGORIES.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredProducts = products.filter((p) => {
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleDeleteProduct = async (product) => {
    try {
      const res = await apiFetch(PRODUCTS.BY_ID(product.id), {
        method: "DELETE"
      });
      if (res.ok) {
        showToast('Xóa sản phẩm thành công');
        await fetchProducts();
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeleteError("");
      } else {
        const json = await res.json().catch(() => null);
        setDeleteError(apiMessage(json, "Xóa sản phẩm thất bại"));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setDeleteError(MESSAGES.networkError);
    }
  };

  const closeProductDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeleteError("");
  };

  return (
    <AdminPanelPage
      icon="package"
      title="Danh mục sản phẩm"
      description="Quản lý kho sản phẩm bắp nước dùng chung cho toàn hệ thống rạp."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate('/super-admin/catalog-products/create')}
        >
          Thêm sản phẩm mới
        </button>
      }
    >
      <div className="admin-table-container">
        {/* Search & Filter Bar */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          <div className="admin-search-wrapper" style={{ maxWidth: '400px', flex: '1' }}>
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select 
              className="admin-search-input w-100"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '1rem' }}
            >
              <option value="All">Tất cả loại</option>
              {categories.map(cat => (
                <option key={cat.id || cat.categories_products_id} value={cat.id || cat.categories_products_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select 
              className="admin-search-input w-100"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '1rem' }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Đang kinh doanh</option>
              <option value="Inactive">Ngừng kinh doanh</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Đang tải danh sách sản phẩm...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="admin-empty">
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>STT</th>
                    <th>Sản phẩm</th>
                    <th>Loại</th>
                    <th className="text-end">Giá bán</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product, index) => (
                    <tr key={product.id}>
                      <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={product.image} 
                            alt={product.name} 
                            className="rounded" 
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-semibold">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-neutral">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success">
                        {formatVnd(product.price)}
                      </td>
                      <td className="text-center">
                        <span className={`admin-badge ${product.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {product.status === 'Active' ? 'Kinh doanh' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(product);
                              setShowModal(true);
                            }}
                            title="Xem chi tiết"
                          >Xem</button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate('/super-admin/catalog-products/create', { state: { editData: product } })}
                            title="Sửa sản phẩm"
                          >Sửa</button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteError("");
                              setShowDeleteModal(true);
                            }}
                            title="Xóa sản phẩm"
                          >Xóa</button>
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
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="sản phẩm"
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                Chi tiết sản phẩm
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row">
                <div className="col-md-5">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name} 
                    className="img-fluid rounded-4 mb-3 w-100" 
                    style={{ objectFit: 'cover', aspectRatio: '1/1' }} 
                  />
                  <div className="text-center">
                    <span className={`admin-badge ${selectedItem.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {selectedItem.status === 'Active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                    </span>
                  </div>
                </div>
                <div className="col-md-7">
                  <h4 className="fw-bold mb-3">{selectedItem.name}</h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <p className="mb-2"><strong className="text-muted">Loại sản phẩm:</strong> {selectedItem.categoryName}</p>
                      <p className="mb-2"><strong className="text-muted">Giá niêm yết:</strong> <span className="text-success fw-bold fs-5">{formatVnd(selectedItem.price)}</span></p>
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
                  navigate('/super-admin/catalog-products/create', { state: { editData: selectedItem } });
                }}
              >
                Chỉnh sửa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeProductDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                Xác nhận xóa sản phẩm
              </h3>
              <button type="button" className="admin-modal-close" onClick={closeProductDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh mục hệ thống?</p>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={productToDelete.image} 
                    alt={productToDelete.name} 
                    className="rounded" 
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                  <div>
                    <strong>Tên:</strong> {productToDelete.name}<br/>
                    <strong>Loại:</strong> {productToDelete.categoryName}
                  </div>
                </div>
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  {deleteError}
                </div>
              )}
              <p className="text-muted small mb-0">
                Lưu ý: Chỉ có thể xóa sản phẩm nếu chưa có chi nhánh rạp nào nhập về bán.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={closeProductDeleteModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteProduct(productToDelete)}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastComponent />
    </AdminPanelPage>
  );
};

export default ProductManagement;
