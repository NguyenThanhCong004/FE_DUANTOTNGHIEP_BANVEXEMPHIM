import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale/vi';
import { clearAuthSession, setAuthSession } from '../../utils/authStorage';

import { apiUrl } from '../../utils/apiClient';
import { AUTH } from '../../constants/apiEndpoints';

function formatLocalDate(date) {
  if (!date) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const Register = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = async () => {
    setError("");
    setFieldErrors({});
    
    // Validate từng field trước khi gọi API
    const errors = {};
    
    if (!username || !username.trim()) {
      errors.username = "Tên đăng nhập không được để trống";
    } else if (username.length < 4) {
      errors.username = "Tên đăng nhập phải từ 4 đến 50 ký tự";
    } else if (username.length > 50) {
      errors.username = "Tên đăng nhập phải từ 4 đến 50 ký tự";
    }
    
    if (!password || !password.trim()) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
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
    
    if (!startDate) {
      errors.birthday = "Vui lòng chọn ngày sinh";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const birthday = formatLocalDate(startDate);
      const res = await fetch(apiUrl(AUTH.REGISTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          fullname: fullname.trim(),
          email: email.trim(),
          phone: phone.replace(/\s/g, ""),
          birthday,
          avatar: null,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || "Đăng ký thất bại";
        
        // Map lỗi validation từ @Valid annotations và business logic
        if (message.includes("Tên đăng nhập không được để trống")) {
          setFieldErrors({ username: "Tên đăng nhập không được để trống" });
        } else if (message.includes("Tên đăng nhập phải từ 4 đến 50 ký tự")) {
          setFieldErrors({ username: "Tên đăng nhập phải từ 4 đến 50 ký tự" });
        } else if (message.includes("Tên đăng nhập đã tồn tại")) {
          setFieldErrors({ username: "Tên đăng nhập đã tồn tại" });
        } else if (message.includes("Mật khẩu không được để trống")) {
          setFieldErrors({ password: "Mật khẩu không được để trống" });
        } else if (message.includes("Mật khẩu phải có ít nhất 6 ký tự")) {
          setFieldErrors({ password: "Mật khẩu phải có ít nhất 6 ký tự" });
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
        } else if (message.includes("Tên đăng nhập không hợp lệ")) {
          setFieldErrors({ username: "Tên đăng nhập không hợp lệ" });
        } else {
          setError(message);
        }
        return;
      }

      const data = json?.data;
      if (!data?.token) {
        setError(json?.message || "Không nhận được token");
        return;
      }

      clearAuthSession();
      setAuthSession({
        accessToken: data.token,
        refreshToken: data.refreshToken,
        user: data.user || null,
        staff: null,
      });
      navigate("/profile");
    } catch {
      setError("Không thể kết nối tới server");
    }
  };

  const handleFieldChange = (field, value) => {
    // Clear error khi user thay đổi giá trị
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) {
      setError('');
    }
    
    // Set value tương ứng
    switch(field) {
      case 'username': setUsername(value); break;
      case 'password': setPassword(value); break;
      case 'fullname': setFullname(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhone(value); break;
      default: break;
    }
  };

  return (
    <Layout>
      <div className="auth-public-page auth-public-page--navbar">
        <div
          className="card border-0 shadow-lg p-4 rounded-4 bg-white bg-opacity-10 backdrop-blur-md"
          style={{ width: "100%", maxWidth: "650px" }}
        >
          <div className="text-center mb-4">
            <h2 className="fw-black text-white text-gradient d-inline-block tracking-tighter uppercase" style={{ fontWeight: 900 }}>TẠO TÀI KHOẢN</h2>
            <p className="text-light opacity-75 small fw-bold">Đăng ký để nhận nhiều ưu đãi và đặt vé nhanh chóng.</p>
          </div>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
          >
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Tên đăng nhập <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-user"></i></span>
                  <input
                    type="text"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.username ? 'border border-danger' : ''}`}
                    style={{ borderLeft: 'none' }}
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                  />
                </div>
                {fieldErrors.username && (
                  <div className="text-danger small mt-1">{fieldErrors.username}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Mật khẩu <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-lock"></i></span>
                  <input
                    type="password"
                    name="password"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.password ? 'border border-danger' : ''}`}
                    style={{ borderLeft: 'none' }}
                    placeholder="******"
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                  />
                </div>
                {fieldErrors.password && (
                  <div className="text-danger small mt-1">{fieldErrors.password}</div>
                )}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Họ và tên <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-id-card"></i></span>
                  <input
                    type="text"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.fullname ? 'border border-danger' : ''}`}
                    style={{ borderLeft: 'none' }}
                    placeholder="Nhập họ và tên"
                    value={fullname}
                    onChange={(e) => handleFieldChange('fullname', e.target.value)}
                  />
                </div>
                {fieldErrors.fullname && (
                  <div className="text-danger small mt-1">{fieldErrors.fullname}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Email <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-envelope"></i></span>
                  <input
                    type="email"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.email ? 'border border-danger' : ''}`}
                    style={{ borderLeft: 'none' }}
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
                {fieldErrors.email && (
                  <div className="text-danger small mt-1">{fieldErrors.email}</div>
                )}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Số điện thoại <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-phone"></i></span>
                  <input
                    type="text"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.phone ? 'border border-danger' : ''}`}
                    style={{ borderLeft: 'none' }}
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                </div>
                {fieldErrors.phone && (
                  <div className="text-danger small mt-1">{fieldErrors.phone}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white">Ngày sinh <span className="text-danger">*</span></label>
                <div className="input-group modern-datepicker">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white" style={{ borderRight: 'none' }}><i className="fas fa-calendar-alt"></i></span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      if (fieldErrors.birthday) {
                        setFieldErrors(prev => ({ ...prev, birthday: '' }));
                      }
                      if (error) {
                        setError('');
                      }
                    }}
                    locale={vi}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Chọn ngày sinh"
                    className={`form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white ${fieldErrors.birthday ? 'border border-danger' : ''}`}
                    maxDate={new Date()}
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                  />
                </div>
                {fieldErrors.birthday && (
                  <div className="text-danger small mt-1">{fieldErrors.birthday}</div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-center fw-bold mb-3 text-rose-400 small">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-gradient w-100 rounded-pill py-2 fw-bold shadow"
            >
              ĐĂNG KÝ NGAY
            </button>
          </form>
          
          <div className="text-center mt-4 small text-white fw-bold">
            Đã có tài khoản?{" "}
            <Link to="/login" className="fw-bold text-rose-400 text-decoration-none hover:text-white">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .modern-datepicker .react-datepicker-wrapper { flex: 1; }
        .react-datepicker { background-color: #18181b; border: 1px solid rgba(63,63,70,0.9); border-radius: 15px; overflow: hidden; }
        .react-datepicker__header { background-color: #09090b; border-bottom: 1px solid rgba(63,63,70,0.6); }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker__day { color: white !important; }
        .react-datepicker__day:hover, .react-datepicker__day--selected { background-color: #e11d48 !important; border-radius: 50%; }
        
        /* Đảm bảo icon trong input có màu trắng */
        .input-group-text i {
          color: white !important;
        }
        .input-group-text .fas,
        .input-group-text .fa {
          color: white !important;
        }
      `}</style>
    </Layout>
  );
};

export default Register;
