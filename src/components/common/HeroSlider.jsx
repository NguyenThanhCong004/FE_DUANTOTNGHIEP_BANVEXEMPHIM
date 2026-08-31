import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

const HeroSlider = ({ banners }) => {
  const slides = (Array.isArray(banners) ? banners : []).map((banner, index) => {
    if (typeof banner === "string") {
      return {
        imageUrl: banner,
        movieId: null,
        title: "Phim nổi bật",
        key: `${index}-${banner}`,
      };
    }
    return {
      imageUrl: banner?.imageUrl || banner?.url || "",
      movieId: banner?.movieId ?? null,
      title: banner?.title || "Phim nổi bật",
      key: `${index}-${banner?.movieId ?? banner?.imageUrl ?? "slide"}`,
    };
  }).filter((s) => s.imageUrl);

  return (
    <div className="w-100 shadow-lg overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop={true}
        className="mySwiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.key}>
            <div className="position-relative" style={{ background: '#0f102a' }}>
              <img src={slide.imageUrl} className="d-block w-100" style={{ objectFit: 'contain' }} alt={`Banner ${index + 1}`} />
              <div className="carousel-caption d-none d-md-block text-start pb-5">
                <h2 className="display-4 fw-black text-white text-uppercase tracking-tighter" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)', fontWeight: 900 }}>
                  {slide.title}
                </h2>
                <Link to={slide.movieId ? `/movie/${slide.movieId}` : "/movies"} className="btn btn-gradient rounded-pill px-5 py-3 fw-bold mt-3 shadow-lg">
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
