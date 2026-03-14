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
// Role-based pages
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import EmployeeManagement from '../pages/super-admin/Employees';
import CreateEmployee from '../pages/super-admin/CreateEmployee';
import UserManagement from '../pages/super-admin/Users';
import MovieManagement from '../pages/super-admin/Movies';
import CreateMovie from '../pages/super-admin/CreateMovie';
import MovieTypeManagement from '../pages/super-admin/MovieTypes';
import CreateMovieType from '../pages/super-admin/CreateMovieType';
import SeatTypeManagement from '../pages/super-admin/SeatTypes';
import CreateSeatType from '../pages/super-admin/CreateSeatType';
import CinemaManagement from '../pages/super-admin/Cinemas';
import CreateCinema from '../pages/super-admin/CreateCinema';
import ProductTypeManagement from '../pages/super-admin/ProductTypes';
import CreateProductType from '../pages/super-admin/CreateProductType';
import ProductManagement from '../pages/super-admin/Products';
import CreateProduct from '../pages/super-admin/CreateProduct';
import MembershipLevelManagement from '../pages/super-admin/MembershipLevels';
import CreateMembershipLevel from '../pages/super-admin/CreateMembershipLevel';
import VoucherManagement from '../pages/super-admin/Vouchers';
import CreateVoucher from '../pages/super-admin/CreateVoucher';
import NewsManagement from '../pages/super-admin/News';
import CreateNews from '../pages/super-admin/CreateNews';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import StaffManagement from '../pages/admin/StaffManagement';
import AddStaff from '../pages/admin/AddStaff';
import EditStaff from '../pages/admin/EditStaff';
import ViewStaff from '../pages/admin/ViewStaff';
import UserManagementAdmin from '../pages/admin/UserManagement';
import EditUser from '../pages/admin/EditUser';
import ViewUser from '../pages/admin/ViewUser';
import PromotionManagement from '../pages/admin/PromotionManagement';
import AddPromotion from '../pages/admin/AddPromotion';
import EditPromotion from '../pages/admin/EditPromotion';
import ShiftManagement from '../pages/admin/ShiftManagement';
import AddShift from '../pages/admin/AddShift';
import EditShift from '../pages/admin/EditShift';
import SeatManagement from '../pages/admin/SeatManagement';
import ProductManagementAdmin from '../pages/admin/ProductManagement';
import ShowtimeManagement from '../pages/admin/ShowtimeManagement';
import AddShowtime from '../pages/admin/AddShowtime';
import EditShowtime from '../pages/admin/EditShowtime';
import RoomManagement from '../pages/admin/RoomManagement';
import AddRoom from '../pages/admin/AddRoom';
import EditRoom from '../pages/admin/EditRoom';
import InvoiceManagement from '../pages/admin/InvoiceManagement';
import AdminProfile from '../pages/admin/Profile';

// Guard
import RoleGuard from './guards/RoleGuard';

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

      {/* Admin Route */}
      <Route
        path="/admin/*"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/add" element={<AddStaff />} />
        <Route path="staff/edit/:id" element={<EditStaff />} />
        <Route path="staff/view/:id" element={<ViewStaff />} />
        <Route path="users" element={<UserManagementAdmin />} />
        <Route path="users/edit/:id" element={<EditUser />} />
        <Route path="users/view/:id" element={<ViewUser />} />
        <Route path="promotions" element={<PromotionManagement />} />
        <Route path="promotions/add" element={<AddPromotion />} />
        <Route path="promotions/edit/:id" element={<EditPromotion />} />
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="shifts/add" element={<AddShift />} />
        <Route path="shifts/edit/:id" element={<EditShift />} />
        <Route path="seats" element={<SeatManagement />} />
        <Route path="products" element={<ProductManagementAdmin />} />
        <Route path="showtimes" element={<ShowtimeManagement />} />
        <Route path="showtimes/add" element={<AddShowtime />} />
        <Route path="showtimes/edit/:id" element={<EditShowtime />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="rooms/add" element={<AddRoom />} />
        <Route path="rooms/edit/:id" element={<EditRoom />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Super Admin Route */}
      <Route
        path="/super-admin/*"
        element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout>
              <Routes>
                <Route path="/" element={<SuperAdminDashboard />} />
                <Route path="/employees" element={<EmployeeManagement />} />
                <Route path="/employees/create" element={<CreateEmployee />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/movies" element={<MovieManagement />} />
                <Route path="/movies/create" element={<CreateMovie />} />
                <Route path="/movie-types" element={<MovieTypeManagement />} />
                <Route path="/movie-types/create" element={<CreateMovieType />} />
                <Route path="/seat-types" element={<SeatTypeManagement />} />
                <Route path="/seat-types/create" element={<CreateSeatType />} />
                <Route path="/cinemas" element={<CinemaManagement />} />
                <Route path="/cinemas/create" element={<CreateCinema />} />
                <Route path="/product-types" element={<ProductTypeManagement />} />
                <Route path="/product-types/create" element={<CreateProductType />} />
                <Route path="/products" element={<ProductManagement />} />
                <Route path="/products/create" element={<CreateProduct />} />
                <Route path="/membership-levels" element={<MembershipLevelManagement />} />
                <Route path="/membership-levels/create" element={<CreateMembershipLevel />} />
                <Route path="/vouchers" element={<VoucherManagement />} />
                <Route path="/vouchers/create" element={<CreateVoucher />} />
                <Route path="/news" element={<NewsManagement />} />
                <Route path="/news/create" element={<CreateNews />} />
                {/* Các route con khác của admin sẽ thêm ở đây sau */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SuperAdminLayout>
          </RoleGuard>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


export default AppRoutes;
