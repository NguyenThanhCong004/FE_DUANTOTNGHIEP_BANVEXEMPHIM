import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import MovieCard from './MovieCard';

const MovieSwiper = ({ movies, isComingSoon = false }) => {
  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={25}
      slidesPerView={1}
      slidesPerGroup={1}
      loop={true}
      breakpoints={{
        640: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
      }}
      className="movieSwiper p-3"
    >
      {movies.map(movie => (
        <SwiperSlide key={movie.id}>
          <MovieCard movie={movie} isComingSoon={isComingSoon} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MovieSwiper;
