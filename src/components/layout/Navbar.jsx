import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top w-100">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <div className="bg-danger p-2 rounded-3 text-white">
            <i className="fas fa-film"></i>
          </div>
          <span className="fw-black fs-4 tracking-tighter text-dark" style={{ letterSpacing: '-1px', fontWeight: 900 }}>CINETOON</span>
        </Link>
        
        <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto text-uppercase fw-bold small gap-lg-4">
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/">Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/movies">Phim</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/items">Bắp nước</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark" to="/contact">Liên hệ</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            <Link to="/movies" className="btn btn-link text-dark p-0"><i className="fas fa-search"></i></Link>
            <Link to="/login" className="btn btn-gradient rounded-pill px-4 fw-bold small shadow-sm">
              <i className="fas fa-user me-2"></i> ĐĂNG NHẬP
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
