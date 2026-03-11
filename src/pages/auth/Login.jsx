import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Login = () => {
  return (
    <Layout>
      <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '90vh', background: "url('https://cdn.wallpapersafari.com/24/74/zgeTuV.jpg') no-repeat center/cover", backgroundAttachment: 'fixed', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        
        <div className="card border-0 shadow-lg p-4 rounded-4 bg-white bg-opacity-10" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-4">
            <h2 className="fw-black text-white text-gradient d-inline-block tracking-tighter uppercase" style={{ fontWeight: 900 }}>ĐĂNG NHẬP</h2>
            <p className="text-light opacity-75 small fw-bold">Chào mừng bạn quay trở lại với Cinetoon!</p>
          </div>
          
          <form>
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase text-white opacity-75">Tên đăng nhập / Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-user"></i></span>
                {/* Loại bỏ nhập sẵn */}
                <input type="text" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="Nhập Username hoặc Email" />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase text-white opacity-75">Mật khẩu</label>
              <div className="input-group">
                <span className="input-group-text bg-white bg-opacity-10 border-white border-opacity-10 rounded-start-pill ps-3 text-white opacity-50" style={{ borderRight: 'none' }}><i className="fas fa-lock"></i></span>
                {/* Loại bỏ nhập sẵn */}
                <input type="password" name="password" className="form-control bg-white bg-opacity-10 border-white border-opacity-10 rounded-end-pill py-2 shadow-none text-white" style={{ borderLeft: 'none' }} placeholder="******" />
              </div>
            </div>
            
            <div className="text-end mb-4 small">
              <a href="#" className="text-decoration-none text-warning fw-bold hover-white">Quên mật khẩu?</a>
            </div>
            
            <button type="button" className="btn btn-gradient w-100 rounded-pill py-2 fw-bold shadow">ĐĂNG NHẬP</button>
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
