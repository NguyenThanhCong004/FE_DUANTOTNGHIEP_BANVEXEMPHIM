import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Checkout = () => {
  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7 mb-4">
            <div className="alert alert-info border-0 shadow-sm rounded-4 mb-4">
              <i className="fas fa-info-circle me-2"></i> Vui lòng kiểm tra kỹ thông tin trước khi thanh toán. Đơn hàng đã mua không thể hoàn hoặc hủy.
            </div>
            
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 border-bottom pb-3">Chi tiết thanh toán</h5>
                
                <div className="d-flex align-items-center mb-4">
                  <img src="https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg" className="rounded-3 shadow-sm me-4" width="100" height="150" style={{ objectFit: 'cover' }} alt="Movie" />
                  <div>
                    <h4 className="fw-bold text-danger mb-1">AVENGERS: ENDGAME</h4>
                    <p className="mb-1 fw-bold text-muted">
                      <i className="fas fa-calendar-alt me-2"></i>19:30 - Hôm nay
                    </p>
                    <p className="mb-0 text-muted">
                      <i className="fas fa-door-open me-2"></i>Phòng: 01
                    </p>
                  </div>
                </div>

                <div className="list-group list-group-flush">
                  <div className="list-group-item px-0 d-flex justify-content-between">
                    <span className="text-muted">Vị trí ghế:</span>
                    <span className="fw-bold text-dark">E5, E6</span>
                  </div>
                  <div className="list-group-item px-0 d-flex justify-content-between">
                    <span className="text-muted">Bắp nước:</span>
                    <span className="fw-bold text-dark">Combo 1 (x1)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white sticky-top" style={{ top: '100px' }}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h6 className="text-muted text-uppercase fw-bold mb-1">Tổng cộng</h6>
                  <h2 className="display-6 fw-bold text-danger mb-0">265,000 đ</h2>
                </div>
                
                <hr className="border-dashed my-4" />
                
                <button className="btn btn-gradient w-100 rounded-pill py-3 fw-bold shadow-sm fs-5">
                  <i className="fas fa-qrcode me-2"></i>THANH TOÁN QR CODE
                </button>
                
                <div className="text-center mt-3">
                  <Link to="/booking/1" className="text-muted small text-decoration-none hover-danger">
                    <i className="fas fa-arrow-left me-1"></i> Quay lại chọn ghế
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
