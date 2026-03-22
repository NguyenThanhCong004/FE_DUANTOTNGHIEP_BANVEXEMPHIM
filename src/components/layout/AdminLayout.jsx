import React, { useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Armchair,
  Bell,
  CalendarClock,
  DoorOpen,
  Film,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  ReceiptText,
  UserCircle,
  UserRound,
  Users,
} from "lucide-react";
import { clearAuthSession, getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "./useSuperAdminCinema";
import CinemaPicker from "./CinemaPicker";
import "../../styles/admin-shell.css";

const sectionsGeneral = [
  {
    title: "Tổng quan",
    requiresCinema: false,
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
];

const sectionsCinema = [
  {
    title: "Hệ thống rạp",
    requiresCinema: true,
    items: [
      { path: "/admin/staff", label: "Nhân viên rạp", icon: UserRound },
      { path: "/admin/shifts", label: "Ca làm", icon: CalendarClock },
      { path: "/admin/rooms", label: "Phòng chiếu", icon: DoorOpen },
      { path: "/admin/seats", label: "Sơ đồ ghế", icon: Armchair },
      { path: "/admin/showtimes", label: "Suất chiếu", icon: Film },
      { path: "/admin/products", label: "Sản phẩm", icon: Package },
      { path: "/admin/promotions", label: "Khuyến mãi", icon: Megaphone },
      { path: "/admin/invoices", label: "Hóa đơn", icon: ReceiptText },
    ],
  },
];

const sectionsRest = [
  {
    title: "Khách hàng",
    requiresCinema: false,
    items: [{ path: "/admin/users", label: "Khách hàng", icon: Users }],
  },
  {
    title: "Tài khoản",
    requiresCinema: false,
    items: [{ path: "/admin/profile", label: "Hồ sơ cá nhân", icon: UserCircle }],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const staff = getStoredStaff();
  const {
    selectedCinemaId,
    selectedCinemaName,
    setSelectedCinemaId,
  } = useSuperAdminCinema();

  /** Admin rạp: rạp lấy từ BE khi đăng nhập (`staff.cinemaId`), không cần chọn tay. */
  const effectiveCinemaId = staff?.cinemaId ?? selectedCinemaId;
  const cinemaReady = effectiveCinemaId != null;

  useEffect(() => {
    const cid = staff?.cinemaId;
    if (cid == null) return;
    if (selectedCinemaId !== cid) setSelectedCinemaId(cid);
  }, [staff?.cinemaId, selectedCinemaId, setSelectedCinemaId]);

  const staffName = useMemo(() => staff?.fullname || "Quản trị viên", [staff]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const renderNavSection = (section) => {
    const locked = section.requiresCinema && !cinemaReady;

    return (
      <div key={section.title} className="app-shell-nav-block">
        {section.requiresCinema ? (
          <div
            className={`app-shell-nav-section--locked ${locked ? "is-disabled" : ""}`}
          >
            <div className="app-shell-nav-section-title">{section.title}</div>
            {locked && (
              <p className="app-shell-lock-hint">
                Tài khoản chưa được gán rạp (cinemaId). Liên hệ Super Admin.
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <LinkOrSpan
                  key={item.path}
                  to={item.path}
                  end={Boolean(item.end)}
                  locked={locked}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </LinkOrSpan>
              );
            })}
          </div>
        ) : (
          <>
            <div className="app-shell-nav-section-title">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <LinkOrSpan
                  key={item.path}
                  to={item.path}
                  end={Boolean(item.end)}
                  locked={false}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </LinkOrSpan>
              );
            })}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="app-shell-layout">
      <aside className="app-shell-sidebar">
        <div className="app-shell-brand">
          <div className="app-shell-brand-dot" />
          <div>
            <div className="app-shell-brand-title">CINETOON</div>
            <div className="app-shell-brand-sub">Quản trị rạp</div>
          </div>
        </div>

        {staff?.cinemaId == null ? <CinemaPicker /> : null}

        <nav className="app-shell-nav-scroll">
          {sectionsGeneral.map(renderNavSection)}
          {sectionsCinema.map(renderNavSection)}
          {sectionsRest.map(renderNavSection)}
        </nav>

        <button type="button" className="app-shell-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <main className="app-shell-main">
        <header className="app-shell-header">
          <div className="app-shell-header-title d-none d-md-block">
            <span className="app-shell-header-kicker">Bảng điều khiển</span>
          </div>

          <div className="app-shell-header-actions">
            <button className="app-shell-icon-btn" type="button" aria-label="Thông báo">
              <Bell size={16} />
            </button>
            <div className="app-shell-cinema-chip" title="Rạp hiện tại">
              <span>
                {cinemaReady
                  ? selectedCinemaName || `Rạp #${effectiveCinemaId}`
                  : "Chưa có rạp"}
              </span>
            </div>
            <NavLink to="/admin/profile" className="text-decoration-none">
              <div className="app-shell-profile-chip">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    staffName
                  )}&background=1f2937&color=fff`}
                  alt=""
                />
                <div>
                  <div className="app-shell-profile-name">{staffName}</div>
                  <div className="app-shell-profile-sub">Admin rạp · Hồ sơ</div>
                </div>
              </div>
            </NavLink>
          </div>
        </header>

        <section className="app-shell-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function LinkOrSpan({ to, end, locked, children }) {
  if (locked) {
    return (
      <span
        className="app-shell-nav-link app-shell-nav-link--locked"
        aria-disabled="true"
        title="Chọn rạp để truy cập"
      >
        {children}
      </span>
    );
  }
  return (
    <NavLink
      to={to}
      end={Boolean(end)}
      className={({ isActive }) =>
        `app-shell-nav-link ${isActive ? "active" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}
