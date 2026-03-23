import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <>
      <footer className="cinema-footer">
        <div className="footer-accent-strip" />

        <Container className="py-5" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── STATS ROW ── */}
          <div className="footer-stats">
            <div className="footer-stat">
              <div className="footer-stat-number">200+</div>
              <div className="footer-stat-label">Phim chiếu</div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat-number">50K+</div>
              <div className="footer-stat-label">Người dùng</div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat-number">20+</div>
              <div className="footer-stat-label">Rạp chiếu</div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat-number">4.9★</div>
              <div className="footer-stat-label">Đánh giá</div>
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <Row className="g-5">

            {/* COL 1 — Brand */}
            <Col lg={4} md={6}>
              <Link to="/" className="d-flex align-items-center gap-2 mb-3 text-decoration-none">
                <div className="footer-logo-icon">🎬</div>
                <span className="footer-logo-text">CINE<span>TOON</span></span>
              </Link>
              <p className="text-zinc-400 small mb-4" style={{ lineHeight: 1.8 }}>
                Hệ thống đặt vé xem phim hiện đại, nhanh chóng và tiện lợi nhất Việt Nam.
                Trải nghiệm điện ảnh đỉnh cao với công nghệ ghế ngồi thông minh và âm thanh vòm.
              </p>

              {/* Social */}
              <div className="footer-heading">Kết nối</div>
              <div className="d-flex gap-2 mb-4">
                <a href="#" className="footer-social-btn social-fb" title="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="#" className="footer-social-btn social-ig" title="Instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href="#" className="footer-social-btn social-yt" title="YouTube">
                  <i className="fab fa-youtube" />
                </a>
                <a href="#" className="footer-social-btn social-tt" title="TikTok">
                  <i className="fab fa-tiktok" />
                </a>
              </div>

              {/* App download */}
              {/* <div className="d-flex gap-2">
                <a href="#" className="app-badge">
                  <span className="app-badge-icon">🍎</span>
                  <span className="app-badge-text">
                    <span className="app-badge-label">Tải trên</span>
                    <span className="app-badge-store">App Store</span>
                  </span>
                </a>
                <a href="#" className="app-badge">
                  <span className="app-badge-icon">🤖</span>
                  <span className="app-badge-text">
                    <span className="app-badge-label">Tải trên</span>
                    <span className="app-badge-store">Google Play</span>
                  </span>
                </a>
              </div> */}
            </Col>

            {/* COL 2 — Chính sách + Hỗ trợ */}
            <Col lg={2} md={3} sm={6}>
              <div className="footer-heading">Chính sách</div>
              <ul className="list-unstyled mb-4">
                <li><a href="#" className="footer-link">Điều khoản sử dụng</a></li>
                <li><a href="#" className="footer-link">Chính sách thanh toán</a></li>
                <li><a href="#" className="footer-link">Chính sách bảo mật</a></li>
                <li><a href="#" className="footer-link">Hoàn vé & đổi vé</a></li>
                <li><a href="#" className="footer-link">Quy định rạp chiếu</a></li>
              </ul>

              <div className='m-top'>
                <div className="footer-heading">Hỗ trợ</div>
                <ul className="list-unstyled">
                  <li><Link to="/contact" className="footer-link">Liên hệ</Link></li>
                  <li><a href="#" className="footer-link">Câu hỏi thường gặp</a></li>
                  <li><a href="#" className="footer-link">Phản hồi</a></li>
                  <li><a href="#" className="footer-link">Quảng cáo</a></li>
                </ul>
              </div>
            </Col>

            {/* COL 3 — Khám phá */}
            <Col lg={2} md={3} sm={6}>
              <div className="footer-heading">Khám phá</div>
              <ul className="list-unstyled mb-4">
                <li><Link to="/movies" className="footer-link">Phim đang chiếu</Link></li>
                <li><Link to="/movies" className="footer-link">Phim sắp chiếu</Link></li>
                <li><Link to="/favorites" className="footer-link">Phim yêu thích</Link></li>
                <li><a href="#" className="footer-link">Top phim tuần</a></li>
                <li><a href="#" className="footer-link">Phim hành động</a></li>
                <li><a href="#" className="footer-link">Phim hoạt hình</a></li>
                <li><a href="#" className="footer-link">Phim kinh dị</a></li>
              </ul>

              <div className="footer-heading">Dịch vụ</div>
              <ul className="list-unstyled">
                <li><Link to="/items" className="footer-link">Bắp & Nước</Link></li>
                <li><Link to="/voucher" className="footer-link">Đổi voucher</Link></li>
                <li><a href="#" className="footer-link">Combo tiết kiệm</a></li>
                <li><a href="#" className="footer-link">Thẻ thành viên</a></li>
              </ul>
            </Col>

            {/* COL 4 — Liên hệ + Newsletter */}
            <Col lg={4} md={12}>
              <div className="footer-heading">Liên hệ</div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">📍</div>
                <div className="footer-contact-text">
                  <strong>Địa chỉ</strong>
                  Trường Cao đẳng FPT Polytechnic — Cần Thơ, Việt Nam
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">📞</div>
                <div className="footer-contact-text">
                  <strong>Hotline</strong>
                  1900 6017 (8:00 – 22:00 hàng ngày)
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">✉️</div>
                <div className="footer-contact-text">
                  <strong>Email</strong>
                  support@cinetoon.vn
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">🕐</div>
                <div className="footer-contact-text">
                  <strong>Giờ mở cửa</strong>
                  08:00 – 23:30 (Thứ 2 – Chủ nhật)
                </div>
              </div>

              {/* Newsletter */}
              {/* <div className="footer-newsletter">
                <div className="footer-heading" style={{ marginBottom: 8 }}>Nhận thông báo phim mới</div>
                <p>Đăng ký để nhận lịch chiếu và ưu đãi độc quyền hàng tuần.</p>
                <div className="footer-newsletter-input">
                  <input type="email" placeholder="Nhập email của bạn..." />
                  <button>Đăng ký</button>
                </div>
              </div> */}
            </Col>
          </Row>

          <hr className="footer-divider" />

          {/* ── BOTTOM BAR ── */}
          <div className="footer-bottom">
            <p className="footer-copyright mb-0">
              © 2026 <span>CINETOON</span> — Dự án tốt nghiệp FPoly. All rights reserved.
            </p>
            <div className="footer-badges">
              <span className="footer-badge-tag badge-secured">🔒 Thanh toán bảo mật</span>
              <span className="footer-badge-tag badge-fpoly">🎓 FPoly Project</span>
            </div>
          </div>

        </Container>
      </footer>
    </>
  );
};

export default Footer;
