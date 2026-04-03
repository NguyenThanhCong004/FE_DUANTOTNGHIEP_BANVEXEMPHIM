import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --navy:      #0d0d2b;
          --navy-mid:  #12122e;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
        }

        /* ── FOOTER WRAPPER ── */
        .cinema-footer {
          background: var(--navy-mid);
          border-top: 1px solid rgba(212,255,0,0.12);
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* background glow orbs */
        .cinema-footer::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139,0,255,0.08) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
        }
        .cinema-footer::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,45,120,0.07) 0%, transparent 70%);
          bottom: 0; right: 0;
          pointer-events: none;
        }

        /* ── ACCENT STRIP TOP ── */
        .footer-accent-strip {
          height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow), var(--purple));
          background-size: 300%;
          animation: gradientMove 5s linear infinite;
        }
        @keyframes gradientMove {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        /* ── LOGO ── */
        .footer-logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 20px rgba(255,45,120,0.4);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .footer-logo-icon::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .footer-logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 3px;
          color: var(--off-white);
          line-height: 1;
          text-decoration: none !important;
        }
        .footer-logo-text span { color: var(--yellow); }

        /* ── SECTION HEADING ── */
        .footer-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2.5px;
          color: var(--yellow);
          margin-bottom: 20px;
          position: relative;
          padding-bottom: 10px;
        }
        .footer-heading::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 28px; height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink));
          border-radius: 2px;
        }

        /* ── LINKS ── */
        .footer-link {
          color: rgba(240,240,255,0.5);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          transition: color 0.25s, gap 0.25s;
        }
        .footer-link::before {
          content: '›';
          color: var(--pink);
          font-size: 16px;
          line-height: 1;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.25s, transform 0.25s;
        }
        .footer-link:hover {
          color: var(--off-white);
          gap: 12px;
        }
        .footer-link:hover::before {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── CONTACT ITEMS ── */
        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .footer-contact-icon {
          width: 32px; height: 32px;
          background: rgba(139,0,255,0.15);
          border: 1px solid rgba(139,0,255,0.3);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
          color: var(--purple);
          transition: background 0.25s, border-color 0.25s;
        }
        .footer-contact-item:hover .footer-contact-icon {
          background: rgba(139,0,255,0.25);
          border-color: var(--purple);
        }
        .footer-contact-text {
          color: rgba(240,240,255,0.5);
          font-size: 13px;
          line-height: 1.6;
        }
        .footer-contact-text strong {
          color: rgba(240,240,255,0.8);
          display: block;
          font-size: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        /* ── SOCIAL BUTTONS ── */
        .footer-social-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          text-decoration: none;
          transition: transform 0.25s, box-shadow 0.25s;
          flex-shrink: 0;
        }
        .footer-social-btn:hover { transform: translateY(-3px); }
        .social-fb  { background: rgba(24,119,242,0.15); border: 1px solid rgba(24,119,242,0.35); color: #4a90e2; }
        .social-ig  { background: rgba(255,45,120,0.12); border: 1px solid rgba(255,45,120,0.35); color: var(--pink); }
        .social-yt  { background: rgba(255,0,0,0.12);    border: 1px solid rgba(255,0,0,0.3);     color: #ff4444; }
        .social-tt  { background: rgba(0,242,234,0.1);   border: 1px solid rgba(0,242,234,0.3);   color: #00f2ea; }
        .social-fb:hover  { box-shadow: 0 0 16px rgba(24,119,242,0.4); }
        .social-ig:hover  { box-shadow: 0 0 16px rgba(255,45,120,0.4); }
        .social-yt:hover  { box-shadow: 0 0 16px rgba(255,0,0,0.4); }
        .social-tt:hover  { box-shadow: 0 0 16px rgba(0,242,234,0.4); }

        /* ── NEWSLETTER ── */
        .footer-newsletter {
          background: rgba(139,0,255,0.08);
          border: 1px solid rgba(139,0,255,0.2);
          border-radius: 14px;
          padding: 18px;
          margin-top: 20px;
        }
        .footer-newsletter p {
          color: rgba(240,240,255,0.5);
          font-size: 12.5px;
          margin-bottom: 12px;
          line-height: 1.6;
        }
        .footer-newsletter-input {
          display: flex;
          gap: 8px;
        }
        .footer-newsletter-input input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 14px;
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          outline: none;
          transition: border-color 0.3s;
        }
        .footer-newsletter-input input::placeholder { color: rgba(240,240,255,0.25); }
        .footer-newsletter-input input:focus { border-color: var(--yellow); }
        .footer-newsletter-input button {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .footer-newsletter-input button:hover {
          box-shadow: 0 0 18px rgba(255,45,120,0.5);
          transform: translateY(-1px);
        }

        /* ── APP BADGES ── */
        .app-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 8px 14px;
          text-decoration: none;
          transition: border-color 0.25s, background 0.25s;
          flex: 1;
        }
        .app-badge:hover {
          border-color: rgba(212,255,0,0.4);
          background: rgba(212,255,0,0.04);
        }
        .app-badge-icon { font-size: 20px; flex-shrink: 0; }
        .app-badge-text { line-height: 1.3; }
        .app-badge-label { display: block; font-size: 10px; color: rgba(240,240,255,0.4); letter-spacing: 0.5px; }
        .app-badge-store { display: block; font-size: 13px; font-weight: 700; color: var(--off-white); }

        /* ── DIVIDER ── */
        .footer-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.07);
          margin: 32px 0 24px;
        }

        /* ── BOTTOM BAR ── */
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-copyright {
          color: rgba(240,240,255,0.3);
          font-size: 12px;
          letter-spacing: 0.3px;
        }
        .footer-copyright span { color: var(--pink); }
        .footer-badges {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .footer-badge-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid;
        }
        .badge-secured { color: rgba(212,255,0,0.7); border-color: rgba(212,255,0,0.25); }
        .badge-fpoly   { color: rgba(139,0,255,0.8); border-color: rgba(139,0,255,0.3); }

        /* ── STAT COUNTERS ── */
        .footer-stats {
          display: flex;
          gap: 0;
          margin-bottom: 32px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
        }
        .footer-stat {
          flex: 1;
          padding: 16px 12px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          transition: background 0.25s;
        }
        .footer-stat:last-child { border-right: none; }
        .footer-stat:hover { background: rgba(255,255,255,0.04); }
        .footer-stat-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--yellow), var(--pink));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 4px;
        }
        .footer-stat-label {
          color: rgba(240,240,255,0.35);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .m-top {
          margin-top: 80px;
        }
      `}</style>

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
                <span className="footer-logo-text">CINE<span>MAX</span></span>
              </Link>
              <p style={{ color: 'rgba(240,240,255,0.45)', fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
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
                  support@cinemax.vn
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
              © 2026 <span>CINEMAX</span> — Dự án tốt nghiệp FPoly. All rights reserved.
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
