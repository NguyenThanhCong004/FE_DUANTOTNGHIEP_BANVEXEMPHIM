import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { NEWS } from "../../constants/apiEndpoints";

const NewsManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 8;

  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(NEWS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setNewsList(
          arr.map((n) => ({
            id: n.id,
            title: n.title ?? "",
            content: n.content ?? "",
            image: n.image || "https://placehold.co/600x360?text=News",
            status: n.status === 1 ? "Active" : "Inactive",
            date: n.createdAt || new Date().toISOString(),
          }))
        );
      } catch {
        if (mounted) setNewsList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredNews = newsList.filter((news) =>
    String(news.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  return (
    <AdminPanelPage
      icon="newspaper"
      title="Tin tức"
      description="Bài viết, trạng thái đăng và nội dung hiển thị."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate("/super-admin/news/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Viết tin mới
        </button>
      }
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách tin
          </h4>
          <span className="text-muted small">Tổng: {filteredNews.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tiêu đề tin tức..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm tin"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>STT</th>
                  <th>Hình ảnh</th>
                  <th>Tiêu đề bài viết</th>
                  <th>Ngày đăng</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  currentItems.map((news, index) => (
                    <tr key={news.id}>
                      <td className="fw-semibold">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <img
                          src={news.image}
                          alt=""
                          className="rounded border"
                          style={{ width: 100, height: 60, objectFit: "cover" }}
                        />
                      </td>
                      <td className="fw-semibold">{news.title}</td>
                      <td className="small text-muted">{new Date(news.date).toLocaleDateString("vi-VN")}</td>
                      <td className="text-center">
                        <span
                          className={
                            news.status === "Active"
                              ? "admin-badge admin-badge-success"
                              : "admin-badge admin-badge-danger"
                          }
                        >
                          {news.status === "Active" ? "Công khai" : "Bản nháp"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(news);
                              setShowModal(true);
                            }}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate("/super-admin/news/create", { state: { editData: news } })}
                          >
                            Sửa
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

      {showModal && selectedItem && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 720 }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="text-truncate" style={{ maxWidth: "85%" }}>
                {selectedItem.title}
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <img
                src={selectedItem.image}
                alt=""
                className="w-100 rounded mb-3"
                style={{ maxHeight: 320, objectFit: "cover" }}
              />
              <div className="d-flex flex-wrap gap-3 align-items-center mb-3 pb-3 border-bottom">
                <span
                  className={
                    selectedItem.status === "Active"
                      ? "admin-badge admin-badge-success"
                      : "admin-badge admin-badge-danger"
                  }
                >
                  {selectedItem.status === "Active" ? "Công khai" : "Bản nháp"}
                </span>
                <span className="text-muted small">
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date(selectedItem.date).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {selectedItem.content}
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
};

export default NewsManagement;
