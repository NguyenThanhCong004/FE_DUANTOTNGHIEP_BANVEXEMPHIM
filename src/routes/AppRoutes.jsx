import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/common/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import MovieDetail from '../pages/common/MovieDetail';
import Booking from '../pages/common/Booking';
import Checkout from '../pages/common/Checkout';
import Success from '../pages/common/Success';
import PaymentSuccess from '../pages/common/PaymentSuccess';
import PaymentCancel from '../pages/common/PaymentCancel';
import Movies from '../pages/common/Movies';
import NotFound from '../pages/common/NotFound';
import Vouchers from '../pages/common/Vouchers';
import MovieFavorite from '../pages/common/MovieFavorite';
import ForgetPassword from '../pages/auth/ForgetPassword';
import Foodorder from '../pages/common/Foodorder';
import TransactionHistory from '../pages/user/TransactionHistory';
import Profile from '../pages/user/Profile';
import PointsHistory from '../pages/user/PointsHistory';
import MembershipStatus from '../pages/user/MembershipStatus';
import MyVouchers from '../pages/user/MyVouchers';
import Events from '../pages/common/Events';
import EventDetail from '../pages/common/EventDetail';

import UserManagement from '../pages/super-admin/Users';
import EditUserSuperAdmin from '../pages/super-admin/EditUser';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import AdminLayout from '../components/layout/AdminLayout';
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import CinemaManagement from '../pages/super-admin/Cinemas';
import Employees from '../pages/super-admin/Employees';
import SuperMovies from '../pages/super-admin/Movies';
import SuperMovieTypes from '../pages/super-admin/MovieTypes';
import SuperSeatTypes from '../pages/super-admin/SeatTypes';
import SuperProductTypes from '../pages/super-admin/ProductTypes';
import SuperProducts from '../pages/super-admin/Products';
import SuperMembershipLevels from '../pages/super-admin/MembershipLevels';
import VouchersAdmin from '../pages/super-admin/Vouchers';
import NewsAdmin from '../pages/super-admin/News';
import CreateEmployee from '../pages/super-admin/CreateEmployee';
import CreateMovie from '../pages/super-admin/CreateMovie';
import CreateMovieType from '../pages/super-admin/CreateMovieType';
import CreateSeatType from '../pages/super-admin/CreateSeatType';
import CreateProductType from '../pages/super-admin/CreateProductType';
import CreateProduct from '../pages/super-admin/CreateProduct';
import CreateMembershipLevel from '../pages/super-admin/CreateMembershipLevel';
import CreateVoucher from '../pages/super-admin/CreateVoucher';
import CreateNews from '../pages/super-admin/CreateNews';
import CreateCinema from '../pages/super-admin/CreateCinema';

import UserManagementAdmin from '../pages/admin/UserManagement';
import EditUser from '../pages/admin/EditUser';
import ViewUser from '../pages/admin/ViewUser';
import StaffManagement from '../pages/admin/StaffManagement';
import ViewStaff from '../pages/admin/ViewStaff';
import PromotionManagement from '../pages/admin/PromotionManagement';
import ShowtimeManagement from '../pages/admin/ShowtimeManagement';
import ShiftManagement from '../pages/admin/ShiftManagement';
import ProductManagement from '../pages/admin/ProductManagement';
import InvoiceManagement from '../pages/admin/InvoiceManagement';
import ViewOrderOnline from '../pages/admin/ViewOrderOnline';
import AdminStaffForm from '../pages/admin/forms/AdminStaffForm';
import AdminPromotionForm from '../pages/admin/forms/AdminPromotionForm';
import AdminShiftForm from '../pages/admin/forms/AdminShiftForm';
import AdminRoomForm from '../pages/admin/forms/AdminRoomForm';
import RoomManagement from '../pages/admin/RoomManagement';
import SeatManagement from '../pages/admin/SeatManagement';
import MyShifts from '../pages/employee/MyShifts';
import AdminProfile from '../pages/admin/AdminProfile';
import SuperAdminProfile from '../pages/super-admin/SuperAdminProfile';
import EmployeeSelfServiceLayout from '../components/layout/EmployeeSelfServiceLayout';

