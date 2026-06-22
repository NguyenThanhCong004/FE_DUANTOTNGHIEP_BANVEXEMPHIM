import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthSession } from "../../utils/authStorage";

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
  const authSession = getAuthSession();
  const staff = authSession.staff;
  const role = normalizeStaffRole(staff);

  if (!authSession.isAuthenticated || !staff || !role) {
    return <Navigate to="/staff/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/staff/login" replace />;
  }

  return children;
};

export default RoleGuard;
