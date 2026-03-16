import React from 'react';
import Layout from '../../components/layout/Layout';
import MovieSwiper from '../../components/common/MovieSwiper';
import HeroSlider from '../../components/common/HeroSlider';
import SectionHeader from '../../components/common/SectionHeader';
import ComboSwiper from '../../components/common/ComboSwiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Home = () => {
  const banners = [
    "https://cdn-media.sforum.vn/storage/app/media/CTVSEO_Maihue/Phim%20chi%E1%BA%BFu%20r%E1%BA%A1p/phim-chieu-rap-3.jpg",
    "https://aeonmall-review-rikkei.cdn.vccloud.vn/public/wp/21/news/eYMabpzR2xAghCdee11Fb1PRg2wSbzaG1tNZ0xfa.jpg",
    "https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg",
    "https://image.tmdb.org/t/p/original/xJH0Y59696SbaZ9OCv999I9D6S3.jpg",
    "https://image.tmdb.org/t/p/original/fqv8vS49EYuN6U8XjtDslSfkUvP.jpg",
    "https://image.tmdb.org/t/p/original/stKGOm7Uyhuat5J6UFJWvL2u6vW.jpg",
    "https://image.tmdb.org/t/p/original/dv9Ay9ZCc9Z0Of9UK0vswZba6sn.jpg"
  ];

  const nowShowing = [
    { id: 1, title: 'MAI', genre: 'Tâm lý', posterUrl: 'https://cdn-media.sforum.vn/storage/app/media/CTVSEO_Maihue/Phim%20chi%E1%BA%BFu%20r%E1%BA%A1p/phim-chieu-rap-3.jpg', ageLimit: 'T18' },
    { id: 2, title: 'KUNG FU PANDA 4', genre: 'Hoạt hình', posterUrl: 'https://aeonmall-review-rikkei.cdn.vccloud.vn/public/wp/21/news/eYMabpzR2xAghCdee11Fb1PRg2wSbzaG1tNZ0xfa.jpg', ageLimit: 'P' },
    { id: 3, title: 'AVENGERS', genre: 'Hành động', posterUrl: 'https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg', ageLimit: 'T13' },
    { id: 4, title: 'DUNE 2', genre: 'Viễn tưởng', posterUrl: 'https://wallpaperaccess.com/full/1561986.jpg', ageLimit: 'T13' },
    { id: 7, title: 'INSIDE OUT 2', genre: 'Hoạt hình', posterUrl: 'https://image.tmdb.org/t/p/original/vpn99tmSnuS8pS9S7S0CHp9vJbs.jpg', ageLimit: 'P' },
    { id: 8, title: 'DESPICABLE ME 4', genre: 'Hoạt hình', posterUrl: 'https://image.tmdb.org/t/p/original/wWba3eoJaME867YvUtdS99Z9ZCc.jpg', ageLimit: 'P' }
  ];

  const comingSoon = [
    { id: 5, title: 'MINIONS: RISE OF GRU', genre: 'Hoạt hình', posterUrl: 'https://images.moviesanywhere.com/568f6962451515cfb2628469850543f8/2753066a-20e8-4228-a37a-569b0f69903c.jpg', ageLimit: 'P', releaseDate: '20/07/2026' },
    { id: 6, title: 'SPIDER-MAN', genre: 'Hành động', posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg', ageLimit: 'T13', releaseDate: '15/08/2026' },
    { id: 9, title: 'MOANA 2', genre: 'Hoạt hình', posterUrl: 'https://image.tmdb.org/t/p/original/7S9vgZ6Zid7vAnv7shba6Z0itvS.jpg', ageLimit: 'P', releaseDate: '27/11/2026' },
    { id: 10, title: 'SHREK 5', genre: 'Hoạt hình', posterUrl: 'https://image.tmdb.org/t/p/original/pB8lsz9vU92oxY360EEo9o1Z6rn.jpg', ageLimit: 'P', releaseDate: '01/07/2026' }
  ];

  const combos = [
    { id: 1, name: "Combo Hoạt Hình", price: 85000, desc: "1 Bắp lớn + 1 Nước", img: "https://cdn-icons-png.flaticon.com/512/5787/5787016.png" },
    { id: 2, name: "Combo Đôi Bạn", price: 125000, desc: "1 Bắp lớn + 2 Nước", img: "https://cdn-icons-png.flaticon.com/512/5787/5787016.png" },
    { id: 3, name: "Combo Gia Đình", price: 195000, desc: "2 Bắp lớn + 4 Nước", img: "https://cdn-icons-png.flaticon.com/512/5787/5787016.png" },
    { id: 4, name: "Bắp Rang Phô Mai", price: 55000, desc: "V vị phô mai đặc biệt", img: "https://cdn-icons-png.flaticon.com/512/5787/5787016.png" },
    { id: 5, name: "Nước Ngọt Khổng Lồ", price: 35000, desc: "Size 1000ml cực đã", img: "https://cdn-icons-png.flaticon.com/512/5787/5787016.png" }
  ];

  return (
    <Layout>
      <HeroSlider banners={banners} />

      <div className="container my-5 pt-3">
        {/* PHIM ĐANG CHIẾU */}
        <SectionHeader 
          title="Phim Đang Chiếu" 
          gradient="var(--primary-gradient)" 
          linkText="Tất cả" 
          linkTo="/movies" 
          icon="fas fa-arrow-right"
          linkColorClass="text-danger"
        />
        <MovieSwiper movies={nowShowing} />

        {/* PHIM SẮP CHIẾU */}
        <div className="mt-5 pt-4">
          <SectionHeader 
            title="Phim Sắp Chiếu" 
            gradient="var(--secondary-gradient)" 
            linkText="Xem lịch" 
            linkTo="/movies" 
            icon="fas fa-calendar"
            linkColorClass="text-primary"
          />
        </div>
        <MovieSwiper movies={comingSoon} isComingSoon={true} />

        {/* COMBO BẮP NƯỚC */}
        <div className="mt-5 pt-4">
          <SectionHeader 
            title="Combo Bắp Nước" 
            gradient="linear-gradient(45deg, #FFD700, #FFA500)" 
            linkText="Thực đơn" 
            linkTo="/foodorder" 
            icon="fas fa-popcorn"
            linkColorClass="text-warning"
          />
        </div>
        <ComboSwiper combos={combos} />
      </div>

      <style>{`
        .swiper-button-next, .swiper-button-prev {
          color: white !important;
          background: rgba(0,0,0,0.3);
          width: 45px; height: 45px; border-radius: 50%;
          transition: all 0.3s ease;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover { background: var(--primary-gradient); transform: scale(1.1); }
        .swiper-button-next:after, .swiper-button-prev:after { font-size: 18px !important; font-weight: bold; }
        .movieSwiper { padding-bottom: 50px !important; }
      `}</style>
    </Layout>
  );
};

export default Home;
