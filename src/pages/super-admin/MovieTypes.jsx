import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { GENRES } from "../../constants/apiEndpoints";

const MovieTypeManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(GENRES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setGenres(
          arr.map((g) => ({
            id: g.genreId ?? g.id,
            name: g.name ?? "",
          }))
        );
      } catch {
        if (mounted) setGenres([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredGenres = genres.filter((genre) =>
    String(genre.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGenres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGenres.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="collection-play"
      title="Thể loại phim"
      description="Phân loại phim (hành động, tình cảm, hoạt hình…)."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/movie-types/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Thêm thể loại
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách thể loại
          </h4>
          <span className="text-muted small">Tổng: {filteredGenres.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm nhanh tên thể loại..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm thể loại"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>STT</th>
                  <th>Tên thể loại</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted">
                      Đang tải thể loại...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted">
                      Không có thể loại.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((genre, index) => (
                    <tr key={genre.id}>
                      <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <span className="admin-badge admin-badge-neutral">{genre.name}</span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => navigate("/super-admin/movie-types/create", { state: { editData: genre } })}
                        >
                          Sửa
                        </button>
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

export default MovieTypeManagement;
