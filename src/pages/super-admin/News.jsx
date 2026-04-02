import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { NEWS } from '../../constants/apiEndpoints';

const NewsManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const itemsPerPage = 8;

  const [newsList, setNewsList] = useState([]);
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

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(NEWS.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      const arr = Array.isArray(list) ? list : [];
      setNewsList(
        arr.map((n) => ({
          id: n.id,
          title: n.title ?? '',
          content: n.content ?? '',
          image: n.image || 'https://placehold.co/600x360?text=News',
          status: n.status === 1 ? 'Active' : 'Inactive',
          date: n.createdAt || new Date().toISOString(),
        }))
      );
    } catch {
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDeleteNews = async (news) => {
    try {
      const res = await apiFetch(NEWS.DELETE(news.id), {
        method: "DELETE"
      });
      if (res.ok) {
        showToast('Xóa bài viết thành công!');
        await fetchNews();
        setShowDeleteModal(false);
        setNewsToDelete(null);
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || "Xóa tin thất bại", 'danger');
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      showToast("Lỗi kết nối máy chủ", 'danger');
    }
  };

  const openDeleteModal = (news) => {
    setNewsToDelete(news);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setNewsToDelete(null);
  };

  // Logic lọc, tìm kiếm và sắp xếp (mới nhất lên đầu)
  const filteredNews = newsList
    .filter(news => {
      const matchesSearch = String(news.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || news.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <AdminPanelPage
      icon="newspaper"
      title="Tin tức hệ thống"
      description="Quản lý các bài viết, tin khuyến mãi và thông báo trên toàn hệ thống."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate('/super-admin/news/create')}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Viết tin mới
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
              placeholder="Tìm theo tiêu đề bài viết..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
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
              <option value="Active">Công khai</option>
              <option value="Inactive">Bản nháp / Tạm ẩn</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Đang tải danh sách tin tức...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="admin-empty">
            <i className="bi bi-newspaper admin-empty-icon"></i>
            <p>Không tìm thấy tin tức nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tin tức</th>
                    <th>Ngày đăng</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((news, index) => (
                    <tr key={news.id}>
                      <td className="fw-medium text-muted" style={{ width: '60px' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img 
                            src={news.image} 
                            alt={news.title} 
                            className="rounded" 
                            style={{ width: '80px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-semibold line-clamp-1">{news.title}</div>
                            <small className="text-muted line-clamp-1" style={{ maxWidth: '400px' }}>
                              {news.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(news.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="text-center">
                        <span className={`admin-badge ${news.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {news.status === 'Active' ? 'Công khai' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(news);
                              setShowModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate('/super-admin/news/create', { state: { editData: news } })}
                            title="Sửa tin tức"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openDeleteModal(news)}
                            title="Xóa tin tức"
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
                Tổng cộng: {filteredNews.length} bài viết
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
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-newspaper me-2"></i>
                Chi tiết tin tức
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <img 
                src={selectedItem.image} 
                alt={selectedItem.title} 
                className="img-fluid rounded-4 mb-4 w-100" 
                style={{ maxHeight: '350px', objectFit: 'cover' }} 
              />
              <h4 className="fw-bold mb-3">{selectedItem.title}</h4>
              <div className="d-flex flex-wrap gap-3 align-items-center mb-4 pb-3 border-bottom">
                <span className={`admin-badge ${selectedItem.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                  {selectedItem.status === 'Active' ? 'Công khai' : 'Tạm ẩn'}
                </span>
                <span className="text-muted small">
                  <i className="bi bi-calendar3 me-2"></i>
                  Ngày đăng: {new Date(selectedItem.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div 
                className="text-dark admin-news-content" 
                style={{ lineHeight: '1.8', fontSize: '1.05rem' }}
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate('/super-admin/news/create', { state: { editData: selectedItem } });
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Chỉnh sửa bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && newsToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa tin tức
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa bài viết này?</p>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={newsToDelete.image} 
                    alt={newsToDelete.title} 
                    className="rounded" 
                    style={{ width: '80px', height: '50px', objectFit: 'cover' }}
                  />
                  <div className="fw-bold text-truncate" style={{ maxWidth: '300px' }}>
                    {newsToDelete.title}
                  </div>
                </div>
              </div>
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Hành động này không thể hoàn tác. Bài viết sẽ bị gỡ khỏi trang chủ và ứng dụng khách hàng.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={closeDeleteModal}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteNews(newsToDelete)}
              >
                <i className="bi bi-trash me-2"></i>
                Xóa bài viết
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

export default NewsManagement;
