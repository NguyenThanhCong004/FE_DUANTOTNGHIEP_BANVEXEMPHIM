import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const SuperAdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/login');
  };

  const menuItems = [
    { path: '/super-admin', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/super-admin/cinemas', icon: 'bi-building', label: 'Quản lý rạp' },
    { path: '/super-admin/employees', icon: 'bi-person-badge', label: 'Quản lý nhân viên' },
    { path: '/super-admin/users', icon: 'bi-people', label: 'Quản lý người dùng' },
    { path: '/super-admin/movies', icon: 'bi-film', label: 'Quản lý phim' },
    { path: '/super-admin/movie-types', icon: 'bi-tags', label: 'Loại phim' },
    { path: '/super-admin/seat-types', icon: 'bi-grid-3x3-gap', label: 'Loại ghế' },
    { path: '/super-admin/membership-levels', icon: 'bi-vignette', label: 'Quản lý mức độ hội viên' },
    { path: '/super-admin/products', icon: 'bi-box-seam', label: 'Quản lý sản phẩm' },
    { path: '/super-admin/product-types', icon: 'bi-collection', label: 'Loại sản phẩm' },
    { path: '/super-admin/vouchers', icon: 'bi-ticket-perforated', label: 'Quản lý voucher' },
    { path: '/super-admin/news', icon: 'bi-newspaper', label: 'Quản lý tin tức' },
  ];

  return (
    <>
      <style>{`
        .super-admin-sidebar {
          width: 280px;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          height: 100vh;
          box-shadow: 4px 0 10px rgba(0,0,0,0.3);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .super-admin-sidebar .sidebar-content::-webkit-scrollbar {
          width: 5px;
        }

        .super-admin-sidebar .sidebar-content::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 10px;
        }

        .super-admin-sidebar .nav-link {
          transition: all 0.2s ease;
          border-radius: 6px;
          color: white !important;
          text-decoration: none;
        }

        .super-admin-sidebar .hover-effect:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #0d6efd !important;
        }

        .super-admin-sidebar .nav-link.active {
          background-color: #0d6efd !important;
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
        }

        .sidebar-header h4 {
          letter-spacing: 1px;
        }

        .sidebar-content {
          flex-grow: 1;
          overflow-y: auto;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
      `}</style>

      <div className="super-admin-sidebar bg-dark text-white min-vh-100 d-flex flex-column">
        <div className="sidebar-header p-4 border-bottom border-secondary text-center">
          <h4 className="m-0 text-primary fw-bold">SUPER ADMIN</h4>
        </div>
        
        <div className="sidebar-content py-3">
          <ul className="nav nav-pills flex-column px-3">
            {menuItems.map((item, index) => (
              <li className="nav-item mb-1" key={index}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link d-flex align-items-center p-2 ${isActive ? 'active' : 'hover-effect'}`}
                  end={item.path === '/super-admin'}
                >
                  <i className={`bi ${item.icon} me-3 fs-5`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer p-3 border-top border-secondary">
          <button 
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
