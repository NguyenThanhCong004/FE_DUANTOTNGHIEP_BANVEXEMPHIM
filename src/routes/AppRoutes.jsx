import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/common/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import MovieDetail from '../pages/common/MovieDetail';
import Booking from '../pages/common/Booking';
import Checkout from '../pages/common/Checkout';
import Success from '../pages/common/Success';
import Movies from '../pages/common/Movies';
import NotFound from '../pages/common/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/movie/:id" element={<MovieDetail />} />
      <Route path="/booking/:id" element={<Booking />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
