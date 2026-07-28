import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Guards (Keep these as static imports since they are wrapper components needed immediately)
import RoleGuard from './guards/RoleGuard';
import StaffFloorGuard from './guards/StaffFloorGuard';

// --- Lazy Loaded Layouts ---
const SuperAdminLayout = lazy(() => import('../components/layout/SuperAdminLayout'));
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));
const EmployeeSelfServiceLayout = lazy(() => import('../components/layout/EmployeeSelfServiceLayout'));

// --- Lazy Loaded Common Pages ---
const Home = lazy(() => import('../pages/common/Home'));
const MovieDetail = lazy(() => import('../pages/common/MovieDetail'));
const Booking = lazy(() => import('../pages/common/Booking'));
const Checkout = lazy(() => import('../pages/common/Checkout'));
const Success = lazy(() => import('../pages/common/Success'));
const PaymentSuccess = lazy(() => import('../pages/common/PaymentSuccess'));
const PaymentCancel = lazy(() => import('../pages/common/PaymentCancel'));
const Movies = lazy(() => import('../pages/common/Movies'));
const NotFound = lazy(() => import('../pages/common/NotFound'));
const Vouchers = lazy(() => import('../pages/common/Vouchers'));
const MovieFavorite = lazy(() => import('../pages/common/MovieFavorite'));
const Foodorder = lazy(() => import('../pages/common/Foodorder'));
const Events = lazy(() => import('../pages/common/Events'));
const EventDetail = lazy(() => import('../pages/common/EventDetail'));

// --- Lazy Loaded Auth Pages ---
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgetPassword = lazy(() => import('../pages/auth/ForgetPassword'));

// --- Lazy Loaded User Pages ---
const Profile = lazy(() => import('../pages/user/Profile'));

// --- Lazy Loaded Super Admin Pages ---
const SuperAdminDashboard = lazy(() => import('../pages/super-admin/Dashboard'));
const UserManagement = lazy(() => import('../pages/super-admin/Users'));
const EditUserSuperAdmin = lazy(() => import('../pages/super-admin/EditUser'));
const CinemaManagement = lazy(() => import('../pages/super-admin/Cinemas'));
const SystemStaffManagement = lazy(() => import('../pages/super-admin/SystemStaffManagement'));
const CreateSystemStaff = lazy(() => import('../pages/super-admin/CreateSystemStaff'));
const SuperMovies = lazy(() => import('../pages/super-admin/Movies'));
const SuperMovieTypes = lazy(() => import('../pages/super-admin/MovieTypes'));
const SuperSeatTypes = lazy(() => import('../pages/super-admin/SeatTypes'));
const SuperProductTypes = lazy(() => import('../pages/super-admin/ProductTypes'));
const SuperProducts = lazy(() => import('../pages/super-admin/Products'));
const SuperMembershipLevels = lazy(() => import('../pages/super-admin/MembershipLevels'));
const VouchersAdmin = lazy(() => import('../pages/super-admin/Vouchers'));
const NewsAdmin = lazy(() => import('../pages/super-admin/News'));
const CreateMovie = lazy(() => import('../pages/super-admin/CreateMovie'));
const CreateMovieType = lazy(() => import('../pages/super-admin/CreateMovieType'));
const CreateSeatType = lazy(() => import('../pages/super-admin/CreateSeatType'));
const CreateProductType = lazy(() => import('../pages/super-admin/CreateProductType'));
const CreateProduct = lazy(() => import('../pages/super-admin/CreateProduct'));
const CreateMembershipLevel = lazy(() => import('../pages/super-admin/CreateMembershipLevel'));
const CreateVoucher = lazy(() => import('../pages/super-admin/CreateVoucher'));
const CreateNews = lazy(() => import('../pages/super-admin/CreateNews'));
const CreateCinema = lazy(() => import('../pages/super-admin/CreateCinema'));
const SuperAdminProfile = lazy(() => import('../pages/super-admin/SuperAdminProfile'));
const GlobalInvoiceManagement = lazy(() => import('../pages/super-admin/InvoiceManagement'));

