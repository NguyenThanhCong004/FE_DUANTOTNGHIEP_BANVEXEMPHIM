import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthSession, getActiveShift, setActiveShift } from "../../utils/authStorage";
import { apiJson } from "../../utils/apiClient";
import { SHIFTS } from "../../constants/apiEndpoints";

function normalizeStaffRole(staff) {
  if (!staff) return null;
  return (staff.role ?? "")
    .toString()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function normalizeText(value) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSalesShift(shift) {
  const role = normalizeText(shift?.role);
  return role === "ban ve" || role === "ban hang" || role === "sales" || role === "cashier";
}

/**
 * Khu vực nhân viên sàn: xem ca làm cá nhân.
 * ADMIN / SUPER_ADMIN được chuyển về trang quản trị tương ứng.
 * STAFF không trong ca làm việc chỉ được xem trang ca-lam.
 */
export default function StaffFloorGuard({ children }) {
  const authSession = getAuthSession();
  const staff = authSession.staff;
  const role = normalizeStaffRole(staff);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentActiveShift, setCurrentActiveShift] = useState(getActiveShift());

  useEffect(() => {
    let cancelled = false;

    const checkActiveShift = async () => {
      if (!authSession.isAuthenticated || role !== "STAFF") {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const result = await apiJson(SHIFTS.ACTIVE);
        if (cancelled) return;
        if (result.ok && result.data) {
          setActiveShift(result.data);
          setCurrentActiveShift(result.data);
        } else {
          setActiveShift(null);
          setCurrentActiveShift(null);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra ca làm trong Guard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkActiveShift();
    const interval = setInterval(checkActiveShift, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authSession.isAuthenticated, role]);

  if (!authSession.isAuthenticated || !staff || !role) {
    return <Navigate to="/staff/login" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin" replace />;
  }

  if (loading) {
    return <div className="p-4 text-center text-white">Đang kiểm tra ca làm việc...</div>;
  }

  // Nếu không có ca làm việc hiện tại, chỉ cho phép truy cập trang /staff/shifts
  const isViewingShifts = location.pathname.includes("/staff/shifts");
  if (!currentActiveShift && !isViewingShifts) {
    return <Navigate to="/staff/shifts" replace />;
  }

  const isViewingSales = location.pathname.includes("/staff/sales");
  if (isViewingSales && !isSalesShift(currentActiveShift)) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
}
