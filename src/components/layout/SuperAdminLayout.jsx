import React, { useEffect, useMemo, useState } from "react";

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AUTH_SESSION_CHANGED, clearAuthSession, getStoredStaff } from "../../utils/authStorage";
import SuperAdminSidebar from "./SuperAdminSidebar";
import CinemaPicker from "./CinemaPicker";
import ThemeToggle from "./ThemeToggle";
import { apiUrl } from "../../utils/apiClient";
import { isDisplayableImageSrc } from "../../utils/mediaFiles";
import "../../styles/admin-shell.css";
import "../../styles/admin-design-system.css";

function resolveAvatarSrc(value) {
  const src = String(value || "").trim();
  if (!isDisplayableImageSrc(src)) return "";
  if (src.startsWith("http") || src.startsWith("data:image") || src.startsWith("./") || src.startsWith("../")) {
    return src;
  }
  return apiUrl(src);
}

export default function SuperAdminLayout({ children }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(() => getStoredStaff());

  useEffect(() => {
    const syncStaff = () => setStaff(getStoredStaff());
    window.addEventListener(AUTH_SESSION_CHANGED, syncStaff);
    window.addEventListener("storage", syncStaff);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, syncStaff);
      window.removeEventListener("storage", syncStaff);
    };
  }, []);

  const staffName = useMemo(() => staff?.fullname || "Super Admin", [staff]);
  const staffAvatarSrc = useMemo(() => resolveAvatarSrc(staff?.avatar), [staff]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/staff/login");
  };

  return (
    <div className="app-shell-layout">
      <SuperAdminSidebar />

      <main className="app-shell-main">
        <header className="app-shell-header">
          <div className="app-shell-header-title d-none d-md-block">
            <span className="app-shell-header-kicker">Super Admin</span>
          </div>

          <div className="app-shell-header-actions">
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
              <span className="app-shell-header-cinema-label d-none d-lg-inline">Rạp:</span>
              <CinemaPicker variant="header" />
            </div>
            <ThemeToggle />
            <NavLink to="/super-admin/profile" className="text-decoration-none">
              <div className="app-shell-profile-chip">
                <img
                  src={
                    staffAvatarSrc ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      staffName
                    )}&background=1f2937&color=fff`
                  }
                  onError={(ev) => {
                    ev.target.onerror = null;
                    ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      staffName
                    )}&background=1f2937&color=fff`;
                  }}
                  alt=""
                />
                <div>
                  <div className="app-shell-profile-name">{staffName}</div>
                  <div className="app-shell-profile-sub">Super Admin · Hồ sơ</div>
                </div>
              </div>
            </NavLink>
            <button
              type="button"
              className="app-shell-logout-btn app-shell-logout-btn--header"
              onClick={handleLogout}
            >
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <section className="app-shell-content app-shell-content--panel">
          {children ?? <Outlet />}
        </section>
      </main>
    </div>
  );
}
