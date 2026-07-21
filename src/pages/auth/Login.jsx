import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { clearAuthSession, setAuthSession, setActiveShift } from '../../utils/authStorage';
import { apiUrl } from '../../utils/apiClient';
import { AUTH, SHIFTS } from '../../constants/apiEndpoints';

const Login = ({ mode = "user" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStaffLogin = mode === "staff";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const registerMessage = location.state?.message;
    if (registerMessage) return registerMessage;
    const authErrorMessage = sessionStorage.getItem('authErrorMessage');
    if (authErrorMessage) {
      sessionStorage.removeItem('authErrorMessage');
      return authErrorMessage;
    }
    const stored = sessionStorage.getItem('fe_admin_cinema_error');
    if (stored) {
      sessionStorage.removeItem('fe_admin_cinema_error');
      return stored;
    }
    return "";
  });

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleLogin = async () => {
    const rawLoginName = username.trim();
    const loginName = !isStaffLogin && !rawLoginName.includes("@")
      ? rawLoginName.replace(/\s/g, "")
      : rawLoginName;
    if (loading || !loginName || !password) return;
    if (!isStaffLogin && !loginName.includes("@") && !/^[0-9]{10}$/.test(loginName)) {
      setError("Vui lòng nhập email hoặc số điện thoại hợp lệ");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl(isStaffLogin ? AUTH.STAFF_LOGIN : AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginName, account: loginName, password }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || "Đăng nhập thất bại");
        return;
      }

      const data = json?.data;
      if (!data?.token) {
        setError(json?.message || "Không nhận được token");
        return;
      }

      const roleUpper = (data?.staff?.role ?? "").toString().toUpperCase().replace(/^ROLE_/, "");

      if (isStaffLogin) {
        if (!data.staff) {
          setError("Không nhận được thông tin nhân viên.");
          clearAuthSession();
          return;
        }
        clearAuthSession();
        setAuthSession({
          accessToken: data.token,
          refreshToken: data.refreshToken,
          user: null,
          staff: data.staff,
        });

        if (roleUpper === "ADMIN") {
          if (data?.staff?.cinemaId == null) {
            setError("Tài khoản ADMIN chưa được gán rạp (cinemaId = null). Không thể quản lý rạp.");
            clearAuthSession();
            return;
          }
          navigate("/admin");
          return;
        }
        if (roleUpper === "SUPER_ADMIN") {
          navigate("/super-admin");
          return;
        }
        
        // Logic cho STAFF (Nhân viên sàn)
        try {
          const shiftRes = await fetch(apiUrl(SHIFTS.ACTIVE), {
            headers: { "Authorization": `Bearer ${data.token}` },
          });
          const shiftJson = await shiftRes.json().catch(() => null);
          const activeShift = shiftJson?.data; // Có thể null nếu không trong ca
          
          setActiveShift(activeShift || null);

          if (activeShift) {
            navigate("/staff/sales");
          } else {
            navigate("/staff/shifts");
          }
        } catch (err) {
          console.error("Lỗi kiểm tra ca làm:", err);
          navigate("/staff/shifts");
        }
        return;
      }

      if (data.staff) {
        setError("Tài khoản nhân viên vui lòng đăng nhập ở trang dành cho staff.");
        clearAuthSession();
        return;
      }

      if (data.user) {
        clearAuthSession();
        setAuthSession({
          accessToken: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
          staff: null,
        });
        const redirectTo = location.state?.from;
        navigate(typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/", {
          replace: true,
        });
        return;
      }

      setError("Không nhận được thông tin tài khoản.");
      clearAuthSession();
    } catch {
      setError("Không thể kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
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

        .auth-page-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          background: var(--navy);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,255,0,0.15);
          border-radius: 20px;
          padding: 40px 36px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 0 60px rgba(139,0,255,0.15), 0 0 0 1px rgba(255,45,120,0.06);
        }

        .auth-strip {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          border-radius: 2px;
          margin: 0 auto 24px;
        }

        .auth-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          letter-spacing: 4px;
          color: var(--off-white);
          text-align: center;
          margin: 0 0 4px;
          line-height: 1;
        }

        .auth-subtitle {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(212,255,0,0.6);
          text-align: center;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 0 0 32px;
        }

        .auth-label {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(240,240,255,0.5);
          display: block;
          margin-bottom: 8px;
        }

        .auth-input-group {
          display: flex;
          align-items: stretch;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color .3s, box-shadow .3s;
          margin-bottom: 4px;
        }

        .auth-input-group:focus-within {
          border-color: var(--yellow);
          box-shadow: 0 0 18px rgba(212,255,0,0.12);
        }

        .auth-input-icon {
          background: rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 0 14px;
          display: flex;
          align-items: center;
          color: rgba(240,240,255,0.35);
          flex-shrink: 0;
          font-size: 14px;
        }

        .auth-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: none;
          outline: none;
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          padding: 11px 14px;
          min-width: 0;
          transition: background .3s;
        }

        .auth-input::placeholder {
          color: rgba(240,240,255,0.25);
        }

        .auth-input:focus {
          background: rgba(212,255,0,0.03);
        }

        .auth-eye-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          border-left: 1px solid rgba(255,255,255,0.08);
          color: rgba(240,240,255,0.4);
          min-width: 44px;
          cursor: pointer;
        }
        .auth-eye-btn:hover { color: var(--yellow); }

        .auth-field {
          margin-bottom: 20px;
        }

        .auth-forgot {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--pink);
          text-decoration: none;
          display: block;
          text-align: right;
          margin-bottom: 24px;
          letter-spacing: 0.3px;
          transition: color .25s;
        }

        .auth-forgot:hover {
          color: var(--yellow);
        }

        .auth-error {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--pink);
          text-align: center;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(255,45,120,0.08);
          border: 1px solid rgba(255,45,120,0.2);
          border-radius: 8px;
        }

        .auth-btn-primary {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: box-shadow .25s, transform .25s, opacity .25s;
          box-shadow: 0 0 24px rgba(255,45,120,0.3);
        }

        .auth-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 40px rgba(255,45,120,0.55);
          transform: translateY(-1px);
        }

        .auth-btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .auth-footer {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.5);
          text-align: center;
          margin-top: 24px;
        }

        .auth-footer a {
          color: var(--yellow);
          font-weight: 800;
          text-decoration: none;
          transition: color .25s;
        }

        .auth-footer a:hover {
          color: var(--pink);
        }
      `}</style>

      <div className="auth-page-wrapper">
        <div className="auth-card">
          <div className="auth-strip" />
          <h2 className="auth-title">{isStaffLogin ? "Đăng Nhập Staff" : "Đăng Nhập"}</h2>
          <p className="auth-subtitle">{isStaffLogin ? "Khu vực nhân viên" : "Chào mừng trở lại"}</p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="auth-field">
              <label className="auth-label">{isStaffLogin ? "Email / SĐT nhân viên" : "Email / Số điện thoại"}</label>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="fas fa-user" /></span>
                <input
                  type="text"
                  className="auth-input"
                  placeholder={isStaffLogin ? "Nhập email hoặc SĐT staff" : "Nhập email hoặc số điện thoại"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Mật khẩu</label>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="fas fa-lock" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="auth-input"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>

            <Link to={isStaffLogin ? "/staff/forgetPassword" : "/forgetPassword"} className="auth-forgot">Quên mật khẩu?</Link>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading || !username.trim() || !password}
            >
              Đăng Nhập
            </button>
          </form>

          <div className="auth-footer">
            {isStaffLogin ? (
              <>
                Khách hàng? <Link to="/login">Đăng nhập khách hàng</Link>
              </>
            ) : (
              <>
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                <br />
                Nhân viên? <Link to="/staff/login">Đăng nhập staff</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
