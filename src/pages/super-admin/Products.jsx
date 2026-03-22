import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Form, Table } from "react-bootstrap";
import { Film, Plus, Trash2 } from "lucide-react";
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
    <div className="text-light">
      <Card className="border-0 mb-3" style={{ background: "rgba(15,23,42,0.72)", borderRadius: 16 }}>
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <Film size={20} /> Danh mục phim (catalog)
            </h4>
            <small className="text-secondary">Dữ liệu từ API — tạo/sửa qua trang tạo phim.</small>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              placeholder="Tìm phim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark text-light border-secondary"
              style={{ minWidth: 200 }}
            />
            <Button as={Link} to="/super-admin/movies/create" variant="primary">
              <Plus size={16} className="me-1" /> Thêm phim
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0" style={{ background: "rgba(15,23,42,0.7)", borderRadius: 16 }}>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 text-light align-middle">
            <thead className="table-dark">
              <tr>
                <th className="ps-3">ID</th>
                <th>Tên</th>
                <th>Thể loại</th>
                <th>Phút</th>
                <th>Giá gốc</th>
                <th className="text-end pe-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-secondary">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-secondary">
                    Không có phim.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="ps-3 fw-bold">{m.id}</td>
                    <td>{m.title}</td>
                    <td>{m.genre ?? "—"}</td>
                    <td>{m.duration ?? "—"}</td>
                    <td>{m.basePrice != null ? `${m.basePrice.toLocaleString("vi-VN")} đ` : "—"}</td>
                    <td className="text-end pe-3">
                      <Badge bg="secondary" className="me-2">
                        {m.status === 1 ? "Hiển thị" : "Ẩn"}
                      </Badge>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
