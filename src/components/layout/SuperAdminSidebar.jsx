import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { clearAuthSession } from "../../utils/authStorage";
import { useSuperAdminCinema } from "./useSuperAdminCinema";
import CinemaPicker from "./CinemaPicker";

const menuSections = [
  {
    title: "Tổng quan",
    requiresCinema: false,
    items: [
      { path: "/super-admin", icon: "bi-speedometer2", label: "Dashboard" },
      { path: "/super-admin/profile", icon: "bi-person-circle", label: "Hồ sơ" },
    ],
  },
  {
    title: "Hệ thống",
    requiresCinema: false,
    items: [
      { path: "/super-admin/cinemas", icon: "bi-building", label: "Quản lý rạp" },
      { path: "/super-admin/users", icon: "bi-people", label: "Người dùng" },
    ],
  },
  {
    title: "Nội dung & danh mục",
    requiresCinema: false,
    items: [
      { path: "/super-admin/movies", icon: "bi-film", label: "Kho phim" },
      { path: "/super-admin/movie-types", icon: "bi-tags", label: "Thể loại phim" },
      { path: "/super-admin/news", icon: "bi-newspaper", label: "Tin tức" },
      { path: "/super-admin/vouchers", icon: "bi-ticket-perforated", label: "Voucher" },
      { path: "/super-admin/seat-types", icon: "bi-grid-3x3-gap", label: "Loại ghế" },
      { path: "/super-admin/product-types", icon: "bi-box-seam", label: "Loại sản phẩm" },
      { path: "/super-admin/catalog-products", icon: "bi-bag", label: "Sản phẩm (danh mục)" },
      { path: "/super-admin/membership-levels", icon: "bi-award", label: "Hạng thành viên" },
    ],
  },
  {
    title: "Vận hành rạp",
    requiresCinema: true,
    items: [
      { path: "/super-admin/staff", icon: "bi-person-gear", label: "Nhân viên rạp" },
      { path: "/super-admin/promotions", icon: "bi-megaphone", label: "Khuyến mãi" },
      { path: "/super-admin/shifts", icon: "bi-calendar-check", label: "Ca làm" },
      { path: "/super-admin/rooms", icon: "bi-door-open", label: "Phòng chiếu" },
      { path: "/super-admin/seats", icon: "bi-grid-3x3", label: "Ghế (sơ đồ)" },
      { path: "/super-admin/showtimes", icon: "bi-clock-history", label: "Suất chiếu" },
      { path: "/super-admin/store-products", icon: "bi-cup-straw", label: "Sản phẩm & Combo (rạp)" },
      { path: "/super-admin/invoices", icon: "bi-receipt", label: "Hóa đơn" },
    ],
  },
];

export default function SuperAdminSidebar() {
  const navigate = useNavigate();
  const { selectedCinemaId } = useSuperAdminCinema();
  const cinemaReady = selectedCinemaId != null;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <aside className="app-shell-sidebar">
      <div className="app-shell-brand">
        <div className="app-shell-brand-dot" />
        <div>
          <div className="app-shell-brand-title">CINETOON CORE</div>
          <div className="app-shell-brand-sub">SUPER ADMIN</div>
        </div>
      </div>

      <CinemaPicker />

      <nav className="app-shell-nav-scroll">
        {menuSections.map((section) => {
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
                      Chọn rạp trên <strong>header</strong> (hoặc ô sidebar) để mở dữ liệu theo{" "}
                      <strong>cinemaId</strong> — nhân viên, khuyến mãi, suất chiếu, hóa đơn…
                    </p>
                  )}
                  {section.items.map((item) => (
                    <BiNavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/super-admin"}
                      locked={locked}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="app-shell-nav-section-title">{section.title}</div>
                  {section.items.map((item) => (
                    <BiNavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/super-admin"}
                      locked={false}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </nav>

      <button type="button" className="app-shell-logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}

function BiNavLink({ to, end, locked, icon, label }) {
  if (locked) {
    return (
      <span
        className="app-shell-nav-link app-shell-nav-link--locked"
        aria-disabled="true"
        title="Chọn rạp để truy cập"
      >
        <i className={`bi ${icon}`} />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <NavLink
      to={to}
      end={Boolean(end)}
      className={({ isActive }) => `app-shell-nav-link ${isActive ? "active" : ""}`}
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </NavLink>
  );
}
