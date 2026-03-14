import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewsManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  // Dữ liệu mẫu cho Tin tức
  const [newsList] = useState([
    { 
      id: 1, 
      title: 'Khai trương cụm rạp mới tại Quận 7', 
      content: 'Chào mừng cụm rạp thứ 10 đi vào hoạt động với nhiều ưu đãi...', 
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&auto=format&fit=crop', 
      date: '2024-03-10',
      status: 'Active' 
    },
    { 
      id: 2, 
      title: 'Bom tấn Lật Mặt 7 chính thức mở bán vé sớm', 
      content: 'Nhanh tay đặt vé để nhận ngay combo quà tặng giới hạn...', 
      image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200&auto=format&fit=crop', 
      date: '2024-03-12',
      status: 'Active' 
    },
    { 
      id: 3, 
      title: 'Thông báo bảo trì hệ thống thanh toán ngày 15/03', 
      content: 'Hệ thống sẽ tạm ngưng giao dịch từ 0h00 đến 04h00...', 
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200&auto=format&fit=crop', 
      date: '2024-03-14',
      status: 'Inactive' 
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: i + 4,
      title: `Tin tức sự kiện mẫu số ${i + 4}`,
      content: 'Nội dung tóm tắt của bản tin sự kiện mẫu...',
      image: 'https://via.placeholder.com/100x60',
      date: '2024-03-01',
      status: i % 3 === 0 ? 'Inactive' : 'Active'
    }))
  ]);

  // Logic lọc
  const filteredNews = newsList.filter(news => 
    news.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="news-management p-4">
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
          pointer-events: none;
        }

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

        .news-img-mini {
          width: 100px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .status-active { color: #2e7d32; background: #e8f5e9; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }
        .status-inactive { color: #c62828; background: #ffebee; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; }

        .pagination-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 2px solid black;
          background: white;
          color: black;
          font-weight: bold;
        }

        .pagination-btn.active {
          background: black;
          color: white;
        }

        .table tbody td {
          color: black !important;
          padding: 15px 20px;
        }

        .news-title-text {
          color: black !important;
          font-weight: 700 !important;
          font-size: 1rem;
          margin-bottom: 4px;
          display: block;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Quản lý Tin tức</h2>
        </div>
        <button 
          className="btn btn-add d-flex align-items-center"
          onClick={() => navigate('/super-admin/news/create')}
        >
          <i className="bi bi-newspaper me-2 fs-5"></i>
          Viết tin mới
        </button>
      </div>

      <div className="table-container">
        <div className="new-search-container">
          <i className="bi bi-search new-search-icon"></i>
          <input 
            type="text" 
            className="new-search-input"
            placeholder="Tìm theo tiêu đề tin tức..."
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
                <th className="py-3 text-center" style={{ width: '80px' }}>STT</th>
                <th className="py-3">Hình ảnh</th>
                <th className="py-3">Tiêu đề bài viết</th>
                <th className="py-3">Ngày đăng</th>
                <th className="py-3 text-center">Trạng thái</th>
                <th className="py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((news, index) => (
                <tr key={news.id}>
                  <td className="text-center fw-bold">{indexOfFirstItem + index + 1}</td>
                  <td>
                    <img src={news.image} alt={news.title} className="news-img-mini" />
                  </td>
                  <td>
                    <span className="news-title-text">{news.title}</span>
                  </td>
                  <td className="text-muted small">{new Date(news.date).toLocaleDateString('vi-VN')}</td>
                  <td className="text-center">
                    <span className={news.status === 'Active' ? 'status-active' : 'status-inactive'}>
                      {news.status === 'Active' ? 'Công khai' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-outline-dark" title="Sửa">
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 px-2">
          <div className="text-muted small">
            Tổng cộng: <b>{filteredNews.length}</b> bài viết
          </div>
          <div className="d-flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
