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
          margin-bottom: 14px;
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
      `}</style>

      <footer className="cinema-footer">
        <div className="footer-accent-strip" />

        <Container className="py-5" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── MAIN GRID ── */}
          <Row className="g-5">

            {/* COL 1 — Brand */}
            <Col lg={4} md={6}>
              <Link to="/" className="d-flex align-items-center gap-2 mb-3 text-decoration-none">
                <span className="footer-logo-text">MOVIE<span>ZONE</span></span>
              </Link>
              <p style={{ color: 'rgba(240,240,255,0.45)', fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
                Hệ thống đặt vé xem phim hiện đại, nhanh chóng và tiện lợi.
                Trải nghiệm điện ảnh đỉnh cao với công nghệ ghế ngồi thông minh và âm thanh vòm.
              </p>
            </Col>

            {/* COL 2 — Khám phá */}
            <Col lg={2} md={3} sm={6}>
              <div className="footer-heading">Khám phá</div>
              <ul className="list-unstyled">
                <li><Link to="/" className="footer-link">Trang chủ</Link></li>
                <li><Link to="/movies" className="footer-link">Phim đang & sắp chiếu</Link></li>
                <li><Link to="/favorites" className="footer-link">Phim yêu thích</Link></li>
                <li><Link to="/events" className="footer-link">Sự kiện</Link></li>
              </ul>
            </Col>

            {/* COL 3 — Dịch vụ & Tài khoản */}
            <Col lg={2} md={3} sm={6}>
              <div className="footer-heading">Dịch vụ</div>
              <ul className="list-unstyled">
                <li><Link to="/foodorder" className="footer-link">Bắp & Nước</Link></li>
                <li><Link to="/voucher" className="footer-link">Đổi voucher</Link></li>
                <li><Link to="/profile" className="footer-link">Hồ sơ của tôi</Link></li>
                <li><Link to="/register" className="footer-link">Đăng ký tài khoản</Link></li>
              </ul>
            </Col>

            {/* COL 4 — Liên hệ */}
            <Col lg={4} md={12}>
              <div className="footer-heading">Liên hệ</div>

              <div className="footer-contact-item">
                <div className="footer-contact-text">
                  <strong>Địa chỉ</strong>
                  Cái Răng, Cần Thơ, Việt Nam
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-text">
                  <strong>Hotline</strong>
                  0916 178 534 (8:00 – 22:00 hàng ngày)
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-text">
                  <strong>Email</strong>
                  01236614499cong@gmail.com
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-text">
                  <strong>Giờ mở cửa</strong>
                  08:00 – 23:30 (Thứ 2 – Chủ nhật)
                </div>
              </div>
            </Col>
          </Row>

          <hr className="footer-divider" />

          {/* ── BOTTOM BAR ── */}
          <div className="footer-bottom">
            <p className="footer-copyright mb-0">
              © 2026 <span>MOVIEZONE</span> — Dự án tốt nghiệp FPoly. All rights reserved.
            </p>
            <div className="footer-badges">
              <span className="footer-badge-tag badge-secured">Thanh toán bảo mật</span>
              <span className="footer-badge-tag badge-fpoly">FPoly Project</span>
            </div>
          </div>

        </Container>
      </footer>
    </>
  );
};

export default Footer;
