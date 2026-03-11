import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

const HeroSlider = ({ banners }) => {
  return (
    <div className="w-100 mt-5 shadow-lg overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop={true}
        className="mySwiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <div className="position-relative">
              <img src={banner} className="d-block w-100" style={{ height: '550px', objectFit: 'cover' }} alt={`Banner ${index + 1}`} />
              <div className="carousel-caption d-none d-md-block text-start pb-5">
                <h2 className="display-4 fw-black text-white text-uppercase tracking-tighter" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)', fontWeight: 900 }}>
                  Thế giới hoạt hình!
                </h2>
                <Link to="/movies" className="btn btn-gradient rounded-pill px-5 py-3 fw-bold mt-3 shadow-lg">
                  ĐẶT VÉ NGAY
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;
