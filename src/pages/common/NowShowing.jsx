import React from 'react';
import Layout from '../../components/layout/Layout';
import MovieCard from '../../components/common/MovieCard';
import SectionHeader from '../../components/common/SectionHeader';

const NowShowing = () => {
  const movies = [
    { id: 1, title: 'MAI', genre: 'Tâm lý, Tình cảm', posterUrl: 'https://cdn-media.sforum.vn/storage/app/media/CTVSEO_Maihue/Phim%20chi%E1%BA%BFu%20r%E1%BA%A1p/phim-chieu-rap-3.jpg', ageLimit: 'T18' },
    { id: 2, title: 'KUNG FU PANDA 4', genre: 'Hoạt hình', posterUrl: 'https://aeonmall-review-rikkei.cdn.vccloud.vn/public/wp/21/news/eYMabpzR2xAghCdee11Fb1PRg2wSbzaG1tNZ0xfa.jpg', ageLimit: 'P' },
    { id: 3, title: 'AVENGERS', genre: 'Hành động', posterUrl: 'https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg', ageLimit: 'T13' },
    { id: 4, title: 'DUNE 2', genre: 'Viễn tưởng', posterUrl: 'https://wallpaperaccess.com/full/1561986.jpg', ageLimit: 'T13' }
  ];

  return (
    <Layout>
      <div className="container py-5">
        <SectionHeader 
          title="Phim Đang Chiếu" 
          gradient="var(--primary-gradient)" 
          centered={true}
        />
        <div className="row g-4">
          {movies.map(movie => (
            <div key={movie.id} className="col-6 col-md-3">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NowShowing;
