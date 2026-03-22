import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { clearAuthSession, getAccessToken, getStoredStaff, getStoredUser } from "../../utils/authStorage";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/movies", label: "Phim" },
  { to: "/foodorder", label: "Bắp nước" },
  { to: "/events", label: "Sự kiện" },
  { to: "/voucher", label: "Ưu đãi" },
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const token = getAccessToken();
  const staff = getStoredStaff();
  const user = getStoredUser();

  const isLoggedIn = Boolean(token);
  const isStaffSession = Boolean(staff);
  const displayName = staff?.fullname || user?.fullname || user?.username || "Tài khoản";

  const staffPortal = useMemo(() => {
    if (!staff?.role) return null;
    return staffPortalPath(staff.role);
  }, [staff]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
          scrolled
            ? "bg-zinc-950/80 backdrop-blur-md border-zinc-800/50 py-3 shadow-lg"
            : "bg-zinc-950/95 border-transparent py-4 pt-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
            >
              <div className="bg-rose-600 text-white p-1.5 rounded-lg group-hover:bg-rose-500 transition-colors">
                <Film size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CINE<span className="text-rose-500">TOON</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map(({ to, label, end }) => {
                const isActive = pathActive(location.pathname, to, end);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                      isActive ? "bg-rose-500/10 text-rose-500" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 transition-all text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-rose-500 text-zinc-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
                      <UserRound size={14} />
                    </div>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                    <ChevronDown
                      size={14}
                      className={`text-zinc-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen ? (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden py-1 z-[60] transition-opacity duration-200">
                      {isStaffSession && staffPortal ? (
                        <>
                          <Link
                            to={staffPortal}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <LayoutDashboard size={16} className="text-rose-400 shrink-0" />
                            Vào hệ thống quản trị
                          </Link>
                          <div className="h-px bg-zinc-800 my-1 mx-2" />
                        </>
                      ) : null}

                      {!isStaffSession ? (
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <User size={16} className="text-zinc-400 shrink-0" /> Hồ sơ cá nhân
                          </Link>
                          <Link
                            to="/movieFavorite"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Heart size={16} className="text-pink-500 shrink-0" /> Phim yêu thích
                          </Link>
                          <Link
                            to="/foodorder"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Popcorn size={16} className="text-amber-400 shrink-0" /> Đặt bắp nước
                          </Link>
                          <Link
                            to="/transactionHistory"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <History size={16} className="text-zinc-400 shrink-0" /> Lịch sử giao dịch
                          </Link>
                          <Link
                            to="/myVouchers"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Ticket size={16} className="text-emerald-400 shrink-0" /> Voucher của tôi
                          </Link>
                          <Link
                            to="/membershipStatus"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors no-underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Award size={16} className="text-yellow-500 shrink-0" /> Hạng thành viên
                          </Link>
                        </div>
                      ) : null}

                      <div className="h-px bg-zinc-800 my-1 mx-2" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left border-0 bg-transparent cursor-pointer"
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors no-underline">
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-full transition-colors shadow-lg shadow-rose-600/20 no-underline"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border-0 bg-transparent"
                aria-expanded={mobileMenuOpen}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[520px] border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md" : "max-h-0"
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label, end }) => {
              const isActive = pathActive(location.pathname, to, end);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`block px-4 py-3 rounded-xl text-base font-medium no-underline ${
                    isActive ? "bg-rose-500/10 text-rose-500" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            <div className="h-px bg-zinc-800 my-4" />

            {isLoggedIn ? (
              <div className="space-y-1">
                <div className="px-4 py-2 text-sm text-zinc-500 uppercase tracking-wider font-semibold">
                  Tài khoản: {displayName}
                </div>

                {isStaffSession && staffPortal ? (
                  <Link
                    to={staffPortal}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} className="text-rose-400 shrink-0" /> Hệ thống quản trị
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} className="text-zinc-400 shrink-0" /> Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/movieFavorite"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart size={18} className="text-pink-500 shrink-0" /> Phim yêu thích
                    </Link>
                    <Link
                      to="/foodorder"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Popcorn size={18} className="text-amber-400 shrink-0" /> Đặt bắp nước
                    </Link>
                    <Link
                      to="/transactionHistory"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <History size={18} className="text-zinc-400 shrink-0" /> Lịch sử giao dịch
                    </Link>
                    <Link
                      to="/myVouchers"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Ticket size={18} className="text-emerald-400 shrink-0" /> Voucher của tôi
                    </Link>
                    <Link
                      to="/membershipStatus"
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl no-underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Award size={18} className="text-yellow-500 shrink-0" /> Hạng thành viên
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-left border-0 bg-transparent cursor-pointer"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-2 pt-2">
                <Link
                  to="/login"
                  className="w-full py-3 text-center rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="w-full py-3 text-center rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-500 shadow-lg shadow-rose-600/20 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="cinema-header-spacer" aria-hidden="true" />
    </>
  );
}
