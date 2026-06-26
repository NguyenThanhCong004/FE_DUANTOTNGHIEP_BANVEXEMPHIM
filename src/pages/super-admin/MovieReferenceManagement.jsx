import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminPagination from "../../components/admin/AdminPagination";
import { apiFetch } from "../../utils/apiClient";
import { AUTHORS, NATIONS } from "../../constants/apiEndpoints";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { useAdminToast } from "../../components/admin/AdminToast";

const CONFIG = {
  author: { title: "Tác giả", singular: "tác giả", plural: "tác giả", icon: "person-vcard", api: AUTHORS },
  nation: { title: "Quốc gia", singular: "quốc gia", plural: "quốc gia", icon: "globe2", api: NATIONS },
};

export default function MovieReferenceManagement({ type }) {
  const config = CONFIG[type] || CONFIG.author;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastComponent } = useAdminToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [removeItem, setRemoveItem] = useState(null);
  const PER_PAGE = 8;
  const basePath = type === "nation" ? "/super-admin/nations" : "/super-admin/authors";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(config.api.LIST);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(apiMessage(json, `Không tải được ${config.plural}`));
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      showToast(error.message || MESSAGES.networkError, "error");
    } finally { setLoading(false); }
  }, [config.api.LIST, config.plural, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || "success");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, showToast]);

  const filtered = useMemo(() => items.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const remove = async () => {
    try {
      const res = await apiFetch(config.api.BY_ID(removeItem.id), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(apiMessage(json, `Không thể xóa ${config.singular}`));
      setRemoveItem(null); showToast("Đã xóa", "success"); await load();
    } catch (error) { showToast(error.message || MESSAGES.networkError, "error"); }
  };

  return <AdminPanelPage icon={config.icon} title={`Quản lý ${config.title.toLowerCase()}`} description={`Danh mục ${config.plural} dùng khi tạo và cập nhật phim.`}
    headerRight={<button type="button" className="admin-btn" style={{ background: "white", color: "#6366f1" }} onClick={() => navigate(`${basePath}/create`)}><i className="bi bi-plus-lg me-2" />Thêm {config.singular}</button>}>
    <ToastComponent />
    <div className="admin-card admin-slide-up">
      <div className="admin-card-header flex-wrap gap-2"><h4 className="mb-0">Danh sách {config.plural}</h4><span className="text-muted small">Tổng: {filtered.length}</span></div>
      <div className="admin-card-body">
        <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}><i className="bi bi-search admin-search-icon" /><input className="admin-search-input" value={search} placeholder={`Tìm ${config.singular}...`} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="table-responsive"><table className="admin-table mb-0"><thead><tr><th style={{ width: 72 }}>STT</th><th>Tên {config.singular}</th><th>Trạng thái</th><th className="text-center">Thao tác</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="4" className="text-center py-4 text-muted">Đang tải...</td></tr> : pageItems.length === 0 ? <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa có dữ liệu.</td></tr> : pageItems.map((item, index) => <tr key={item.id}><td>{(page - 1) * PER_PAGE + index + 1}</td><td className="fw-semibold">{item.name}</td><td><span className={`admin-badge ${item.status === 1 ? "admin-badge-success" : "admin-badge-danger"}`}>{item.status === 1 ? "Đang dùng" : "Ngừng dùng"}</span></td><td className="text-center"><button type="button" className="admin-btn admin-btn-sm admin-btn-primary me-1" onClick={() => navigate(`${basePath}/edit/${item.id}`, { state: { editData: item } })} title="Sửa"><i className="bi bi-pencil" /></button><button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setRemoveItem(item)} title="Xóa"><i className="bi bi-trash" /></button></td></tr>)}
        </tbody></table></div>
        <AdminPagination currentPage={page} totalPages={Math.ceil(filtered.length / PER_PAGE)} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} itemLabel={config.singular} />
      </div>
    </div>
    {removeItem && <div className="admin-modal-overlay" onClick={() => setRemoveItem(null)}><div className="admin-modal" role="dialog" onClick={(e) => e.stopPropagation()}><div className="admin-modal-header"><h3 className="text-danger mb-0">Xác nhận xóa</h3><button type="button" className="admin-modal-close" onClick={() => setRemoveItem(null)}>×</button></div><div className="admin-modal-body">Xóa <strong>{removeItem.name}</strong>? Không thể xóa nếu đang có phim sử dụng.</div><div className="admin-modal-footer"><button type="button" className="admin-btn admin-btn-outline-secondary" onClick={() => setRemoveItem(null)}>Hủy</button><button type="button" className="admin-btn admin-btn-danger" onClick={remove}>Xóa</button></div></div></div>}
  </AdminPanelPage>;
}
