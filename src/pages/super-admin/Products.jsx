import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { PRODUCTS, PRODUCT_CATEGORIES } from "../../constants/apiEndpoints";

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
  const itemsPerPage = 8;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(PRODUCTS.LIST);
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
          status: p.status === 1 ? "Active" : "Inactive",
          image: p.image || "https://placehold.co/200x200?text=Product",
        })).sort((a, b) => b.id - a.id)
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch(PRODUCT_CATEGORIES.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = String(p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(p.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || String(p.categoryId) === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteProduct = async (product) => {
    try {
      const res = await apiFetch(PRODUCTS.BY_ID(product.id), {
        method: "DELETE"
      });
      if (res.ok) {
        showToast('Xóa sản phẩm thành công!');
        await fetchProducts();
        setShowDeleteModal(false);
        setProductToDelete(null);
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || "Xóa sản phẩm thất bại", 'danger');
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Lỗi kết nối máy chủ", 'danger');
    }
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
          <i className="bi bi-plus-lg me-2"></i>
          Thêm sản phẩm mới
        </button>
      }
    >
      <div className="admin-table-container">
        {/* Search & Filter Bar */}
        <div className="d-flex flex-wrap gap-3 mb-4">
          <div className="admin-search-wrapper" style={{ maxWidth: '400px', flex: '1' }}>
            <i className="bi bi-search admin-search-icon"></i>
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
            <i className="bi bi-package admin-empty-icon"></i>
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Loại</th>
                    <th className="text-end">Giá bán</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product) => (
                    <tr key={product.id}>
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
                            <small className="text-muted line-clamp-1" style={{ maxWidth: '250px' }}>
                              {product.description || "Không có mô tả"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-neutral">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success">
                        {product.price.toLocaleString('vi-VN')}đ
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
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate('/super-admin/catalog-products/create', { state: { editData: product } })}
                            title="Sửa sản phẩm"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => {
                              setProductToDelete(product);
                              setShowDeleteModal(true);
                            }}
                            title="Xóa sản phẩm"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="text-muted small">
                Tổng cộng: {filteredProducts.length} sản phẩm
              </span>
              <nav>
                <ul className="admin-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1}>
                      <button 
                        className={`admin-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => paginate(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-package me-2"></i>
                Chi tiết sản phẩm
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
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
                      <p className="mb-2"><strong className="text-muted">Giá niêm yết:</strong> <span className="text-success fw-bold fs-5">{selectedItem.price.toLocaleString('vi-VN')}đ</span></p>
                    </div>
                    <div className="col-12">
                      <hr className="my-2" />
                      <p className="mb-2"><strong className="text-muted">Mô tả sản phẩm:</strong></p>
                      <div className="p-3 bg-light rounded-4 text-dark" style={{ lineHeight: '1.6' }}>
                        {selectedItem.description || "Sản phẩm này chưa có mô tả chi tiết."}
                      </div>
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
                <i className="bi bi-pencil me-2"></i>
                Chỉnh sửa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa sản phẩm
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setShowDeleteModal(false)}>
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
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Lưu ý: Chỉ có thể xóa sản phẩm nếu chưa có chi nhánh rạp nào nhập về bán.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteProduct(productToDelete)}
              >
                <i className="bi bi-trash me-2"></i>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
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

export default ProductManagement;
