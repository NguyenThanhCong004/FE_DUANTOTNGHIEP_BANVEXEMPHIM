import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { apiUrl } from '../../utils/apiClient';
import { AUTH } from '../../constants/apiEndpoints';
import { STRONG_PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from '../../utils/passwordValidation';

const Register = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = async () => {
    setError("");
    setFieldErrors({});

    const errors = {};

    if (!password || !password.trim()) {
      errors.password = "Mật khẩu không được để trống";
    } else if (!STRONG_PASSWORD_REGEX.test(password)) {
      errors.password = PASSWORD_RULE_MESSAGE;
    }

    if (!fullname || !fullname.trim()) {
      errors.fullname = "Họ và tên không được để trống";
    }

    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/i;
    if (!email || !email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!emailRegex.test(email)) {
      errors.email = "Email phải đúng định dạng Gmail (vd: abc@gmail.com)";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phone.trim()) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại phải có 10 chữ số";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const res = await fetch(apiUrl(AUTH.REGISTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password.trim(),
          fullname: fullname.trim(),
          email: email.trim(),
          phone: phone.replace(/\s/g, ""),
          birthday: null,
          avatar: null,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || "Đăng ký thất bại";

        if (message.includes("Mật khẩu không được để trống")) {
          setFieldErrors({ password: "Mật khẩu không được để trống" });
        } else if (message.includes("Mật khẩu phải có ít nhất")
            || message.includes("Mật khẩu phải chứa")) {
          setFieldErrors({ password: PASSWORD_RULE_MESSAGE });
        } else if (message.includes("Họ tên không được để trống")) {
          setFieldErrors({ fullname: "Họ tên không được để trống" });
        } else if (message.includes("Email không được để trống")) {
          setFieldErrors({ email: "Email không được để trống" });
        } else if (message.includes("Email không đúng định dạng")) {
          setFieldErrors({ email: "Email không đúng định dạng" });
        } else if (message.includes("Email đã tồn tại")) {
          setFieldErrors({ email: "Email đã tồn tại" });
        } else if (message.includes("Số điện thoại đã tồn tại")) {
          setFieldErrors({ phone: "Số điện thoại đã tồn tại" });
        } else if (message.includes("Số điện thoại không hợp lệ")) {
          setFieldErrors({ phone: "Số điện thoại không hợp lệ" });
        } else {
          setError(message);
        }
        return;
      }

      navigate("/login", {
        replace: true,
        state: { fromRegister: true, message: "Đăng ký thành công. Vui lòng đăng nhập." },
      });
    } catch {
      setError("Không thể kết nối tới server");
    }
  };

  const handleFieldChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
    switch (field) {
      case 'password': setPassword(value); break;
      case 'fullname': setFullname(value); break;
      case 'email':    setEmail(value);    break;
      case 'phone':    setPhone(value);    break;
      default: break;
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
          max-width: 520px;
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

        .auth-label .req {
          color: var(--pink);
          margin-left: 2px;
        }

        .auth-input-group {
          display: flex;
          align-items: stretch;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color .3s, box-shadow .3s;
          min-height: 48px;
          height: 48px;
          box-sizing: border-box;
        }

        .auth-input-group:focus-within {
          border-color: var(--yellow);
          box-shadow: 0 0 18px rgba(212,255,0,0.12);
        }

        .auth-input-group.has-error {
          border-color: rgba(255,45,120,0.5);
        }

        .auth-input-icon {
          background: rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.08);
          width: 46px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
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
          height: 100%;
          min-width: 0;
          box-sizing: border-box;
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
          height: 100%;
          cursor: pointer;
        }
        .auth-eye-btn:hover { color: var(--yellow); }

        .auth-field {
          margin-bottom: 20px;
          min-width: 0;
        }

        .auth-field-error {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--pink);
          margin-top: 6px;
          display: block;
        }

        .auth-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          align-items: start;
        }

        @media (max-width: 560px) {
          .auth-card { padding: 28px 20px; }
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
          transition: box-shadow .25s, transform .25s;
          box-shadow: 0 0 24px rgba(255,45,120,0.3);
        }

        .auth-btn-primary:hover {
          box-shadow: 0 0 40px rgba(255,45,120,0.55);
          transform: translateY(-1px);
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
          <h2 className="auth-title">Tạo Tài Khoản</h2>
          <p className="auth-subtitle">Đăng ký để nhận nhiều ưu đãi hấp dẫn</p>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Họ và tên <span className="req">*</span></label>
                <div className={`auth-input-group${fieldErrors.fullname ? ' has-error' : ''}`}>
                  <span className="auth-input-icon"><i className="fas fa-id-card" /></span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Nhập họ và tên"
                    value={fullname}
                    onChange={(e) => handleFieldChange('fullname', e.target.value)}
                  />
                </div>
                {fieldErrors.fullname && <span className="auth-field-error">{fieldErrors.fullname}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label">Email <span className="req">*</span></label>
                <div className={`auth-input-group${fieldErrors.email ? ' has-error' : ''}`}>
                  <span className="auth-input-icon"><i className="fas fa-envelope" /></span>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Số điện thoại <span className="req">*</span></label>
                <div className={`auth-input-group${fieldErrors.phone ? ' has-error' : ''}`}>
                  <span className="auth-input-icon"><i className="fas fa-phone" /></span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                </div>
                {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
              </div>

            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Mật khẩu <span className="req">*</span></label>
                <div className={`auth-input-group${fieldErrors.password ? ' has-error' : ''}`}>
                  <span className="auth-input-icon"><i className="fas fa-lock" /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="auth-input"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
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
                {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn-primary">
              Đăng Ký Ngay
            </button>
          </form>

          <div className="auth-footer">
            Đã có tài khoản?{" "}
            <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
