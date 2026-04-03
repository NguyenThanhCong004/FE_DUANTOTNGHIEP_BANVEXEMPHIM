import React from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, getStoredStaff } from "../../utils/authStorage";

/** Chuẩn hóa role từ BE (ROLE_ADMIN, Admin, ...) → ADMIN */
function normalizeStaffRole(staff) {
  if (!staff) return null;
  return (staff.role ?? "")
    .toString()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

/**
 * Bảo vệ route theo role staff đã lưu sau đăng nhập.
 * Phải khớp với logic điều hướng trong `Login.jsx`.
 */
const RoleGuard = ({ children, allowedRoles }) => {
  const token = getAccessToken();
  const staff = getStoredStaff();
  const role = normalizeStaffRole(staff);

  if (!token || !staff || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;
