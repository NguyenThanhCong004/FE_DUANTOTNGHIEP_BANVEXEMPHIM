import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserRound,
  LogOut,
  LayoutDashboard,
  Film,
  Popcorn,
  Ticket,
  History,
  Award,
  Menu,
  X,
  ChevronDown,
  User,
  Heart,
  Search,
} from "lucide-react";
import { clearAuthSession, getAccessToken, getStoredStaff, getStoredUser } from "../../utils/authStorage";

const NAV_LINKS = [
  { to: "/",          label: "Sự kiện",        end: true },
  { to: "/movies",    label: "Phim"                      },
  { to: "/events",    label: "Sự kiện"                   },
  { to: "/voucher",   label: "Ưu đãi"                    },
];

function pathActive(pathname, to, endOnly) {
  if (to === "/") return pathname === "/";
  if (endOnly) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function staffPortalPath(role) {
  const r = (role || "").toUpperCase().replace(/^ROLE_/, "");
  if (r === "SUPER_ADMIN") return "/super-admin";
  if (r === "ADMIN") return "/admin";
  return "/staff/ca-lam";
}

export default function CinemaNavbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue]   = useState("");

  const location   = useLocation();
  const navigate   = useNavigate();
  const dropdownRef = useRef(null);

  const token  = getAccessToken();
  const staff  = getStoredStaff();
  const user   = getStoredUser();

  const isLoggedIn     = Boolean(token);
  const isStaffSession = Boolean(staff);
  const displayName    = staff?.fullname || user?.fullname || user?.username || "Tài khoản";

  const staffPortal = useMemo(() => {
    if (!staff?.role) return null;
    return staffPortalPath(staff.role);
  }, [staff]);

  /* scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close menus on route change */
  const prevPath = useRef(location.pathname);
  if (location.pathname !== prevPath.current) {
    prevPath.current = location.pathname;
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }

  /* close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchValue.trim()) {
      navigate("/movies?q=" + encodeURIComponent(searchValue.trim()));
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
          --glass:     rgba(13,13,43,0.92);
        }

        /* ── ACCENT STRIP ── */
        .cn-strip {
          height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow), var(--purple));
          background-size: 300%;
          animation: cnGradient 5s linear infinite;
        }
        @keyframes cnGradient {
          0%   { background-position: 0%   50%; }
          100% { background-position: 300% 50%; }
        }

        /* ── WRAPPER ── */
        .cn-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1030;
          transition: box-shadow .4s ease;
        }

        /* ── TOP BAR ── */
        .cn-top {
          background: var(--glass);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(212,255,0,.12);
          transition: box-shadow .4s ease, border-color .4s ease;
          padding: 10px 0;
        }
        .cn-top.scrolled {
          box-shadow: 0 4px 40px rgba(139,0,255,.3);
          border-bottom-color: rgba(212,255,0,.3);
        }

        /* ── INNER ── */
        .cn-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* ── LOGO ── */
        .cn-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none !important;
          flex-shrink: 0;
        }
        .cn-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 0 20px rgba(255,45,120,.45);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .cn-logo-icon::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,.13) 50%, transparent 60%);
          animation: cnShimmer 3s infinite;
        }
        @keyframes cnShimmer {
          0%   { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%)  rotate(45deg); }
        }
        .cn-logo-wordmark {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 3px;
          color: var(--off-white);
          line-height: 1;
        }
        .cn-logo-wordmark span { color: var(--yellow); }

        /* ── QUICK ACTIONS ── */
        .cn-btn-ticket {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: .4px;
          border-radius: 8px;
          padding: 7px 14px;
          cursor: pointer;
          text-decoration: none !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: box-shadow .25s, transform .25s;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none;
          color: #fff !important;
          box-shadow: 0 0 16px rgba(255,45,120,.3);
        }
        .cn-btn-ticket:hover {
          box-shadow: 0 0 28px rgba(255,45,120,.65);
          transform: translateY(-1px);
        }

        .cn-btn-food {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: .4px;
          border-radius: 8px;
          padding: 7px 14px;
          cursor: pointer;
          text-decoration: none !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: box-shadow .25s, transform .25s, border-color .25s;
          background: transparent;
          border: 1.5px solid rgba(212,255,0,.45);
          color: var(--yellow) !important;
        }
        .cn-btn-food:hover {
          border-color: var(--yellow);
          box-shadow: 0 0 16px rgba(212,255,0,.35);
          transform: translateY(-1px);
        }

        /* ── SEARCH ── */
        .cn-search {
          display: flex;
          align-items: stretch;
          max-width: 300px;
          width: 100%;
          border: 1.5px solid rgba(255,255,255,.1);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color .3s, box-shadow .3s;
        }
        .cn-search:focus-within {
          border-color: var(--yellow);
          box-shadow: 0 0 18px rgba(212,255,0,.15);
        }
        .cn-search-input {
          flex: 1;
          background: rgba(255,255,255,.06);
          border: none;
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          padding: 8px 12px;
          outline: none;
          min-width: 0;
          transition: background .3s;
        }
        .cn-search-input::placeholder { color: rgba(240,240,255,.3); }
        .cn-search-input:focus { background: rgba(212,255,0,.04); }
        .cn-search-btn {
          background: rgba(255,255,255,.06);
          border: none;
          border-left: 1px solid rgba(255,255,255,.08);
          color: rgba(240,240,255,.4);
          padding: 8px 14px;
          cursor: pointer;
          transition: color .25s, background .25s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cn-search-btn:hover { color: var(--yellow); background: rgba(212,255,0,.06); }

        /* ── AUTH BUTTONS ── */
        .cn-btn-login {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          background: transparent;
          border: 1.5px solid rgba(240,240,255,.25);
          color: var(--off-white) !important;
          text-decoration: none !important;
          transition: border-color .25s, color .25s;
          white-space: nowrap;
        }
        .cn-btn-login:hover { border-color: var(--off-white); }

        .cn-btn-register {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          padding: 7px 16px;
          border-radius: 8px;
          background: var(--yellow);
          border: none;
          color: var(--navy) !important;
          text-decoration: none !important;
          box-shadow: 0 0 18px rgba(212,255,0,.2);
          transition: box-shadow .25s, transform .25s;
          white-space: nowrap;
        }
        .cn-btn-register:hover {
          box-shadow: 0 0 30px rgba(212,255,0,.55);
          transform: translateY(-1px);
        }

        /* ── USER DROPDOWN TRIGGER ── */
        .cn-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.12);
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: border-color .25s, background .25s;
          white-space: nowrap;
          max-width: 200px;
        }
        .cn-user-btn:hover { border-color: rgba(212,255,0,.4); background: rgba(212,255,0,.04); }
        .cn-user-avatar {
          width: 26px; height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .cn-user-name {
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
        }
        .cn-chevron { color: rgba(240,240,255,.4); transition: transform .25s; flex-shrink: 0; }
        .cn-chevron.open { transform: rotate(180deg); }

        /* ── DROPDOWN MENU ── */
        .cn-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 230px;
          background: #0d0d2b;
          border: 1px solid rgba(212,255,0,.15);
          border-radius: 14px;
          box-shadow: 0 12px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(139,0,255,.1);
          overflow: hidden;
          z-index: 60;
          animation: cnDropIn .2s ease;
        }
        @keyframes cnDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .cn-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,.75);
          text-decoration: none !important;
          transition: background .2s, color .2s;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .cn-dropdown-item:hover { background: rgba(255,255,255,.06); color: var(--off-white); }
        .cn-dropdown-item.danger { color: #ff5b7b; }
        .cn-dropdown-item.danger:hover { background: rgba(255,45,120,.1); color: #ff2d78; }
        .cn-dropdown-divider {
          height: 1px;
          background: rgba(255,255,255,.07);
          margin: 4px 0;
        }
        .cn-dropdown-label {
          padding: 10px 16px 4px;
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(212,255,0,.5);
        }

        /* ── BOTTOM NAV ── */
        .cn-bottom {
          background: rgba(0,0,0,.25);
          border-top: 1px solid rgba(255,255,255,.05);
          padding: 0;
        }
        .cn-bottom-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cn-nav-link {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(240,240,255,.45) !important;
          padding: 9px 16px !important;
          border-radius: 6px;
          position: relative;
          text-decoration: none !important;
          transition: color .25s, background .25s;
          display: inline-block;
        }
        .cn-nav-link::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 16px; right: 16px;
          height: 2px;
          background: var(--yellow);
          border-radius: 2px;
          transform: scaleX(0);
          transition: transform .3s ease;
        }
        .cn-nav-link:hover { color: var(--off-white) !important; background: rgba(255,255,255,.05); }
        .cn-nav-link:hover::after { transform: scaleX(1); }
        .cn-nav-link.active { color: var(--yellow) !important; }
        .cn-nav-link.active::after { transform: scaleX(1); }

        /* ── SPACER ── */
        .cn-spacer { height: 78px; }

        /* ── MOBILE TOGGLER ── */
        .cn-toggler {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px; height: 38px;
          border: 1.5px solid rgba(212,255,0,.35);
          border-radius: 8px;
          background: transparent;
          color: var(--yellow);
          cursor: pointer;
          flex-shrink: 0;
          transition: background .2s, border-color .2s;
        }
        .cn-toggler:hover { background: rgba(212,255,0,.08); border-color: var(--yellow); }

        /* ── MOBILE DRAWER ── */
        .cn-mobile-drawer {
          max-height: 0;
          overflow: hidden;
          background: rgba(13,13,43,.98);
          backdrop-filter: blur(24px);
          transition: max-height .35s ease;
          border-top: 1px solid rgba(212,255,0,.08);
        }
        .cn-mobile-drawer.open { max-height: 600px; }
        .cn-mobile-inner { padding: 16px 24px 24px; }

        .cn-mobile-link {
          display: flex;
          align-items: center;
          padding: 11px 14px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: .5px;
          color: rgba(240,240,255,.6);
          text-decoration: none !important;
          transition: background .2s, color .2s;
          gap: 10px;
        }
        .cn-mobile-link:hover { background: rgba(255,255,255,.06); color: var(--off-white); }
        .cn-mobile-link.active { color: var(--yellow); background: rgba(212,255,0,.06); }

        .cn-mobile-divider { height: 1px; background: rgba(255,255,255,.07); margin: 10px 0; }

        .cn-mobile-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(212,255,0,.45);
          padding: 8px 14px 4px;
        }

        .cn-mobile-action {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: rgba(240,240,255,.6);
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          text-decoration: none !important;
          transition: background .2s, color .2s;
        }
        .cn-mobile-action:hover { background: rgba(255,255,255,.06); color: var(--off-white); }
        .cn-mobile-action.danger { color: #ff5b7b; }
        .cn-mobile-action.danger:hover { background: rgba(255,45,120,.1); color: #ff2d78; }

        /* ── RESPONSIVE ── */
        @media (max-width: 991px) {
          .cn-desktop-actions,
          .cn-quick-actions,
          .cn-search,
          .cn-bottom { display: none !important; }
          .cn-toggler { display: flex; }
          .cn-spacer { height: 58px; }
        }
        @media (min-width: 992px) {
          .cn-toggler,
          .cn-mobile-drawer { display: none !important; }
        }
      `}</style>

      <div className="cn-header">
        {/* Animated gradient strip */}
        <div className="cn-strip" />

        {/* ── TOP BAR ── */}
        <div className={`cn-top${scrolled ? " scrolled" : ""}`}>
          <div className="cn-inner">

            {/* Logo */}
            <Link to="/" className="cn-logo">
              <div className="cn-logo-icon">
                <Film size={22} strokeWidth={2.5} />
              </div>
              <span className="cn-logo-wordmark">ERROR<span>404</span></span>
            </Link>

            {/* Quick actions */}
            <div className="cn-quick-actions" style={{ display: "flex", gap: 8 }}>
              <Link to="/movies"    className="cn-btn-ticket">🎫 Đặt vé ngay</Link>
              <Link to="/foodorder" className="cn-btn-food">🍿 Đặt bắp nước</Link>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Search */}
            <div className="cn-search">
              <input
                className="cn-search-input"
                placeholder="Tìm phim, diễn viên..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
              />
              <button
                className="cn-search-btn"
                onClick={() => searchValue.trim() && navigate("/movies?q=" + encodeURIComponent(searchValue.trim()))}
              >
                <Search size={15} />
              </button>
            </div>

            {/* Auth / User */}
            <div className="cn-desktop-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isLoggedIn ? (
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button
                    type="button"
                    className="cn-user-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="cn-user-avatar">
                      <UserRound size={14} />
                    </div>
                    <span className="cn-user-name">{displayName}</span>
                    <ChevronDown size={14} className={`cn-chevron${dropdownOpen ? " open" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="cn-dropdown">
                      {isStaffSession && staffPortal ? (
                        <>
                          <div className="cn-dropdown-label">Quản trị</div>
                          <Link
                            to={staffPortal}
                            className="cn-dropdown-item"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <LayoutDashboard size={15} style={{ color: "#ff2d78", flexShrink: 0 }} />
                            Hệ thống quản trị
                          </Link>
                          <div className="cn-dropdown-divider" />
                        </>
                      ) : (
                        <>
                          <div className="cn-dropdown-label">Tài khoản</div>
                          <Link to="/profile"           className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <User    size={15} style={{ color: "rgba(240,240,255,.5)", flexShrink: 0 }} /> Hồ sơ cá nhân
                          </Link>
                          <Link to="/movieFavorite"     className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <Heart   size={15} style={{ color: "#f472b6", flexShrink: 0 }} /> Phim yêu thích
                          </Link>
                          <Link to="/foodorder"         className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <Popcorn size={15} style={{ color: "#fbbf24", flexShrink: 0 }} /> Đặt bắp nước
                          </Link>
                          <Link to="/transactionHistory" className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <History size={15} style={{ color: "rgba(240,240,255,.5)", flexShrink: 0 }} /> Lịch sử giao dịch
                          </Link>
                          <Link to="/myVouchers"        className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <Ticket  size={15} style={{ color: "#34d399", flexShrink: 0 }} /> Voucher của tôi
                          </Link>
                          <Link to="/membershipStatus"  className="cn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <Award   size={15} style={{ color: "#fbbf24", flexShrink: 0 }} /> Hạng thành viên
                          </Link>
                          <div className="cn-dropdown-divider" />
                        </>
                      )}
                      <button
                        type="button"
                        className="cn-dropdown-item danger"
                        onClick={handleLogout}
                      >
                        <LogOut size={15} style={{ flexShrink: 0 }} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login"    className="cn-btn-login">Đăng nhập</Link>
                  <Link to="/register" className="cn-btn-register">Đăng ký</Link>
                </>
              )}
            </div>

            {/* Mobile toggler */}
            <button
              type="button"
              className="cn-toggler"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>

        {/* ── BOTTOM NAV LINKS ── */}
        <nav className="cn-bottom">
          <div className="cn-bottom-inner">
            {NAV_LINKS.map(({ to, label, end }) => (
              <Link
                key={to}
                to={to}
                className={`cn-nav-link${pathActive(location.pathname, to, end) ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* ── MOBILE DRAWER ── */}
        <div className={`cn-mobile-drawer${mobileMenuOpen ? " open" : ""}`}>
          <div className="cn-mobile-inner">
            {NAV_LINKS.map(({ to, label, end }) => (
              <Link
                key={to}
                to={to}
                className={`cn-mobile-link${pathActive(location.pathname, to, end) ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            <div className="cn-mobile-divider" />

            {/* Quick actions in mobile */}
            <Link to="/movies"    className="cn-mobile-link" onClick={() => setMobileMenuOpen(false)}>🎫 Đặt vé ngay</Link>
            <Link to="/foodorder" className="cn-mobile-link" onClick={() => setMobileMenuOpen(false)}>🍿 Đặt bắp nước</Link>

            <div className="cn-mobile-divider" />

            {isLoggedIn ? (
              <>
                <div className="cn-mobile-label">Tài khoản: {displayName}</div>

                {isStaffSession && staffPortal ? (
                  <Link
                    to={staffPortal}
                    className="cn-mobile-action"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} style={{ color: "#ff2d78" }} /> Hệ thống quản trị
                  </Link>
                ) : (
                  <>
                    <Link to="/profile"            className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <User    size={18} style={{ color: "rgba(240,240,255,.5)" }} /> Hồ sơ cá nhân
                    </Link>
                    <Link to="/movieFavorite"      className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <Heart   size={18} style={{ color: "#f472b6" }} /> Phim yêu thích
                    </Link>
                    <Link to="/foodorder"          className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <Popcorn size={18} style={{ color: "#fbbf24" }} /> Đặt bắp nước
                    </Link>
                    <Link to="/transactionHistory" className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <History size={18} style={{ color: "rgba(240,240,255,.5)" }} /> Lịch sử giao dịch
                    </Link>
                    <Link to="/myVouchers"         className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <Ticket  size={18} style={{ color: "#34d399" }} /> Voucher của tôi
                    </Link>
                    <Link to="/membershipStatus"   className="cn-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                      <Award   size={18} style={{ color: "#fbbf24" }} /> Hạng thành viên
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="cn-mobile-action danger"
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="cn-mobile-link"
                  style={{ justifyContent: "center", border: "1.5px solid rgba(240,240,255,.2)", borderRadius: 10 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="cn-mobile-link"
                  style={{
                    justifyContent: "center",
                    background: "var(--yellow)",
                    color: "var(--navy)",
                    fontWeight: 800,
                    borderRadius: 10,
                    marginTop: 6,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Spacer so content isn't hidden under fixed nav */}
      <div className="cn-spacer" aria-hidden="true" />
    </>
  );
}