import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale/vi';

const Register = () => {
  const [startDate, setStartDate] = useState(null);

  return (
    <Layout>
      <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '90vh', background: "url('https://cdn.wallpapersafari.com/24/74/zgeTuV.jpg') no-repeat center/cover", backgroundAttachment: 'fixed', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        
        <div className="card border-0 shadow-lg p-4 rounded-4 bg-white bg-opacity-10" style={{ width: '100%', maxWidth: '650px', position: 'relative', zIndex: 1, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-4">
            <h2 className="fw-black text-white text-gradient d-inline-block tracking-tighter uppercase" style={{ fontWeight: 900 }}>TẠO TÀI KHOẢN</h2>
            <p className="text-light opacity-75 small fw-bold">Đăng ký để nhận nhiều ưu đãi và đặt vé nhanh chóng.</p>
          </div>
          
          <form>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Tên đăng nhập <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-user"></i></span>
                  <input type="text" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="Nhập tên đăng nhập" />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Mật khẩu <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-lock"></i></span>
                  <input type="password" name="password" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="******" />
                </div>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Họ và tên <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-id-card"></i></span>
                  <input type="text" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="Nhập họ và tên" />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Email <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-envelope"></i></span>
                  <input type="email" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="example@email.com" />
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Số điện thoại <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-phone"></i></span>
                  <input type="text" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="09xxxxxxxx" />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-white opacity-75">Ngày sinh <span className="text-danger">*</span></label>
                <div className="input-group modern-datepicker">
                  <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-calendar-alt"></i></span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    locale={vi}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Chọn ngày sinh"
                    className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white"
                    maxDate={new Date()}
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                  />
                </div>
              </div>
            </div>
            
            <button type="button" className="btn btn-gradient w-100 rounded-pill py-2 fw-bold shadow">ĐĂNG KÝ NGAY</button>
          </form>
          
          <div className="text-center mt-4 small text-white fw-bold">
            Đã có tài khoản? <Link to="/login" className="fw-bold text-warning text-decoration-none hover-white">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>

      <style>{`
        .modern-datepicker .react-datepicker-wrapper { flex: 1; }
        .react-datepicker { background-color: #1e1b4b; border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; overflow: hidden; }
        .react-datepicker__header { background-color: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker__day { color: white !important; }
        .react-datepicker__day:hover, .react-datepicker__day--selected { background-color: #FF6B6B !important; border-radius: 50%; }
      `}</style>
    </Layout>
  );
};

export default Register;
