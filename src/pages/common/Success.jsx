import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Success = () => {
  return (
    <Layout>
      <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="card border-0 shadow-lg text-center p-5 rounded-5" style={{ maxWidth: '500px' }}>
          <div className="mb-4">
            <div className="bg-success bg-opacity-10 d-inline-block p-4 rounded-circle animate-bounce-soft">
              <i className="fas fa-check-circle fa-5x text-success"></i>
            </div>
          </div>
          <h2 className="fw-bold mb-3">Thanh toán thành công!</h2>
          <p className="text-muted mb-4">
            Vé của bạn đã được gửi tới email và lưu trong hồ sơ cá nhân. 
            Chúc bạn có những giây phút xem phim tuyệt vời!
          </p>
          
          <div className="bg-light p-3 rounded-4 mb-4 border border-dashed">
            <small className="text-uppercase text-muted fw-bold">Mã đơn hàng</small>
            <h3 className="fw-bold text-dark mt-1 tracking-widest">#TOON-8888</h3>
          </div>
          
          <div className="d-grid gap-2">
            <Link to="/" className="btn btn-gradient rounded-pill py-3 fw-bold shadow">
              VỀ TRANG CHỦ
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary rounded-pill py-2 fw-bold border-0">
              Xem vé của tôi
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Success;
