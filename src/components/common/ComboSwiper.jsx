import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ComboCard from './ComboCard';

const ComboSwiper = ({ combos }) => {
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
        1024: { slidesPerView: 5 },
      }}
      className="movieSwiper p-3"
    >
      {combos.map(combo => (
        <SwiperSlide key={combo.id}>
          <ComboCard combo={combo} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ComboSwiper;
