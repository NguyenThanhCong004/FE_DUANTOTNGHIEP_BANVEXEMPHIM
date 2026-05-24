import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { LogOut, Calendar, LayoutDashboard, ShoppingCart, Clock, MapPin, ChevronDown, User } from "lucide-react";
import { clearAuthSession, getStoredStaff, getActiveShift } from "../../utils/authStorage";
import { formatDate, formatTime } from "../../utils/formatters";
import "../../styles/admin-shell.css";

export default function EmployeeSelfServiceLayout() {
  const navigate = useNavigate();
  const staff = getStoredStaff();
  const activeShift = getActiveShift();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const name = staff?.fullName || staff?.fullname || staff?.username || "Nhân viên";
  const cinemaName = activeShift?.cinemaName || staff?.cinemaName || "Đang tải rạp...";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const logout = () => {
    clearAuthSession();
    navigate("/staff/login", { replace: true });
  };

  return (
    <div className="employee-self-shell">
      {/* Header Staff chuẩn */}
      <header className="employee-self-header">
        <div className="header-left">
          <div className="brand-logo">
            <div className="logo-icon">C</div>
            <div className="logo-text">
              <span className="brand-name">CINETOON</span>
              <span className="brand-tag">STAFF</span>
            </div>
          </div>
          <div className="divider-v" />
          
          <div className="header-info-group">
            <div className="info-item">
              <MapPin size={16} className="text-info" />
              <span className="info-text cinema-name-highlight">{cinemaName}</span>
            </div>
            <div className="info-item">
              <Clock size={16} className="text-warning" />
              <div className="time-display">
                <span className="clock-time">{formatTime(currentTime, { second: '2-digit' })}</span>
                <span className="clock-date">{formatDate(currentTime, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="user-text">
              <span className="user-name">{name}</span>
              <span className="user-role">
                {activeShift ? activeShift.role : (staff?.role ? String(staff.role).replace(/^ROLE_/i, "") : "Nhân viên")}
              </span>
            </div>
            <div className="user-avatar">
              <User size={20} />
            </div>
            <ChevronDown size={16} className={`chevron ${isMenuOpen ? 'open' : ''}`} />

            {isMenuOpen && (
              <>
                <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />
                <div className="dropdown-menu-custom">
                  <div className="dropdown-header">Chức năng hệ thống</div>
                  {activeShift && (
                    <>
                      <NavLink to="/staff/sales" className="dropdown-item-custom" onClick={() => setIsMenuOpen(false)}>
                        <ShoppingCart size={16} />
                        <span>Bán hàng POS</span>
                      </NavLink>
                      <NavLink to="/staff/dashboard" className="dropdown-item-custom" onClick={() => setIsMenuOpen(false)}>
                        <LayoutDashboard size={16} />
                        <span>Bàn làm việc</span>
                      </NavLink>
                    </>
                  )}
                  <NavLink to="/staff/ca-lam" className="dropdown-item-custom" onClick={() => setIsMenuOpen(false)}>
                    <Calendar size={16} />
                    <span>Lịch ca làm</span>
                  </NavLink>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item-custom text-danger" onClick={logout}>
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content sát khít với Header */}
      <main className="employee-self-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, margin: 0 }}>
        {!activeShift && (
          <div className="alert-outside">
            <i className="fas fa-info-circle me-2"></i>
            Hệ thống đang ở chế độ <b>Ngoài ca</b>. Bạn chỉ có thể xem lịch làm việc.
          </div>
        )}
        <div className="outlet-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, margin: 0 }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .employee-self-shell { 
          height: 100vh; 
          display: flex; 
          flex-direction: column; 
          background: #0f172a; 
          color: #e2e8f0; 
          overflow: hidden; 
          gap: 0; /* Ép không có khoảng cách giữa header và main */
        }

        .employee-self-header {
          flex-shrink: 0;
          height: 64px;
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          padding: 0 24px; 
          border-bottom: 1px solid rgba(148,163,184,0.1);
          background: #1e293b; 
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          margin: 0; /* Đảm bảo không có margin ngoài */
        }

        .header-left { display: flex; align-items: center; gap: 20px; }
        .brand-logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { 
          width: 32px; height: 32px; background: linear-gradient(135deg, #38bdf8, #818cf8); 
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 900; font-size: 18px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
        }
        .logo-text { display: flex; flex-direction: column; line-height: 1; }
        .brand-name { font-weight: 900; font-size: 16px; color: #f8fafc; letter-spacing: 1px; }
        .brand-tag { font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 2px; margin-top: 2px; }

        .divider-v { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }
        .header-info-group { display: flex; align-items: center; gap: 24px; }
        .info-item { display: flex; align-items: center; gap: 10px; }
        .info-text { font-weight: 700; font-size: 14px; color: #f1f5f9; }
        .cinema-name-highlight { color: #38bdf8; }
        
        .time-display { display: flex; flex-direction: column; line-height: 1.1; }
        .clock-time { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 15px; color: #fbbf24; }
        .clock-date { font-size: 10px; color: #94a3b8; text-transform: capitalize; font-weight: 600; }

        .header-right { position: relative; }
        .user-profile { 
          display: flex; align-items: center; gap: 12px; 
          padding: 6px 12px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .user-profile:hover { background: rgba(255,255,255,0.08); }
        .user-text { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.3; }
        .user-name { font-weight: 700; font-size: 14px; color: #f8fafc; }
        .user-role { font-size: 11px; color: #38bdf8; font-weight: 600; text-transform: uppercase; }
        .user-avatar { 
          width: 36px; height: 36px; border-radius: 10px; 
          background: #334155; display: flex; align-items: center; justify-content: center;
          color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);
        }
        .chevron { transition: transform 0.2s; color: #64748b; }
        .chevron.open { transform: rotate(180deg); }

        .dropdown-menu-custom {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 220px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          overflow: hidden; animation: slideDown 0.2s ease-out; z-index: 2000;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-header { 
          padding: 12px 16px; font-size: 11px; font-weight: 800; 
          color: #64748b; text-transform: uppercase; letter-spacing: 1px;
          background: rgba(0,0,0,0.1);
        }
        .dropdown-item-custom {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600;
          transition: all 0.2s; border: none; background: transparent; width: 100%; text-align: left;
        }
        .dropdown-item-custom:hover { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
        .dropdown-item-custom.active { background: #334155; color: #38bdf8; }
        .dropdown-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }
        
        .menu-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1500; }
        
        .employee-self-main { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          overflow: hidden; 
          padding: 0; 
          margin: 0;
        }

        .alert-outside {
          background: rgba(14, 165, 233, 0.1); 
          color: #7dd3fc; 
          font-size: 13px; 
          padding: 8px 24px;
          border-bottom: 1px solid rgba(56, 189, 248, 0.2);
          flex-shrink: 0;
          margin: 0;
        }

        .outlet-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
