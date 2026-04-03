import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { Package, Plus, Trash2, Edit, Eye } from "lucide-react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { PRODUCTS } from "../../constants/apiEndpoints";

/**
 * Catalog sản phẩm toàn hệ thống — CRUD qua API `/api/v1/products`.
 */
export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch(PRODUCTS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        setProducts(Array.isArray(list) ? list : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => 
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.description || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleDelete = async (productId) => {
    if (!window.confirm("Xóa sản phẩm này khỏi hệ thống?")) return;
    try {
      const res = await apiFetch(PRODUCTS.BY_ID(productId), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Xóa thất bại");
        return;
      }
      load();
    } catch {
      alert("Không thể kết nối server");
    }
  };

  return (
    <AdminPanelPage
      icon="package"
      title="Danh mục sản phẩm (catalog)"
      description="Toàn bộ sản phẩm trong hệ thống — quản lý đồ ăn, nước uống."
      headerRight={
        <Link to="/super-admin/catalog-products/create" className="admin-btn" style={{ background: "white", color: "#6366f1" }}>
          <Plus size={16} className="me-1" /> Thêm sản phẩm
        </Link>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <Package size={20} className="text-primary" />
            Danh sách sản phẩm
          </h4>
          <div className="admin-search-wrapper mb-0" style={{ maxWidth: 320 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm sản phẩm"
            />
          </div>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Mô tả</th>
                  <th>Giá</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Không có sản phẩm.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.id}</td>
                      <td className="fw-semibold">{p.name}</td>
                      <td className="text-muted small">{p.description || "—"}</td>
                      <td>{p.price != null ? `${p.price.toLocaleString("vi-VN")} đ` : "—"}</td>
                      <td>{p.categoryName || "—"}</td>
                      <td>
                        <span className={p.status === 1 ? "admin-badge admin-badge-success" : "admin-badge admin-badge-secondary"}>
                          {p.status === 1 ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedItem(p); setShowModal(true); }} title="Xem chi tiết">
                            <Eye size={14} />
                          </Button>
                          <Button variant="outline-primary" size="sm" onClick={() => navigate("/super-admin/catalog-products/create", { state: { editData: p } })} title="Sửa sản phẩm">
                            <Edit size={14} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)} title="Xóa">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal xem chi tiết sản phẩm */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi tiết sản phẩm</h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">ID sản phẩm</p>
                  <p className="fw-bold mb-3">{selectedItem.id}</p>
                  
                  <p className="admin-form-label mb-1">Tên sản phẩm</p>
                  <p className="fw-bold fs-5 mb-3">{selectedItem.name}</p>
                  
                  <p className="admin-form-label mb-1">Giá</p>
                  <p className="fw-bold fs-5 mb-3">
                    {selectedItem.price != null ? `${selectedItem.price.toLocaleString("vi-VN")} đ` : "—"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Loại sản phẩm</p>
                  <p className="mb-3">{selectedItem.categoryName || "—"}</p>
                  
                  <p className="admin-form-label mb-1">Trạng thái</p>
                  <span className={selectedItem.status === 1 ? "admin-badge admin-badge-success" : "admin-badge admin-badge-secondary"}>
                    {selectedItem.status === 1 ? "Đang bán" : "Ngừng bán"}
                  </span>
                  
                  <p className="admin-form-label mb-1 mt-3">Mô tả</p>
                  <p className="mb-3">{selectedItem.description || "Không có mô tả"}</p>
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
}