// --- Lazy Loaded Admin Pages ---
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const UserManagementAdmin = lazy(() => import('../pages/admin/UserManagement'));
const EditUser = lazy(() => import('../pages/admin/EditUser'));
const StaffManagement = lazy(() => import('../pages/admin/StaffManagement'));
const PromotionManagement = lazy(() => import('../pages/admin/PromotionManagement'));
const ShowtimeManagement = lazy(() => import('../pages/admin/ShowtimeManagement'));
const ShiftManagement = lazy(() => import('../pages/admin/ShiftManagement'));
const ProductManagement = lazy(() => import('../pages/admin/ProductManagement'));
const InvoiceManagement = lazy(() => import('../pages/admin/InvoiceManagement'));
const AdminStaffForm = lazy(() => import('../pages/admin/forms/AdminStaffForm'));
const AdminPromotionForm = lazy(() => import('../pages/admin/forms/AdminPromotionForm'));
const AdminShiftForm = lazy(() => import('../pages/admin/forms/AdminShiftForm'));
const AdminRoomForm = lazy(() => import('../pages/admin/forms/AdminRoomForm'));
const RoomManagement = lazy(() => import('../pages/admin/RoomManagement'));
const SeatManagement = lazy(() => import('../pages/admin/SeatManagement'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));

// --- Lazy Loaded Employee Pages ---
const MyShifts = lazy(() => import('../pages/employee/MyShifts'));
const EmployeeDashboard = lazy(() => import('../pages/employee/Dashboard'));
const Sales = lazy(() => import('../pages/employee/Sales'));
const EmployeeProfile = lazy(() => import('../pages/employee/Profile'));


const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="text-center py-5">Đang tải dữ liệu...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff/login" element={<Login mode="staff" />} />
        <Route path="/staff/forgetPassword" element={<ForgetPassword mode="staff" />} />
        
        {/* Employee Floor Route */}
        <Route
          path="/staff"
          element={
            <StaffFloorGuard>
              <EmployeeSelfServiceLayout />
            </StaffFloorGuard>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="shifts" element={<MyShifts />} />
          <Route path="ca-lam" element={<Navigate to="/staff/shifts" replace />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
        </Route>
        
        {/* General Public & User Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/voucher" element={<Vouchers />} />
        <Route path="/favorites" element={<MovieFavorite />} />
        <Route path="/movieFavorite" element={<Navigate to="/favorites" replace />} />
        <Route path="/forgetPassword" element={<ForgetPassword />} />
        <Route path="/foodorder" element={<Foodorder />} />
        <Route path="/transactionHistory" element={<Navigate to="/profile?tab=transactions" replace />} />
        <Route path="/transactions" element={<Navigate to="/profile?tab=transactions" replace />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/add" element={<AdminStaffForm mode="add" />} />
          <Route path="staff/edit/:id" element={<AdminStaffForm mode="edit" />} />
          <Route path="users" element={<UserManagementAdmin />} />
          <Route path="users/edit/:id" element={<EditUser />} />
          <Route path="promotions" element={<PromotionManagement />} />
          <Route path="promotions/add" element={<AdminPromotionForm mode="add" />} />
          <Route path="promotions/edit/:id" element={<AdminPromotionForm mode="edit" />} />
          <Route path="shifts" element={<ShiftManagement />} />
          <Route path="shifts/add" element={<AdminShiftForm mode="add" />} />
          <Route path="shifts/edit/:id" element={<AdminShiftForm mode="edit" />} />
          <Route path="seats" element={<SeatManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="vouchers" element={<VouchersAdmin />} />
          <Route path="vouchers/create" element={<CreateVoucher />} />
          <Route path="showtimes" element={<ShowtimeManagement />} />
          <Route path="rooms" element={<RoomManagement />} />
          <Route path="rooms/add" element={<AdminRoomForm mode="add" />} />
          <Route path="rooms/edit/:id" element={<AdminRoomForm mode="edit" />} />
          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Super Admin Route */}
        <Route
          path="/super-admin"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="cinemas" element={<CinemaManagement />} />
          <Route path="cinemas/create" element={<CreateCinema />} />
          <Route path="system-staff" element={<SystemStaffManagement />} />
          <Route path="system-staff/create" element={<CreateSystemStaff />} />
          <Route path="system-staff/edit/:id" element={<CreateSystemStaff />} />
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
          <Route path="news/create" element={<CreateNews />} />
          <Route path="news" element={<NewsAdmin />} />
          <Route path="global-invoices" element={<GlobalInvoiceManagement />} />
          
          {/* Admin-level (rạp) management - super admin kế thừa UI */}
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/add" element={<AdminStaffForm mode="add" />} />
          <Route path="staff/edit/:id" element={<AdminStaffForm mode="edit" />} />
          <Route path="vouchers" element={<VouchersAdmin />} />
          <Route path="vouchers/create" element={<CreateVoucher />} />
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
          <Route path="profile" element={<SuperAdminProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

