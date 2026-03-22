import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin-design-system.css';
import { apiFetch } from '../../utils/apiClient';
import { MOVIES } from '../../constants/apiEndpoints';

const PLACEHOLDER_POSTER = 'https://placehold.co/120x180?text=Poster';

const MovieManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 8;

  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
          arr.map((m) => ({
            id: m.id,
            title: m.title ?? '',
            author: m.author ?? '—',
            nation: m.nation ?? '—',
            duration: m.duration ?? 0,
            release_date: m.releaseDate ?? '',
            base_price: m.basePrice ?? 0,
            status: m.status === 1 ? 'Active' : 'Inactive',
            age_limit: m.ageLimit != null ? `${m.ageLimit}+` : '—',
            genre: m.genre ?? '—',
            description: m.description ?? '',
            describe: m.content ?? '',
            poster: m.posterUrl || PLACEHOLDER_POSTER,
            banner: m.banner || m.posterUrl || PLACEHOLDER_POSTER,
            genre_id: '',
          }))
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

  // Logic lọc và tìm kiếm
  const filteredMovies = allMovies.filter(movie => 
    String(movie.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(movie.author || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-page movie-management admin-fade-in">
      {/* Header */}
      <div className="admin-action-bar">
        <h2 className="admin-section-title m-0">
          <i className="bi bi-film"></i>
          Quản lý phim
        </h2>
        <button 
          className="admin-btn admin-btn-success"
          onClick={() => navigate('/super-admin/movies/create')}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Thêm phim mới
        </button>
      </div>

      {/* Table Container */}
      <div className="admin-table-container">
        {/* Search Bar */}
        <div className="admin-search-wrapper mb-4" style={{ maxWidth: '400px' }}>
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
                        <span className={`admin-badge ${movie.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {movie.status === 'Active' ? 'Đang chiếu' : 'Ngưng chiếu'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-outline me-2"
                          onClick={() => {
                            setSelectedItem(movie);
                            setShowModal(true);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                          Xem
                        </button>
                        <button 
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          onClick={() => navigate('/super-admin/movies/create', { state: { editData: movie } })}
                        >
                          <i className="bi bi-pencil"></i>
                          Sửa
                        </button>
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
                        <span className={`ms-2 admin-badge ${selectedItem.status === 'Active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {selectedItem.status === 'Active' ? 'Đang chiếu' : 'Ngưng chiếu'}
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
    </div>
  );
};

export default MovieManagement;
