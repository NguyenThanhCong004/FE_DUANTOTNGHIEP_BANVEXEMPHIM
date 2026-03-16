import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ComboCard from './ComboCard';

// Dùng trên trang Home (không có giỏ hàng)
// Dùng trên trang FoodOrder: truyền thêm cart, onAdd, onRemove
const ComboSwiper = ({ combos, cart = {}, onAdd, onRemove }) => {
  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={20}
      slidesPerView={1}
      slidesPerGroup={1}
      loop={combos.length > 5}
      breakpoints={{
        480: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
        1280: { slidesPerView: 5 },
      }}
      className="movieSwiper p-3"
    >
      {combos.map(combo => (
        <SwiperSlide key={combo.id} style={{ height: 'auto' }}>
          <ComboCard
            combo={combo}
            qty={cart[combo.id] || 0}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ComboSwiper;