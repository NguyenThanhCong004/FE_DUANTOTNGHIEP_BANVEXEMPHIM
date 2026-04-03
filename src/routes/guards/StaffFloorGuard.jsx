import React from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, getStoredStaff } from "../../utils/authStorage";

function normalizeStaffRole(staff) {
  if (!staff) return null;
  return (staff.role ?? "")
    .toString()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

/**
 * Khu vực nhân viên sàn: xem ca làm cá nhân.
 * ADMIN / SUPER_ADMIN được chuyển về trang quản trị tương ứng.
 */
export default function StaffFloorGuard({ children }) {
  const token = getAccessToken();
  const staff = getStoredStaff();
  const role = normalizeStaffRole(staff);

  if (!token || !staff || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin" replace />;
  }

  return children;
}
