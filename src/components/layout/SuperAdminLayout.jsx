import React, { useMemo } from "react";
import { Bell } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { getStoredStaff } from "../../utils/authStorage";
import SuperAdminSidebar from "./SuperAdminSidebar";
import CinemaPicker from "./CinemaPicker";
import "../../styles/admin-shell.css";

export default function SuperAdminLayout({ children }) {
  const staff = getStoredStaff();

  const staffName = useMemo(() => staff?.fullname || "Super Admin", [staff]);

  return (
    <div className="app-shell-layout">
      <SuperAdminSidebar />

      <main className="app-shell-main">
        <header className="app-shell-header">
          <div className="app-shell-header-title d-none d-md-block">
            <span className="app-shell-header-kicker">
              Super Admin · Dữ liệu theo rạp: chọn <strong>cinemaId</strong> trên header
            </span>
          </div>

          <div className="app-shell-header-actions">
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
              <span className="app-shell-header-cinema-label d-none d-lg-inline">Rạp:</span>
              <CinemaPicker variant="header" />
            </div>
            <button className="app-shell-icon-btn" aria-label="Thông báo" type="button">
              <Bell size={16} />
            </button>
            <NavLink to="/super-admin/profile" className="text-decoration-none">
              <div className="app-shell-profile-chip">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    staffName
                  )}&background=1f2937&color=fff`}
                  alt=""
                />
                <div>
                  <div className="app-shell-profile-name">{staffName}</div>
                  <div className="app-shell-profile-sub">Super Admin · Hồ sơ</div>
                </div>
              </div>
            </NavLink>
          </div>
        </header>

        <section className="app-shell-content">
          {children ?? <Outlet />}
        </section>
      </main>
    </div>
  );
}
