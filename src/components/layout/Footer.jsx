import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 mt-5 w-100">
      <div className="container">
        <div className="row mb-4">
          <div className="col-md-3 mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-danger p-2 rounded-3 text-white">
                <i className="fas fa-film"></i>
              </div>
              <span className="fw-black fs-4 tracking-tighter" style={{ fontWeight: 900 }}>CINETOON</span>
            </div>
            <p className="text-secondary small leading-relaxed">
              Hệ thống đặt vé xem phim hiện đại, nhanh chóng và tiện lợi nhất dành cho bạn.
            </p>
          </div>
          
          <div className="col-md-3 mb-4">
            <h5 className="fw-bold mb-4 text-uppercase small text-danger">Chính sách</h5>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Điều khoản sử dụng</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Chính sách thanh toán</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h5 className="fw-bold mb-4 text-uppercase small text-danger">Hỗ trợ</h5>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Câu hỏi thường gặp</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Phản hồi</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Liên hệ quảng cáo</a></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h5 className="fw-bold mb-4 text-uppercase small text-danger">Kết nối</h5>
            <div className="d-flex gap-3">
              <a href="#" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '35px', height: '35px' }}><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '35px', height: '35px' }}><i className="fab fa-instagram"></i></a>
              <a href="#" className="btn btn-outline-light btn-sm rounded-circle" style={{ width: '35px', height: '35px' }}><i className="fab fa-youtube"></i></a>
            </div>
          </div>
        </div>
        
        <div className="border-top border-secondary pt-4 text-center text-secondary small">
          <p>© 2026 CINETOON - DỰ ÁN TỐT NGHIỆP FPOLY. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
