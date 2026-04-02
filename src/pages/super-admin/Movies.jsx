import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { MOVIES } from '../../constants/apiEndpoints';

const PLACEHOLDER_POSTER = 'https://placehold.co/120x180?text=Poster';

const MovieManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const itemsPerPage = 8;

  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Xóa state để tránh hiện lại khi F5
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(MOVIES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setAllMovies(
          arr.map((m) => {
            const rd = m.releaseDate ? new Date(m.releaseDate) : null;
            if (rd) rd.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let statusStr = m.status === 1 ? 'Active' : (m.status === 2 ? 'Upcoming' : 'Inactive');
            
            // CHỈ tự động chuyển từ Sắp chiếu -> Đang chiếu nếu đã đến ngày
            // Nếu là Ngưng chiếu (Inactive) thì giữ nguyên
            if (statusStr === 'Upcoming' && rd && rd <= today) {
              statusStr = 'Active';
            }

            return {
              id: m.id,
              title: m.title ?? '',
              author: m.author ?? '—',
              nation: m.nation ?? '—',
              duration: m.duration ?? 0,
              release_date: m.releaseDate ?? '',
              base_price: m.basePrice ?? 0,
              status: statusStr,
              age_limit: m.ageLimit != null ? `${m.ageLimit}+` : '—',
              genre: m.genre ?? '—',
              description: m.description ?? '',
              describe: m.content ?? '',
              poster: m.posterUrl || PLACEHOLDER_POSTER,
              banner: m.banner || m.posterUrl || PLACEHOLDER_POSTER,
              genre_id: '',
            };
          })
        );
      } catch {
        if (mounted) setAllMovies([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Logic lọc, tìm kiếm và sắp xếp
  const filteredMovies = allMovies
    .filter(movie => {
      const matchesSearch = String(movie.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           String(movie.author || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || movie.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteMovie = async (movie) => {
    try {
      const res = await apiFetch(MOVIES.DELETE(movie.id), {
        method: "DELETE"
      });
      
      if (res.ok) {
        showToast('Xóa phim thành công!');
        // Refresh danh sách
        const refreshRes = await apiFetch(MOVIES.LIST);
        const json = await refreshRes.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        setAllMovies(
          arr.map((m) => {
            const rd = m.releaseDate ? new Date(m.releaseDate) : null;
            if (rd) rd.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let statusStr = m.status === 1 ? 'Active' : (m.status === 2 ? 'Upcoming' : 'Inactive');
            
            // CHỈ tự động chuyển từ Sắp chiếu -> Đang chiếu nếu đã đến ngày
            // Nếu là Ngưng chiếu (Inactive) thì giữ nguyên
            if (statusStr === 'Upcoming' && rd && rd <= today) {
              statusStr = 'Active';
            }

            return {
              id: m.id,
              title: m.title ?? '',
              author: m.author ?? '—',
              nation: m.nation ?? '—',
              duration: m.duration ?? 0,
              release_date: m.releaseDate ?? '',
              base_price: m.basePrice ?? 0,
              status: statusStr,
              age_limit: m.ageLimit != null ? `${m.ageLimit}+` : '—',
              genre: m.genre ?? '—',
              description: m.description ?? '',
              describe: m.content ?? '',
              poster: m.posterUrl || PLACEHOLDER_POSTER,
              banner: m.banner || m.posterUrl || PLACEHOLDER_POSTER,
              genre_id: '',
            };
          })
        );
        setShowDeleteModal(false);
        setMovieToDelete(null);
      } else {
        showToast('Xóa phim thất bại!', 'danger');
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      showToast('Lỗi kết nối máy chủ!', 'danger');
    }
  };

  const openDeleteModal = (movie) => {
    setMovieToDelete(movie);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMovieToDelete(null);
  };

  return (
    <AdminPanelPage
      icon="film"
      title="Quản lý phim"
      description="Kho phim toàn hệ thống — poster, giá, trạng thái chiếu."
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate('/super-admin/movies/create')}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Thêm phim mới
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
              placeholder="Tìm theo tên phim, đạo diễn..."
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
              <option value="Active">Đang chiếu</option>
              <option value="Upcoming">Sắp chiếu</option>
              <option value="Inactive">Ngưng chiếu</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Đang tải danh sách phim...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="admin-empty">
            <i className="bi bi-film admin-empty-icon"></i>
            <p>Chưa có phim nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Phim</th>
                    <th className="text-center">Thời lượng</th>
                    <th>Quốc gia</th>
                    <th>Ngày khởi chiếu</th>
                    <th className="text-end">Giá cơ bản</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((movie) => (
                    <tr key={movie.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img 
                            src={movie.poster} 
                            alt={movie.title} 
                            className="rounded" 
                            style={{ width: '50px', height: '70px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-semibold">{movie.title}</div>
                            <small className="text-muted">Đạo diễn: {movie.author}</small>
                            <div className="mt-1">
                              <span className="admin-badge admin-badge-primary" style={{ fontSize: '0.7rem' }}>
                                {movie.age_limit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{movie.duration} phút</td>
                      <td>{movie.nation}</td>
                      <td>{new Date(movie.release_date).toLocaleDateString('vi-VN')}</td>
                      <td className="text-end fw-bold text-success">
                        {movie.base_price.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="text-center">
                        <span className={`admin-badge ${
                          movie.status === 'Active' ? 'admin-badge-success' : 
                          movie.status === 'Upcoming' ? 'admin-badge-warning' : 
                          'admin-badge-danger'
                        }`}>
                          {movie.status === 'Active' ? 'Đang chiếu' : 
                           movie.status === 'Upcoming' ? 'Sắp chiếu' : 
                           'Ngưng chiếu'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(movie);
                              setShowModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate('/super-admin/movies/create', { state: { editData: movie } })}
                            title="Sửa phim"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openDeleteModal(movie)}
                            title="Xóa phim"
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
                Tổng cộng: {filteredMovies.length} phim
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
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <i className="bi bi-film me-2"></i>
                Chi tiết phim
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="row">
                <div className="col-md-4">
                  <img 
                    src={selectedItem.poster} 
                    alt={selectedItem.title} 
                    className="img-fluid rounded-4 mb-3 w-100"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="text-center">
                    <span className="admin-badge admin-badge-primary">{selectedItem.age_limit}</span>
                  </div>
                </div>
                <div className="col-md-8">
                  <h4 className="fw-bold mb-3">{selectedItem.title}</h4>
                  <div className="row g-3">
                    <div className="col-6">
                      <p className="mb-2"><strong className="text-muted">Đạo diễn:</strong> {selectedItem.author}</p>
                      <p className="mb-2"><strong className="text-muted">Thời lượng:</strong> {selectedItem.duration} phút</p>
                      <p className="mb-2"><strong className="text-muted">Quốc gia:</strong> {selectedItem.nation}</p>
                    </div>
                    <div className="col-6">
                      <p className="mb-2"><strong className="text-muted">Ngày chiếu:</strong> {new Date(selectedItem.release_date).toLocaleDateString('vi-VN')}</p>
                      <p className="mb-2"><strong className="text-muted">Thể loại:</strong> {selectedItem.genre}</p>
                      <p className="mb-2">
                        <strong className="text-muted">Trạng thái:</strong>
                        <span className={`ms-2 admin-badge ${
                          selectedItem.status === 'Active' ? 'admin-badge-success' : 
                          selectedItem.status === 'Upcoming' ? 'admin-badge-warning' : 
                          'admin-badge-danger'
                        }`}>
                          {selectedItem.status === 'Active' ? 'Đang chiếu' : 
                           selectedItem.status === 'Upcoming' ? 'Sắp chiếu' : 
                           'Ngưng chiếu'}
                        </span>
                      </p>
                    </div>
                    <div className="col-12">
                      <p className="mb-2"><strong className="text-muted">Giá vé cơ bản:</strong> <span className="text-success fw-bold">{selectedItem.base_price.toLocaleString('vi-VN')}đ</span></p>
                      <p className="mb-2"><strong className="text-muted">Mô tả:</strong> {selectedItem.description}</p>
                      <p className="mb-1"><strong className="text-muted">Nội dung chi tiết:</strong></p>
                      <p>{selectedItem.describe}</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 mt-3">
                  <p className="mb-2"><strong className="text-muted">Banner:</strong></p>
                  <img 
                    src={selectedItem.banner} 
                    alt="Banner" 
                    className="img-fluid rounded-4 w-100" 
                    style={{ maxHeight: '200px', objectFit: 'cover' }} 
                  />
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
                  navigate('/super-admin/movies/create', { state: { editData: selectedItem } });
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa phim */}
      {showDeleteModal && movieToDelete && (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDeleteModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa phim
              </h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="mb-3">Bạn có chắc chắn muốn xóa phim này?</p>
              <div className="alert alert-warning">
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={movieToDelete.poster} 
                    alt={movieToDelete.title} 
                    className="rounded" 
                    style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                  />
                  <div>
                    <strong>Tên phim:</strong> {movieToDelete.title}<br/>
                    <strong>Đạo diễn:</strong> {movieToDelete.author}<br/>
                    <strong>Thời lượng:</strong> {movieToDelete.duration} phút
                  </div>
                </div>
              </div>
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Hành động này không thể hoàn tác. Tất cả suất chiếu, vé đặt và dữ liệu liên quan sẽ bị xóa.
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
                onClick={() => handleDeleteMovie(movieToDelete)}
              >
                <i className="bi bi-trash me-2"></i>
                Xóa phim
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

export default MovieManagement;
