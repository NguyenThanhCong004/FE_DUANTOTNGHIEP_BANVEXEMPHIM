import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MovieManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  // Dữ liệu ảo (Mock Data) cho phim
  const allMovies = [
    { 
      id: 1, 
      title: 'Lật Mặt 7: Một Điều Ước', 
      duration: 138, 
      author: 'Lý Hải', 
      nation: 'Việt Nam', 
      release_date: '2024-04-26', 
      age_limit: 'T13', 
      poster: 'https://image.tmdb.org/t/p/w500/zS88IAsS6LwWb62kCH4pW17q2z.jpg',
      banner: 'https://image.tmdb.org/t/p/original/zS88IAsS6LwWb62kCH4pW17q2z.jpg',
      base_price: 85000,
      status: 'Active',
      genre: 'Gia đình, Tâm lý',
      description: 'Câu chuyện về tình mẫu tử thiêng liêng...',
      describe: 'Nội dung chi tiết về hành trình của bà Hai và 5 người con...'
    },
    { 
      id: 2, 
      title: 'Dune: Hành Tinh Cát - Phần 2', 
      duration: 166, 
      author: 'Denis Villeneuve', 
      nation: 'Mỹ', 
      release_date: '2024-03-01', 
      age_limit: 'T16', 
      poster: 'https://image.tmdb.org/t/p/w500/8bFL3K3uBs40S0V2mG2vO1mO9S6.jpg',
      banner: 'https://image.tmdb.org/t/p/original/8bFL3K3uBs40S0V2mG2vO1mO9S6.jpg',
      base_price: 95000,
      status: 'Active',
      genre: 'Hành động, Khoa học viễn tưởng',
      description: 'Paul Atreides gia nhập đội quân Chani...',
      describe: 'Cuộc chiến giành lại hành tinh Arrakis...'
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: i + 3,
      title: `Phim mẫu ${i + 3}`,
      duration: 120,
      author: 'Đạo diễn A',
      nation: 'Hàn Quốc',
      release_date: '2024-05-20',
      age_limit: 'P',
      poster: 'https://via.placeholder.com/150x225',
      banner: 'https://via.placeholder.com/1200x450',
      base_price: 75000,
      status: i % 3 === 0 ? 'Inactive' : 'Active',
      genre: 'Hành động',
      description: 'Mô tả ngắn gọn...',
      describe: 'Mô tả chi tiết phim...'
    }))
  ];

  // Logic lọc và tìm kiếm
  const filteredMovies = allMovies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="movie-management p-4">
      <style>{`
        .table-container {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

        .new-search-container {
          position: relative;
          max-width: 500px;
          margin-bottom: 30px;
        }

        .new-search-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px 10px 50px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
        }

        .new-search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: black !important;
          font-size: 1.3rem;
        }

        .movie-poster-mini {
          width: 50px;
          height: 70px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .status-active { color: #28a745; font-weight: bold; }
        .status-inactive { color: #dc3545; font-weight: bold; }

        .btn-add {
          background: blue;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
        }
        .btn-add:hover {
          background: black;
          color: white;
        }

        .age-badge {
          background: #f8f9fa;
          border: 1px solid #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0">Quản lý phim</h2>

        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/movies/create')}
        >
          <i className="bi bi-plus-circle me-2 fs-5"></i>
          Thêm phim mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo tên phim, đạo diễn..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3">Phim</th>
                <th className="py-3 text-center">Thời lượng</th>
                <th className="py-3">Quốc gia</th>
                <th className="py-3">Ngày khởi chiếu</th>
                <th className="py-3 text-end">Giá cơ bản</th>
                <th className="py-3 text-center">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((movie) => (
                <tr key={movie.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img src={movie.poster} alt={movie.title} className="movie-poster-mini" />
                      <div>
                        <div className="fw-bold">{movie.title}</div>
                        <div className="small text-muted">Đạo diễn: {movie.author}</div>
                        <span className="age-badge">{movie.age_limit}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{movie.duration} phút</td>
                  <td>{movie.nation}</td>
                  <td>{new Date(movie.release_date).toLocaleDateString('vi-VN')}</td>
                  <td className="text-end fw-bold text-primary">
                    {movie.base_price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="text-center">
                    <span className={movie.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {movie.status === 'Active' ? 'Đang chiếu' : 'Ngưng chiếu'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-ce
                    nter gap-2">
                      <button className="btn btn-sm btn-outline-dark" title="Chi tiết">
                        Xem
                      </button>
                      <button className="btn btn-sm btn-outline-primary" title="Sửa">
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang đồng bộ */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">Tổng cộng: {filteredMovies.length} phim</div>
          <nav>
            <ul className="pagination mb-0 gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1} className="page-item">
                  <button 
                    className="page-link fw-bold" 
                    style={
                      currentPage === i + 1 
                        ? { backgroundColor: 'black', color: 'white', border: '2px solid black', borderRadius: '8px' } 
                        : { backgroundColor: 'white', color: 'black', border: '2px solid black', borderRadius: '8px' }
                    }
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MovieManagement;
