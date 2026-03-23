import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import { Film, Plus, Trash2 } from "lucide-react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { MOVIES } from "../../constants/apiEndpoints";

/**
 * Catalog phim toàn hệ thống — CRUD qua API `/api/v1/movies`.
 */
export default function Products() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch(MOVIES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        setMovies(Array.isArray(list) ? list : []);
      } catch {
        setMovies([]);
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
    if (!q) return movies;
    return movies.filter((m) => String(m.title || "").toLowerCase().includes(q));
  }, [movies, search]);

  const handleDelete = async (movieId) => {
    if (!window.confirm("Xóa phim này khỏi hệ thống? (Có thể lỗi nếu còn suất chiếu tham chiếu)")) return;
    try {
      const res = await apiFetch(MOVIES.BY_ID(movieId), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Xóa thất bại");
        return;
      }
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch {
      alert("Không thể kết nối server");
    }
  };

  return (
    <AdminPanelPage
      icon="film"
      title="Danh mục phim (catalog)"
      description="Toàn bộ phim trong hệ thống — tạo/sửa qua trang tạo phim."
      headerRight={
        <Link to="/super-admin/movies/create" className="admin-btn" style={{ background: "white", color: "#6366f1" }}>
          <Plus size={16} className="me-1" /> Thêm phim
        </Link>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <Film size={20} className="text-primary" />
            Danh sách phim
          </h4>
          <div className="admin-search-wrapper mb-0" style={{ maxWidth: 320 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tên phim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm phim"
            />
          </div>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>ID</th>
                  <th>Tên</th>
                  <th>Thể loại</th>
                  <th>Phút</th>
                  <th>Giá gốc</th>
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
                      Không có phim.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id}>
                      <td className="fw-semibold">{m.id}</td>
                      <td>{m.title}</td>
                      <td>{m.genre ?? "—"}</td>
                      <td>{m.duration ?? "—"}</td>
                      <td>{m.basePrice != null ? `${m.basePrice.toLocaleString("vi-VN")} đ` : "—"}</td>
                      <td>
                        <span className={m.status === 1 ? "admin-badge admin-badge-success" : "admin-badge admin-badge-secondary"}>
                          {m.status === 1 ? "Hiển thị" : "Ẩn"}
                        </span>
                      </td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m.id)} title="Xóa">
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPanelPage>
  );
}
