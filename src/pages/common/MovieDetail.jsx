import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import MoviePoster from '../../components/common/MoviePoster';
import TrailerCard from '../../components/common/TrailerCard';
import ReviewItem from '../../components/common/ReviewItem';

const MovieDetail = () => {
  const [selectedDate, setSelectedDate] = useState(0);

  // Tạo danh sách 7 ngày tới mẫu
  const dates = [
    { day: 'Thứ 4', date: '11/03' },
    { day: 'Thứ 5', date: '12/03' },
    { day: 'Thứ 6', date: '13/03' },
    { day: 'Thứ 7', date: '14/03' },
    { day: 'Chủ Nhật', date: '15/03' },
    { day: 'Thứ 2', date: '16/03' },
    { day: 'Thứ 3', date: '17/03' },
  ];

  const showtimes = ['10:00', '13:30', '16:45', '20:15', '22:30'];

  const reviews = [
    { id: 1, user: 'Nguyễn Văn A', rating: 5, comment: 'Phim quá hay, kỹ xảo đỉnh cao!', avatar: 'https://via.placeholder.com/55' }
  ];

  const movie = {
    id: 1,
    title: 'AVENGERS: ENDGAME',
    genre: 'Hành động, Viễn tưởng',
    posterUrl: 'https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg',
    backdropUrl: 'https://wallpaperaccess.com/full/1561986.jpg',
    ageLimit: 'T13',
    status: 'Đang chiếu',
    director: 'ANTHONY RUSSO',
    country: 'MỸ',
    duration: '181 PHÚT',
    releaseDate: '26/04/2019',
    trailerUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c',
    description: 'Dàn diễn viên: Robert Downey Jr., Chris Evans, Mark Ruffalo... Phim được quay chủ yếu tại Pinewood Atlanta Studios. Đây là dự án tham vọng nhất của Marvel Studios, đánh dấu mốc kết thúc cho chặng đường hơn 10 năm của vũ trụ điện ảnh Marvel.',
    content: 'Sau những sự kiện tàn khốc của Avengers: Infinity War (2018), vũ trụ đang bị hủy hoại. Với sự giúp đỡ của các đồng minh còn lại, Avengers tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục sự cân bằng cho vũ trụ.'
  };

  return (
    <Layout>
      {/* PHẦN 1: HERO SECTION */}
      <div className="movie-hero py-5" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('${movie.backdropUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'white' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4 text-center mb-4 mb-md-0">
              <MoviePoster 
                src={movie.posterUrl} 
                alt={movie.title} 
                className="shadow-lg border border-4 border-white border-opacity-10" 
                style={{ maxWidth: '300px', margin: '0 auto' }} 
              />
            </div>
            <div className="col-md-8">
              <div className="d-flex gap-2 mb-3">
                <span className="badge bg-danger fw-bold p-2 px-3 rounded-pill shadow-sm">{movie.ageLimit} (Trên 13 tuổi)</span>
                <span className="badge bg-success fw-bold p-2 px-3 rounded-pill shadow-sm">{movie.status}</span>
              </div>
              <h1 className="display-4 fw-black mb-2 uppercase" style={{ fontWeight: 900 }}>{movie.title}</h1>
              <p className="fs-5 text-warning mb-4 fw-bold">{movie.genre}</p>
              
              <div className="d-flex align-items-center flex-wrap gap-4 mb-4 opacity-75 fw-bold small text-uppercase">
                <span><i className="fas fa-video me-2 text-danger"></i>ĐẠO DIỄN: {movie.director}</span>
                <span><i className="fas fa-globe me-2 text-danger"></i>QUỐC GIA: {movie.country}</span>
                <span><i className="fas fa-clock me-2 text-danger"></i>{movie.duration}</span>
                <span><i className="fas fa-calendar-alt me-2 text-danger"></i>KHỞI CHIẾU: {movie.releaseDate}</span>
              </div>

              {/* KHỐI MÔ TẢ PHIM */}
              <div className="bg-white bg-opacity-10 p-4 rounded-4 mb-3" style={{ backdropFilter: 'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <h5 className="fw-black text-info mb-2 text-uppercase small tracking-tighter">Mô tả phim</h5>
                <p className="mb-0 fs-6 lh-base text-white opacity-90" style={{ textAlign: 'justify' }}>{movie.description}</p>
              </div>

              {/* KHỐI NỘI DUNG PHIM */}
              <div className="bg-white bg-opacity-10 p-4 rounded-4 mb-3" style={{ backdropFilter: 'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <h5 className="fw-black text-warning mb-2 text-uppercase small tracking-tighter">Nội dung phim</h5>
                <p className="mb-0 fs-6 lh-base text-white opacity-90" style={{ textAlign: 'justify' }}>{movie.content}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-8">
            {/* PHẦN CHỌN NGÀY & SUẤT CHIẾU */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white bg-opacity-10" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="card-body p-4">
                <h4 className="fw-black text-white mb-4 d-flex align-items-center tracking-tighter">
                  <i className="fas fa-calendar-alt text-danger me-3"></i>LỊCH CHIẾU
                </h4>

                <div className="d-flex gap-2 overflow-auto pb-3 mb-4 custom-scrollbar">
                  {dates.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(index)}
                      className={`btn rounded-4 p-3 flex-shrink-0 transition-all ${selectedDate === index ? 'btn-gradient shadow' : 'bg-white bg-opacity-5 text-white border-white border-opacity-10'}`}
                      style={{ minWidth: '100px' }}
                    >
                      <div className="small opacity-75 fw-bold">{item.day}</div>
                      <div className="fs-5 fw-black">{item.date}</div>
                    </button>
                  ))}
                </div>

                <hr className="border-white border-opacity-10 mb-4" />

                <h6 className="text-warning fw-bold text-uppercase small mb-3">Suất chiếu cho ngày {dates[selectedDate].date}:</h6>
                <div className="row g-3">
                  {showtimes.map(time => (
                    <div key={time} className="col-6 col-md-3">
                      <Link to={`/booking/${movie.id}`} className="btn btn-outline-light w-100 py-3 rounded-3 shadow-sm border-white border-opacity-10 bg-white bg-opacity-5 fw-bold fs-5">
                        {time}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ĐÁNH GIÁ & BÌNH LUẬN */}
            <div className="card border-0 shadow-sm rounded-4 bg-white bg-opacity-10" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-white border-opacity-10 pb-3">
                  <h4 className="fw-black text-white mb-0 tracking-tighter"><i className="fas fa-comments text-primary me-3"></i>ĐÁNH GIÁ PHIM</h4>
                  <div className="bg-white bg-opacity-10 px-3 py-2 rounded-pill shadow-sm">
                    <span className="fw-bold text-warning fs-5">4.9</span> <i className="fas fa-star text-warning"></i>
                  </div>
                </div>

                <div className="bg-white bg-opacity-5 p-4 rounded-4 mb-5 border border-white border-opacity-10">
                  <h6 className="fw-bold mb-3 text-white"><i className="fas fa-pen-fancy me-2 text-primary"></i>Viết đánh giá của bạn</h6>
                  <div className="mb-3">
                    <textarea className="form-control bg-white bg-opacity-10 border-white border-opacity-10 text-white shadow-none p-3" rows="3" placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim..."></textarea>
                  </div>
                  <div className="text-end">
                    <button className="btn btn-gradient rounded-pill px-5 fw-bold shadow">GỬI ĐÁNH GIÁ</button>
                  </div>
                </div>

                <div className="review-list">
                  {reviews.map(review => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* TRAILER */}
            <TrailerCard trailerUrl={movie.trailerUrl} title="TRAILER PHIM" />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </Layout>
  );
};

export default MovieDetail;
