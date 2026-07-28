import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch, withQuery } from '../../utils/apiClient';
import { MOVIES } from '../../constants/apiEndpoints';
import { useAdminToast } from '../../components/admin/AdminToast';
import { codeToAdminStatus } from '../../utils/statusFormat';
import { apiMessage, MESSAGES } from '../../utils/uiMessages';
import { formatDate, formatVnd } from '../../utils/formatters';
import AdminPagination from '../../components/admin/AdminPagination';
import sanitizeHtml from '../../utils/sanitizeHtml';

const PLACEHOLDER_POSTER = 'https://placehold.co/120x180?text=Poster';

const MovieManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastComponent } = useAdminToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const itemsPerPage = 5;

  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Xóa state để tránh hiện lại khi F5
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(withQuery(MOVIES.LIST, { search: searchTerm }));
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

            let statusStr = codeToAdminStatus(m.status, { allowUpcoming: true });
            
            // CHỈ tự động chuyển từ Sắp chiếu -> Đang chiếu nếu đã đến ngày
            // Nếu là Ngưng chiếu (Inactive) thì giữ nguyên
            if (statusStr === 'Upcoming' && rd && rd <= today) {
              statusStr = 'Active';
            }

            return {
              id: m.id,
              title: m.title ?? '',
              duration: m.duration ?? 0,
              release_date: m.releaseDate ?? '',
              base_price: m.basePrice ?? 0,
              status: statusStr,
              age_limit: m.ageLimit != null ? `${m.ageLimit}+` : '—',
              genre: Array.isArray(m.genres) && m.genres.length ? m.genres.join(', ') : '—',
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
  }, [searchTerm]);

  // Logic lọc, tìm kiếm và sắp xếp
  const filteredMovies = allMovies
    .filter(movie => {
      const matchesStatus = statusFilter === 'All' || movie.status === statusFilter;
      return matchesStatus;
    })
    .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const handleDeleteMovie = async (movie) => {
    try {
      const res = await apiFetch(MOVIES.DELETE(movie.id), {
        method: "DELETE"
      });
      
      if (res.ok) {
        showToast('Xóa phim thành công');
        // Refresh danh sách
        const refreshRes = await apiFetch(withQuery(MOVIES.LIST, { search: searchTerm }));
        const json = await refreshRes.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        setAllMovies(
          arr.map((m) => {
            const rd = m.releaseDate ? new Date(m.releaseDate) : null;
            if (rd) rd.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let statusStr = codeToAdminStatus(m.status, { allowUpcoming: true });
            
            // CHỈ tự động chuyển từ Sắp chiếu -> Đang chiếu nếu đã đến ngày
            // Nếu là Ngưng chiếu (Inactive) thì giữ nguyên
            if (statusStr === 'Upcoming' && rd && rd <= today) {
              statusStr = 'Active';
            }

            return {
              id: m.id,
              title: m.title ?? '',
              duration: m.duration ?? 0,
              release_date: m.releaseDate ?? '',
              base_price: m.basePrice ?? 0,
              status: statusStr,
              age_limit: m.ageLimit != null ? `${m.ageLimit}+` : '—',
              genre: Array.isArray(m.genres) && m.genres.length ? m.genres.join(', ') : '—',
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
        setDeleteError("");
      } else {
        const errJson = await res.json().catch(() => null);
        setDeleteError(apiMessage(errJson, "Xóa phim thất bại"));
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      setDeleteError(MESSAGES.networkError);
    }
  };

  const openDeleteModal = (movie) => {
    setMovieToDelete(movie);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMovieToDelete(null);
    setDeleteError("");
  };

  return (
    <>
      <AdminPanelPage
      icon="film"
      title="Quản lý phim"
      headerRight={
        <button
          type="button"
          className="admin-btn"
          style={{ background: "white", color: "#6366f1" }}
          onClick={() => navigate('/super-admin/movies/create')}
        >
          Thêm phim mới
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
            <p>Chưa có phim nào</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>STT</th>
                    <th>Phim</th>
                    <th className="text-center">Thời lượng</th>
                    <th>Ngày khởi chiếu</th>
                    <th className="text-end">Giá cơ bản</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((movie, index) => (
                    <tr key={movie.id}>
                      <td className="fw-semibold text-muted align-middle">{indexOfFirstItem + index + 1}</td>
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
                            <div className="mt-1">
                              <span className="admin-badge admin-badge-primary" style={{ fontSize: '0.7rem' }}>
                                {movie.age_limit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{movie.duration} phút</td>
                      <td>{formatDate(movie.release_date)}</td>
                      <td className="text-end fw-bold text-success">
                        {formatVnd(movie.base_price)}
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
                          >Xem</button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => navigate('/super-admin/movies/create', { state: { editData: movie } })}
                            title="Sửa phim"
                          >Sửa</button>
                          <button 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openDeleteModal(movie)}
                            title="Xóa phim"
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
              totalItems={filteredMovies.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="phim"
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                Chi tiết phim
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
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
                      <p className="mb-2"><strong className="text-muted">Thời lượng:</strong> {selectedItem.duration} phút</p>
                    </div>
                    <div className="col-6">
                      <p className="mb-2"><strong className="text-muted">Ngày chiếu:</strong> {formatDate(selectedItem.release_date)}</p>
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
                      <p className="mb-2"><strong className="text-muted">Giá vé cơ bản:</strong> <span className="text-success fw-bold">{formatVnd(selectedItem.base_price)}</span></p>
                      <p className="mb-1"><strong className="text-muted">Mô tả:</strong></p>
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedItem.description || "") }} />
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
                    <strong>Thời lượng:</strong> {movieToDelete.duration} phút
                  </div>
                </div>
              </div>
              {deleteError && (
                <div className="alert alert-danger mb-3">
                  {deleteError}
                </div>
              )}
              <p className="text-muted small mb-0">
                Hành động này không thể hoàn tác. Tất cả suất chiếu, vé đặt và dữ liệu liên quan sẽ bị xóa.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={closeDeleteModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteMovie(movieToDelete)}
              >
                Xóa phim
              </button>
            </div>
          </div>
        </div>
      )}

      </AdminPanelPage>
      <ToastComponent />
    </>
  );
};

export default MovieManagement;
