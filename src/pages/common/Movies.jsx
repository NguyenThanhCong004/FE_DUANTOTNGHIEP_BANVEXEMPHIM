import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import MovieCard from '../../components/common/MovieCard';

const Movies = () => {
  const [filter, setFilter] = useState({ keyword: '', genre: '', status: 'all' });

  const allMovies = [
    { id: 1, title: 'MAI', genre: 'Tâm lý', posterUrl: 'https://cdn-media.sforum.vn/storage/app/media/CTVSEO_Maihue/Phim%20chi%E1%BA%BFu%20r%E1%BA%A1p/phim-chieu-rap-3.jpg', ageLimit: 'T18', type: 'now' },
    { id: 2, title: 'KUNG FU PANDA 4', genre: 'Hoạt hình', posterUrl: 'https://aeonmall-review-rikkei.cdn.vccloud.vn/public/wp/21/news/eYMabpzR2xAghCdee11Fb1PRg2wSbzaG1tNZ0xfa.jpg', ageLimit: 'P', type: 'now' },
    { id: 3, title: 'AVENGERS', genre: 'Hành động', posterUrl: 'https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg', ageLimit: 'T13', type: 'now' },
    { id: 4, title: 'DUNE 2', genre: 'Viễn tưởng', posterUrl: 'https://wallpaperaccess.com/full/1561986.jpg', ageLimit: 'T13', type: 'now' },
    { id: 5, title: 'MINIONS: RISE OF GRU', genre: 'Hoạt hình', posterUrl: 'https://images.moviesanywhere.com/568f6962451515cfb2628469850543f8/2753066a-20e8-4228-a37a-569b0f69903c.jpg', ageLimit: 'P', releaseDate: '20/07/2026', type: 'soon' },
    { id: 6, title: 'SPIDER-MAN', genre: 'Hành động', posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg', ageLimit: 'T13', releaseDate: '15/08/2026', type: 'soon' }
  ];

  const filteredMovies = allMovies.filter(movie => {
    const matchKeyword = movie.title.toLowerCase().includes(filter.keyword.toLowerCase());
    const matchGenre = filter.genre === '' || movie.genre === filter.genre;
    const matchStatus = filter.status === 'all' || movie.type === filter.status;
    return matchKeyword && matchGenre && matchStatus;
  });

  return (
    <Layout>
      <div className="container py-5 mt-5">
        <div className="row mb-5 align-items-end g-3">
          <div className="col-lg-4">
            <h2 className="fw-black text-white text-uppercase tracking-tighter m-0 display-5" style={{ fontWeight: 900 }}>Danh Sách Phim</h2>
            <div style={{ height: '6px', width: '80px', background: 'var(--primary-gradient)', borderRadius: '10px' }}></div>
          </div>
          
          <div className="col-lg-8">
            <div className="card p-3 border-0 shadow-sm bg-white bg-opacity-10 rounded-4" style={{ backdropFilter: 'blur(20px)' }}>
              <div className="row g-2">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white bg-opacity-10 border-0 ps-3 text-white opacity-50"><i className="fas fa-search"></i></span>
                    <input 
                      type="text" 
                      className="form-control bg-white bg-opacity-10 border-0 py-2 shadow-none text-white" 
                      placeholder="Tìm tên phim..." 
                      onChange={(e) => setFilter({...filter, keyword: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select className="form-select bg-white bg-opacity-10 border-0 py-2 shadow-none text-white" onChange={(e) => setFilter({...filter, genre: e.target.value})}>
                    <option value="">Tất cả thể loại</option>
                    <option value="Hành động">Hành động</option>
                    <option value="Hoạt hình">Hoạt hình</option>
                    <option value="Tâm lý">Tâm lý</option>
                    <option value="Viễn tưởng">Viễn tưởng</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="btn-group w-100 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                    <button className={`btn btn-sm ${filter.status === 'all' ? 'btn-danger' : 'btn-outline-light border-opacity-25'}`} onClick={() => setFilter({...filter, status: 'all'})}>Tất cả</button>
                    <button className={`btn btn-sm ${filter.status === 'now' ? 'btn-danger' : 'btn-outline-light border-opacity-25'}`} onClick={() => setFilter({...filter, status: 'now'})}>Đang chiếu</button>
                    <button className={`btn btn-sm ${filter.status === 'soon' ? 'btn-danger' : 'btn-outline-light border-opacity-25'}`} onClick={() => setFilter({...filter, status: 'soon'})}>Sắp chiếu</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredMovies.length > 0 ? (
          <div className="row g-4">
            {filteredMovies.map(movie => (
              <div key={movie.id} className="col-6 col-md-3">
                <MovieCard movie={movie} isComingSoon={movie.type === 'soon'} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="fas fa-search fa-4x text-white opacity-10 mb-3"></i>
            <h4 className="text-white opacity-50">Không tìm thấy phim phù hợp!</h4>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Movies;
