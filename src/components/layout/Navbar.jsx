import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Form,
  Button,
  InputGroup,
} from "react-bootstrap";

const NAV_LINKS = [
  { label: "Sự kiện",       to: "/"          },
  { label: "Phim",          to: "/movies"    },
  { label: "Phim yêu thích",to: "/favorites" },
  { label: "Đổi voucher",   to: "/voucher"   },
];

export default function CinemaNavbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const location                  = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setExpanded(false); }, [location.pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
          --glass:     rgba(13, 13, 43, 0.9);
        }

        /* ── ACCENT STRIP ── */
        .accent-strip {
          height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow), var(--purple));
          background-size: 300%;
          animation: gradientMove 5s linear infinite;
        }
        @keyframes gradientMove {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        /* ── TOP NAVBAR ── */
        .cinema-navbar-top {
          background: var(--glass) !important;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(212,255,0,0.12);
          transition: box-shadow 0.4s ease, border-color 0.4s ease;
          padding: 10px 0;
        }
        .cinema-navbar-top.scrolled {
          box-shadow: 0 4px 40px rgba(139,0,255,0.3);
          border-bottom-color: rgba(212,255,0,0.3);
        }

        /* ── BOTTOM NAVBAR ── */
        .cinema-navbar-bottom {
          background: rgba(0,0,0,0.2) !important;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 4px 0;
        }

        /* ── LOGO ── */
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          box-shadow: 0 0 20px rgba(255,45,120,0.45);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .logo-icon::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.13) 50%, transparent 60%);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .logo-wordmark {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 23px;
          letter-spacing: 3px;
          color: var(--off-white);
          line-height: 1;
          text-decoration: none !important;
        }
        .logo-wordmark span { color: var(--yellow); }
        .logo-wordmark:hover { text-decoration: none !important; }

        /* ── CTA BUTTONS ── */
        .btn-dat-ve {
          background: linear-gradient(135deg, var(--purple), var(--pink)) !important;
          border: none !important;
          color: #fff !important;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.4px;
          border-radius: 8px !important;
          box-shadow: 0 0 16px rgba(255,45,120,0.3);
          transition: box-shadow 0.25s ease, transform 0.25s ease !important;
          text-decoration: none;
        }
        .btn-dat-ve:hover {
          box-shadow: 0 0 28px rgba(255,45,120,0.65) !important;
          transform: translateY(-1px);
          color: #fff !important;
        }

        .btn-bap {
          background: transparent !important;
          border: 1.5px solid rgba(212,255,0,0.45) !important;
          color: var(--yellow) !important;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.4px;
          border-radius: 8px !important;
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease !important;
          text-decoration: none;
        }
        .btn-bap:hover {
          border-color: var(--yellow) !important;
          box-shadow: 0 0 16px rgba(212,255,0,0.35) !important;
          transform: translateY(-1px);
          color: var(--yellow) !important;
        }

        .btn-login {
          background: var(--yellow) !important;
          border: none !important;
          color: var(--navy) !important;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.4px;
          border-radius: 8px !important;
          box-shadow: 0 0 18px rgba(212,255,0,0.2);
          transition: box-shadow 0.25s ease, transform 0.25s ease !important;
          text-decoration: none;
        }
        .btn-login:hover {
          box-shadow: 0 0 30px rgba(212,255,0,0.55) !important;
          transform: translateY(-1px);
          color: var(--navy) !important;
        }

        /* ── SEARCH ── */
        .cinema-search .form-control {
          background: rgba(255,255,255,0.06) !important;
          border: 1.5px solid rgba(255,255,255,0.1) !important;
          border-right: none !important;
          color: var(--off-white) !important;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          border-radius: 10px 0 0 10px !important;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .cinema-search .form-control::placeholder { color: rgba(240,240,255,0.3); }
        .cinema-search .form-control:focus {
          border-color: var(--yellow) !important;
          box-shadow: 0 0 18px rgba(212,255,0,0.12) !important;
          background: rgba(212,255,0,0.04) !important;
        }
        .cinema-search .input-group-text {
          background: rgba(255,255,255,0.06) !important;
          border: 1.5px solid rgba(255,255,255,0.1) !important;
          border-left: none !important;
          color: rgba(240,240,255,0.35);
          border-radius: 0 10px 10px 0 !important;
          cursor: pointer;
          transition: border-color 0.3s, color 0.3s;
        }
        .cinema-search .form-control:focus ~ .input-group-text {
          border-color: var(--yellow) !important;
          color: var(--yellow);
        }
        .cinema-search .input-group-text:hover {
          color: var(--yellow);
        }

        /* ── BOTTOM NAV LINKS ── */
        .bottom-nav-link {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(240,240,255,0.5) !important;
          padding: 7px 16px !important;
          border-radius: 6px;
          position: relative;
          transition: color 0.25s, background 0.25s !important;
          text-decoration: none !important;
          display: inline-block;
        }
        .bottom-nav-link::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 16px; right: 16px;
          height: 2px;
          background: var(--yellow);
          border-radius: 2px;
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .bottom-nav-link:hover {
          color: var(--off-white) !important;
          background: rgba(255,255,255,0.05) !important;
        }
        .bottom-nav-link:hover::after,
        .bottom-nav-link.active::after { transform: scaleX(1); }
        .bottom-nav-link.active { color: var(--yellow) !important; }

        /* ── TOGGLER ── */
        .navbar-toggler {
          border: 1.5px solid rgba(212,255,0,0.4) !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
        }
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='%23d4ff00' stroke-width='2.5' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E") !important;
        }

        /* ── MOBILE COLLAPSE ── */
        @media (max-width: 991px) {
          .cinema-navbar-top .navbar-collapse {
            background: rgba(13,13,43,0.97);
            border-top: 1px solid rgba(212,255,0,0.1);
            padding: 16px;
            margin-top: 8px;
            border-radius: 12px;
          }
          .cinema-navbar-top .navbar-collapse .d-flex {
            flex-direction: column;
            gap: 10px !important;
            align-items: stretch !important;
          }
          .cinema-navbar-bottom { display: none; }
        }
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1030 }}>

        {/* Animated gradient strip */}
        <div className="accent-strip" />

        {/* ── TOP NAVBAR ── */}
        <Navbar
          expand="lg"
          className={`cinema-navbar-top${scrolled ? " scrolled" : ""}`}
          expanded={expanded}
          onToggle={setExpanded}
        >
          <Container fluid="xl">

            {/* Logo → trang chủ */}
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 me-3">
              <div className="logo-icon">🎬</div>
              <span className="logo-wordmark">ERROR<span>404</span></span>
            </Navbar.Brand>

            {/* Mobile toggler */}
            <Navbar.Toggle aria-controls="cinema-navbar-content" />

            <Navbar.Collapse id="cinema-navbar-content">
              <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">

                {/* Đặt vé → /movies */}
                <Button
                  as={Link}
                  to="/movies"
                  className="btn-dat-ve"
                  size="sm"
                >
                  🎫 Đặt vé ngay
                </Button>

                {/* Bắp nước → /items */}
                <Button
                  as={Link}
                  to="/items"
                  className="btn-bap"
                  size="sm"
                >
                  🍿 Đặt bắp nước
                </Button>

                {/* Spacer */}
                <div className="flex-grow-1" />

                {/* Search → /movies */}
                <InputGroup className="cinema-search" style={{ maxWidth: 340 }}>
                  <Form.Control
                    placeholder="Tìm phim, diễn viên..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        window.location.href = "/movies?q=" + encodeURIComponent(e.target.value);
                      }
                    }}
                  />
                  <InputGroup.Text as={Link} to="/movies">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </InputGroup.Text>
                </InputGroup>

                {/* Đăng nhập → /login */}
                <Button
                  as={Link}
                  to="/login"
                  className="btn-login"
                  size="sm"
                >
                  Đăng nhập
                </Button>

              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* ── BOTTOM NAV ── */}
        <Navbar className="cinema-navbar-bottom py-0">
          <Container fluid="xl">
            <Nav>
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`bottom-nav-link${location.pathname === to ? " active" : ""}`}
                >
                  {label}
                </Link>
              ))}
            </Nav>
          </Container>
        </Navbar>

      </div>
      <div style={{ height: "60px" }} />
    </>
  );
}