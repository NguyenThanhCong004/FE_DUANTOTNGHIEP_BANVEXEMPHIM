import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Calendar } from "lucide-react";
import { clearAuthSession, getStoredStaff } from "../../utils/authStorage";
import "../../styles/admin-shell.css";

export default function EmployeeSelfServiceLayout() {
  const navigate = useNavigate();
  const staff = getStoredStaff();
  const name = staff?.fullname || staff?.username || "Nhân viên";

  const logout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="employee-self-shell">
      <header className="employee-self-header">
        <div className="d-flex align-items-center gap-2">
          <Calendar className="text-info" size={22} />
          <div>
            <div className="employee-self-brand">CINETOON · Nhân viên</div>
            <div className="employee-self-sub">Lịch ca làm cá nhân</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="employee-self-name text-white-50 small">
            Xin chào, <strong className="text-white">{name}</strong>
            {staff?.role ? (
              <span className="ms-1 badge bg-secondary">{String(staff.role).replace(/^ROLE_/i, "")}</span>
            ) : null}
          </span>
          <button type="button" className="btn btn-outline-light btn-sm" onClick={logout}>
            <LogOut size={16} className="me-1" style={{ verticalAlign: "middle" }} />
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="employee-self-main">
        <Outlet />
      </main>
      <style>{`
        .employee-self-shell { min-height: 100vh; background: #0f172a; color: #e2e8f0; }
        .employee-self-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
          padding: 14px 20px; border-bottom: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.98); position: sticky; top: 0; z-index: 10;
        }
        .employee-self-brand { font-weight: 800; letter-spacing: 0.04em; font-size: 14px; color: #f8fafc; }
        .employee-self-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .employee-self-main { padding: 20px; max-width: 960px; margin: 0 auto; }
      `}</style>
    </div>
  );
}
