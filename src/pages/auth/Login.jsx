import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { clearAuthSession, setAuthSession } from '../../utils/authStorage';
import { apiUrl } from '../../utils/apiClient';
import { AUTH } from '../../constants/apiEndpoints';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem('fe_admin_cinema_error');
    if (stored) {
      setError(stored);
      sessionStorage.removeItem('fe_admin_cinema_error');
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch(apiUrl(AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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

      /* Có staff → ưu tiên điều hướng nội bộ (admin / super-admin / ca làm) */
      if (data.staff) {
        setAuthSession({
          accessToken: data.token,
          refreshToken: data.refreshToken,
          user: data.user || null,
          staff: data.staff || null,
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
        navigate("/staff/ca-lam");
        return;
      }

      /* Chỉ khách hàng */
      if (data.user) {
        setAuthSession({
          accessToken: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
          staff: null,
        });
        const redirectTo = location.state?.from;
        navigate(typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/profile", {
          replace: true,
        });
        return;
      }

      setError("Không nhận được thông tin tài khoản.");
      clearAuthSession();
    } catch {
      setError("Không thể kết nối tới server");
    }
  };

  return (
    <Layout>
      <div className="auth-public-page d-flex align-items-center justify-content-center py-5" style={{ minHeight: '90vh', background: "url('https://cdn.wallpapersafari.com/24/74/zgeTuV.jpg') no-repeat center/cover", backgroundAttachment: 'fixed', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        
        <div className="card border-0 shadow-lg p-4 rounded-4 bg-white bg-opacity-10" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-4">
            <h2 className="fw-black text-white text-gradient d-inline-block tracking-tighter uppercase mb-0" style={{ fontWeight: 900 }}>ĐĂNG NHẬP</h2>
          </div>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase text-white opacity-75">Tên đăng nhập / Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-user"></i></span>
                <input
                  type="text"
                  className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white"
                  style={{ borderLeft: 'none' }}
                  placeholder="Nhập Username hoặc Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase text-white opacity-75">Mật khẩu</label>
              <div className="input-group">
                <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-lock"></i></span>
                <input
                  type="password"
                  name="password"
                  className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white"
                  style={{ borderLeft: 'none' }}
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className="text-end mb-4 small">
              <a href="/forgetPassword" className="text-decoration-none text-warning fw-bold hover-white">Quên mật khẩu?</a>
            </div>
            
            {error && (
              <p style={{ color: "#ff6b6b", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-gradient w-100 rounded-pill py-2 fw-bold shadow" disabled={!username || !password}>
              ĐĂNG NHẬP
            </button>
          </form>
          
          <div className="text-center mt-4 small text-white fw-bold">
            Chưa có tài khoản? <Link to="/register" className="fw-bold text-warning text-decoration-none hover-white">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
