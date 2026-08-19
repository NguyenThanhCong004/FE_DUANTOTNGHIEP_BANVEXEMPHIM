import React from "react";
import { NavLink } from "react-router-dom";
import { useSuperAdminCinema } from "./useSuperAdminCinema";

const menuSections = [
  {
    title: "Tổng quan",
    requiresCinema: false,
    items: [
      { path: "/super-admin", icon: "bi-speedometer2", label: "Dashboard" },
    ],
  },
  {
    title: "Hệ thống",
    requiresCinema: false,
    items: [
      { path: "/super-admin/cinemas", icon: "bi-building", label: "Quản lý rạp" },
      { path: "/super-admin/system-staff", icon: "bi-people-fill", label: "Nhân sự toàn hệ thống" },
      { path: "/super-admin/users", icon: "bi-people", label: "Người dùng" },
      { path: "/super-admin/global-invoices", icon: "bi-receipt-cutoff", label: "Hóa đơn hệ thống" },
    ],
  },
  {
    title: "Nội dung & danh mục",
    requiresCinema: false,
    items: [
      { path: "/super-admin/movies", icon: "bi-film", label: "Kho phim" },
      { path: "/super-admin/movie-types", icon: "bi-tags", label: "Thể loại phim" },
      { path: "/super-admin/news", icon: "bi-newspaper", label: "Tin tức" },
      { path: "/super-admin/seat-types", icon: "bi-grid-3x3-gap", label: "Loại ghế" },
      { path: "/super-admin/room-types", icon: "bi-house-gear", label: "Loại phòng chiếu" },
      { path: "/super-admin/product-types", icon: "bi-box-seam", label: "Loại sản phẩm" },
      { path: "/super-admin/catalog-products", icon: "bi-bag", label: "Sản phẩm" },
      { path: "/super-admin/membership-levels", icon: "bi-award", label: "Hạng thành viên" },
    ],
  },
  {
    title: "Vận hành rạp",
    requiresCinema: true,
    items: [
      { path: "/super-admin/staff", icon: "bi-person-gear", label: "Nhân viên rạp" },
      { path: "/super-admin/vouchers", icon: "bi-ticket-perforated", label: "Voucher" },
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
  const { selectedCinemaId } = useSuperAdminCinema();
  const cinemaReady = selectedCinemaId != null;

  const renderSection = (section) => {
    const locked = section.requiresCinema && !cinemaReady;

    const links = section.items.map((item) => (
      <BiNavLink
        key={item.path}
        to={item.path}
        end={item.path === "/super-admin"}
        locked={locked}
        icon={item.icon}
        label={item.label}
      />
    ));

    return (
      <div key={section.title} className="app-shell-nav-block">
        {section.requiresCinema ? (
          <div className={`app-shell-nav-section--locked ${locked ? "is-disabled" : ""}`}>
            <div className="app-shell-nav-section-title">
              <span>{section.title}</span>
              {locked && (
                <span className="locked-badge" title="Cần chọn rạp trước">
                  <i className="bi bi-lock-fill"></i>
                </span>
              )}
            </div>
            {links}
          </div>
        ) : (
          <>
            <div className="app-shell-nav-section-title">{section.title}</div>
            {links}
          </>
        )}
      </div>
    );
  };

  return (
    <aside className="app-shell-sidebar">
      <div className="app-shell-brand">
        <div className="app-shell-brand-dot" />
        <div>
          <div className="app-shell-brand-title">MovieZone</div>
          <div className="app-shell-brand-sub">Super Admin</div>
        </div>
      </div>

      <nav className="app-shell-nav-scroll">{menuSections.map(renderSection)}</nav>
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
        <i className={`bi ${icon}`}></i>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `app-shell-nav-link ${isActive ? "active" : ""}`}
    >
      <i className={`bi ${icon}`}></i>
      <span>{label}</span>
    </NavLink>
  );
}
