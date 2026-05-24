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
    const checkActiveShift = async () => {
      if (!authSession.isAuthenticated || role !== "STAFF") {
        setLoading(false);
        return;
      }

      try {
        const result = await apiJson(SHIFTS.ACTIVE);
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
        setLoading(false);
      }
    };

    checkActiveShift();
  }, [authSession.isAuthenticated, role, location.pathname]);

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

  // Nếu không có ca làm việc hiện tại, chỉ cho phép truy cập trang /staff/ca-lam
  const isViewingShifts = location.pathname.includes("/staff/ca-lam");
  if (!currentActiveShift && !isViewingShifts) {
    return <Navigate to="/staff/ca-lam" replace />;
  }

  return children;
}