// Guard
import RoleGuard from './guards/RoleGuard';
import StaffFloorGuard from './guards/StaffFloorGuard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/staff/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/staff"
        element={
          <StaffFloorGuard>
            <EmployeeSelfServiceLayout />
          </StaffFloorGuard>
        }
      >
        <Route index element={<Navigate to="ca-lam" replace />} />
        <Route path="ca-lam" element={<MyShifts />} />
        <Route path="*" element={<Navigate to="ca-lam" replace />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/movie/:id" element={<MovieDetail />} />
      <Route path="/booking/:id" element={<Booking />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/voucher" element={<Vouchers />} />
      <Route path="/movieFavorite" element={<MovieFavorite />} />
      <Route path="/forgetPassword" element={<ForgetPassword />} />
      <Route path="/foodorder" element={<Foodorder />} />
      <Route path="/transactionHistory" element={<TransactionHistory />} />
      <Route path="/transactions" element={<TransactionHistory />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pointsHistory" element={<PointsHistory />} />
      <Route path="/membershipStatus" element={<MembershipStatus />} />
      <Route path="/myVouchers" element={<MyVouchers />} />

      {/* Admin Route */}
      <Route
        path="/admin/*"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/add" element={<AdminStaffForm mode="add" />} />
        <Route path="staff/edit/:id" element={<AdminStaffForm mode="edit" />} />
        <Route path="staff/view/:id" element={<ViewStaff />} />
        <Route path="users" element={<UserManagementAdmin />} />
        <Route path="users/edit/:id" element={<EditUser />} />
        <Route path="users/view/:id" element={<ViewUser />} />
        <Route path="promotions" element={<PromotionManagement />} />
        <Route path="promotions/add" element={<AdminPromotionForm mode="add" />} />
        <Route path="promotions/edit/:id" element={<AdminPromotionForm mode="edit" />} />
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="shifts/add" element={<AdminShiftForm mode="add" />} />
        <Route path="shifts/edit/:id" element={<AdminShiftForm mode="edit" />} />
        <Route path="seats" element={<SeatManagement />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="showtimes" element={<ShowtimeManagement />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="rooms/add" element={<AdminRoomForm mode="add" />} />
        <Route path="rooms/edit/:id" element={<AdminRoomForm mode="edit" />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="invoices/view/:id" element={<ViewOrderOnline />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Super Admin Route */}
      <Route
        path="/super-admin/*"
        element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="cinemas" element={<CinemaManagement />} />
        <Route path="cinemas/create" element={<CreateCinema />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/create" element={<CreateEmployee />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/edit" element={<EditUserSuperAdmin />} />
        <Route path="movies" element={<SuperMovies />} />
        <Route path="movies/create" element={<CreateMovie />} />
        <Route path="movie-types" element={<SuperMovieTypes />} />
        <Route path="movie-types/create" element={<CreateMovieType />} />
        <Route path="seat-types" element={<SuperSeatTypes />} />
        <Route path="seat-types/create" element={<CreateSeatType />} />
        <Route path="product-types" element={<SuperProductTypes />} />
        <Route path="product-types/create" element={<CreateProductType />} />
        {/* Danh mục sản phẩm toàn hệ thống — tách path khỏi /admin/products (rạp) */}
        <Route path="catalog-products" element={<SuperProducts />} />
        <Route path="catalog-products/create" element={<CreateProduct />} />
        <Route path="products" element={<Navigate to="/super-admin/catalog-products" replace />} />
        <Route path="products/create" element={<Navigate to="/super-admin/catalog-products/create" replace />} />
        <Route path="membership-levels" element={<SuperMembershipLevels />} />
        <Route path="membership-levels/create" element={<CreateMembershipLevel />} />
        <Route path="vouchers" element={<VouchersAdmin />} />
        <Route path="vouchers/create" element={<CreateVoucher />} />
        <Route path="news" element={<NewsAdmin />} />
        <Route path="news/create" element={<CreateNews />} />
        
        {/* Admin-level (rạp) management - super admin kế thừa UI */}
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/add" element={<AdminStaffForm mode="add" />} />
        <Route path="staff/edit/:id" element={<AdminStaffForm mode="edit" />} />
        <Route path="staff/view/:id" element={<ViewStaff />} />
        <Route path="promotions" element={<PromotionManagement />} />
        <Route path="promotions/add" element={<AdminPromotionForm mode="add" />} />
        <Route path="promotions/edit/:id" element={<AdminPromotionForm mode="edit" />} />
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="shifts/add" element={<AdminShiftForm mode="add" />} />
        <Route path="shifts/edit/:id" element={<AdminShiftForm mode="edit" />} />
        <Route path="seats" element={<SeatManagement />} />
        <Route path="showtimes" element={<ShowtimeManagement />} />
        <Route path="store-products" element={<ProductManagement />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="rooms/add" element={<AdminRoomForm mode="add" />} />
        <Route path="rooms/edit/:id" element={<AdminRoomForm mode="edit" />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="invoices/view/:id" element={<ViewOrderOnline />} />
        <Route path="profile" element={<SuperAdminProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>


      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


export default AppRoutes;

