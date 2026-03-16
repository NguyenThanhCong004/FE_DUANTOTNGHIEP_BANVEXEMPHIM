import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ── Mock credentials ── */
const MOCK_STAFF = {
  "nhanvien@error404.vn": { password: "Staff@123", name: "Nguyễn Văn A", role: "Nhân Viên Bán Vé" },
  "quanly@error404.vn":   { password: "Manager@1", name: "Trần Thị B",   role: "Quản Lý Rạp" },
};

/* ── Floating particle ── */
function Particles() {
  return (
    <div className="sl-particles" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="sl-particle" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 8}s`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          opacity: 0.15 + Math.random() * 0.25,
        }} />
      ))}
    </div>
  );
}

export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const validate = () => {
    const e = {};
    if (!email.trim())    e.email = "Vui lòng nhập email nhân viên";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email không đúng định dạng";
    if (!password.trim()) e.password = "Vui lòng nhập mật khẩu";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1100));

    const staff = MOCK_STAFF[email.toLowerCase().trim()];
    if (!staff || staff.password !== password) {
      setLoading(false);
      setErrors({ form: "Email hoặc mật khẩu không đúng" });
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    setLoading(false);
    navigate("/staff/dashboard");
  };

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      }
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:   #0d0e24;
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #080916;
          --card:   rgba(14,15,38,0.96);
          --border: rgba(255,255,255,0.07);
        }

        body { background: var(--dark); }

        /* ── PAGE ── */
        .sl-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 480px;
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .sl-left {
          position: relative;
          background:
            radial-gradient(ellipse 80% 60% at 30% 40%, rgba(123,31,162,0.35) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 70% 70%, rgba(233,30,140,0.2) 0%, transparent 60%),
            #080916;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          overflow: hidden;
        }

        /* big cinema reel decoration */
        .sl-reel {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          border: 1px solid rgba(212,226,25,0.06);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: reelSpin 40s linear infinite;
        }
        .sl-reel::before {
          content: '';
          position: absolute;
          inset: 30px;
          border-radius: 50%;
          border: 1px solid rgba(233,30,140,0.08);
        }
        .sl-reel::after {
          content: '';
          position: absolute;
          inset: 80px;
          border-radius: 50%;
          border: 1px solid rgba(212,226,25,0.05);
        }
        @keyframes reelSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* reel holes */
        .sl-reel-holes {
          position: absolute;
          width: 520px;
          height: 520px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: reelSpin 40s linear infinite;
        }
        .sl-reel-hole {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid rgba(212,226,25,0.12);
          background: rgba(212,226,25,0.04);
        }

        .sl-left-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }
        .sl-brand-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 24px;
          box-shadow: 0 0 40px rgba(233,30,140,0.4), 0 0 80px rgba(123,31,162,0.2);
          animation: iconPulse 3s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(233,30,140,0.4), 0 0 80px rgba(123,31,162,0.2); }
          50%       { box-shadow: 0 0 60px rgba(233,30,140,0.65), 0 0 100px rgba(123,31,162,0.35); }
        }
        .sl-brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          letter-spacing: 6px;
          color: #fff;
          line-height: 1;
          margin-bottom: 4px;
        }
        .sl-brand-name span { color: var(--yellow); }
        .sl-brand-sub {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 40px;
        }
        .sl-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(212,226,25,0.08);
          border: 1px solid rgba(212,226,25,0.2);
          border-radius: 100px;
          padding: 8px 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--yellow);
        }

        /* feature pills */
        .sl-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 40px;
          width: 100%;
          max-width: 320px;
        }
        .sl-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          animation: featureSlide 0.5s ease both;
        }
        .sl-feature-item:nth-child(1) { animation-delay: 0.1s; }
        .sl-feature-item:nth-child(2) { animation-delay: 0.2s; }
        .sl-feature-item:nth-child(3) { animation-delay: 0.3s; }
        @keyframes featureSlide {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sl-feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(233,30,140,0.5);
        }
        .sl-feature-text {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.3px;
        }

        /* ── PARTICLES ── */
        .sl-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .sl-particle {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: var(--yellow);
          animation: particleFloat linear infinite;
        }
        @keyframes particleFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }

        /* ── RIGHT PANEL ── */
        .sl-right {
          background: var(--card);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 48px;
          position: relative;
          overflow: hidden;
        }
        .sl-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          background-size: 300%;
          animation: gradMove 5s linear infinite;
        }
        @keyframes gradMove {
          0%   { background-position: 0%; }
          100% { background-position: 300%; }
        }

        .sl-form-wrap {
          width: 100%;
          max-width: 360px;
          animation: formFadeIn 0.45s ease both;
          animation-delay: 0.15s;
        }
        @keyframes formFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sl-form-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          letter-spacing: 4px;
          color: #fff;
          margin-bottom: 4px;
        }
        .sl-form-title span { color: var(--yellow); }
        .sl-form-sub {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
          margin-bottom: 32px;
        }

        /* ── FORM ERROR ── */
        .sl-form-error {
          background: rgba(233,30,140,0.08);
          border: 1.5px solid rgba(233,30,140,0.3);
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--pink);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: errShake 0.4s ease;
        }
        .shake { animation: errShake 0.5s ease !important; }
        @keyframes errShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }

        /* ── FIELD ── */
        .sl-field { margin-bottom: 16px; }
        .sl-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 7px;
          display: block;
        }
        .sl-input-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0 4px 0 16px;
          transition: border-color 0.2s, background 0.2s;
        }
        .sl-input-wrap:focus-within {
          border-color: var(--yellow);
          background: rgba(212,226,25,0.03);
        }
        .sl-input-wrap.err { border-color: var(--pink); }

        .sl-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 13px 0;
        }
        .sl-input::placeholder { color: rgba(255,255,255,0.2); }

        .sl-field-err {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--pink);
          margin-top: 5px;
          letter-spacing: 0.3px;
        }

        /* eye btn */
        .sl-eye {
          background: none;
          border: none;
          color: rgba(255,255,255,0.2);
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          height: 46px;
        }
        .sl-eye:hover { color: var(--yellow); }

        /* ── REMEMBER + FORGOT ── */
        .sl-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sl-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .sl-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sl-checkbox.checked {
          background: var(--yellow);
          border-color: var(--yellow);
        }
        .sl-remember-txt {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
        }
        .sl-forgot {
          font-size: 12px;
          font-weight: 700;
          color: var(--yellow);
          text-decoration: none;
          letter-spacing: 0.3px;
          transition: opacity 0.2s;
        }
        .sl-forgot:hover { opacity: 0.75; color: var(--yellow); }

        /* ── LOGIN BUTTON ── */
        .sl-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 0 28px rgba(233,30,140,0.3);
          transition: box-shadow 0.25s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .sl-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .sl-btn:hover::after { transform: translateX(100%); }
        .sl-btn:hover {
          box-shadow: 0 0 44px rgba(233,30,140,0.55);
          transform: translateY(-2px);
        }
        .sl-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* spinner */
        .sl-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── DIVIDER ── */
        .sl-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .sl-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .sl-divider-txt {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.2);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* ── DEMO HINT ── */
        .sl-demo {
          background: rgba(212,226,25,0.05);
          border: 1px solid rgba(212,226,25,0.15);
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 4px;
        }
        .sl-demo-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--yellow);
          margin-bottom: 8px;
          opacity: 0.7;
        }
        .sl-demo-row {
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          line-height: 1.8;
        }
        .sl-demo-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.6);
          margin-left: 4px;
        }

        /* ── FOOTER ── */
        .sl-footer {
          position: absolute;
          bottom: 20px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.5px;
          text-align: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .sl-page { grid-template-columns: 1fr; }
          .sl-left { display: none; }
          .sl-right { border-left: none; min-height: 100vh; }
        }
      `}</style>

      <div className="sl-page">

        {/* ── LEFT PANEL ── */}
        <div className="sl-left">
          <Particles />
          <div className="sl-reel" />
          <div className="sl-reel-holes">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 360;
              const rad = (angle * Math.PI) / 180;
              const r = 240;
              return (
                <div key={i} className="sl-reel-hole" style={{
                  top: `calc(50% + ${Math.sin(rad) * r}px - 9px)`,
                  left: `calc(50% + ${Math.cos(rad) * r}px - 9px)`,
                }} />
              );
            })}
          </div>

          <div className="sl-left-content">
            <div className="sl-brand-icon">🎬</div>
            <div className="sl-brand-name">ERROR<span>404</span></div>
            <div className="sl-brand-sub">Cinema Management System</div>

            <div className="sl-portal-badge">
              <span style={{ fontSize: 14 }}>🔐</span>
              Cổng Nhân Viên
            </div>

            <div className="sl-features">
              {[
                "Quản lý bán vé & suất chiếu",
                "Theo dõi doanh thu theo ca",
                "Hỗ trợ khách hàng trực tiếp",
              ].map((txt) => (
                <div key={txt} className="sl-feature-item">
                  <div className="sl-feature-dot" />
                  <span className="sl-feature-text">{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sl-right">
          <div className="sl-form-wrap">

            <h1 className="sl-form-title">ĐĂNG <span>NHẬP</span></h1>
            <p className="sl-form-sub">Chào mừng trở lại — Hệ thống quản lý rạp phim</p>

            {/* Form error */}
            {errors.form && (
              <div className={`sl-form-error${shake ? " shake" : ""}`}>
                <span>⚠</span> {errors.form}
              </div>
            )}

            {/* Email */}
            <div className="sl-field">
              <label className="sl-label">Email Nhân Viên</label>
              <div className={`sl-input-wrap${errors.email ? " err" : ""}`}>
                <input
                  ref={emailRef}
                  className="sl-input"
                  type="email"
                  placeholder="nhanvien@error404.vn"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="username"
                />
              </div>
              {errors.email && <p className="sl-field-err">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="sl-field">
              <label className="sl-label">Mật Khẩu</label>
              <div className={`sl-input-wrap${errors.password ? " err" : ""}`} style={{ paddingRight: 0 }}>
                <input
                  className="sl-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="current-password"
                />
                <button className="sl-eye" onClick={() => setShowPw(!showPw)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && <p className="sl-field-err">{errors.password}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="sl-row-between">
              <label className="sl-remember" onClick={() => setRemember(!remember)}>
                <div className={`sl-checkbox${remember ? " checked" : ""}`}>
                  {remember && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0f102a" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className="sl-remember-txt">Ghi nhớ đăng nhập</span>
              </label>
              <a href="/forgot-password" className="sl-forgot">Quên mật khẩu?</a>
            </div>

            {/* Submit */}
            <button
              className="sl-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><div className="sl-spinner" /> Đang xác thực...</>
              ) : (
                <><span>Đăng Nhập</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="sl-divider">
              <div className="sl-divider-line" />
              <span className="sl-divider-txt">Tài khoản demo</span>
              <div className="sl-divider-line" />
            </div>

            {/* Demo credentials */}
            <div className="sl-demo">
              <div className="sl-demo-title">🔑 Tài khoản thử nghiệm</div>
              <div className="sl-demo-row">
                Nhân viên: <span className="sl-demo-val">nhanvien@error404.vn</span>
              </div>
              <div className="sl-demo-row">
                Mật khẩu: <span className="sl-demo-val">Staff@123</span>
              </div>
              <div style={{ height: 6 }} />
              <div className="sl-demo-row">
                Quản lý: <span className="sl-demo-val">quanly@error404.vn</span>
              </div>
              <div className="sl-demo-row">
                Mật khẩu: <span className="sl-demo-val">Manager@1</span>
              </div>
            </div>

          </div>

          <div className="sl-footer">© 2025 ERROR404 Cinema · Hệ thống nội bộ</div>
        </div>

      </div>
    </>
  );
}