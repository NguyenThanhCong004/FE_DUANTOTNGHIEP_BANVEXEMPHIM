import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/common/Home';
import Login from '../pages/auth/Login';
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import EmployeeDashboard from '../pages/employee/Dashboard';
import Profile from '../pages/user/Profile';
import NotFound from '../pages/common/NotFound';
import RoleGuard from './guards/RoleGuard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin/dashboard"
        element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </RoleGuard>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </RoleGuard>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <RoleGuard allowedRoles={['STAFF', 'ADMIN', 'SUPER_ADMIN']}>
            <EmployeeDashboard />
          </RoleGuard>
        }
      />

      {/* User Routes */}
      <Route
        path="/profile"
        element={
          <RoleGuard allowedRoles={['USER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}>
            <Profile />
          </RoleGuard>
        }
      />

      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
