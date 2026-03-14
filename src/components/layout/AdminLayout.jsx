import React from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  TicketPercent, 
  CalendarClock, 
  Armchair, 
  Popcorn, 
  MonitorPlay, 
  DoorOpen, 
  FileText, 
  LogOut,
  User,
  Home as HomeIcon,
  ChevronDown
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Logic đăng xuất ở đây (ví dụ: xóa token)
    console.log('Logging out...');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/staff', label: 'Quản lý nhân viên rạp' },
    { path: '/admin/users', label: 'Quản lý người dùng' },
    { path: '/admin/promotions', label: 'Quản lý khuyến mãi' },
    { path: '/admin/shifts', label: 'Quản lý ca làm nhân viên' },
    { path: '/admin/rooms', label: 'Quản lý phòng chiếu' },
    { path: '/admin/seats', label: 'Quản lý ghế' },
    { path: '/admin/showtimes', label: 'Quản lý suất chiếu' },
    { path: '/admin/products', label: 'Quản lý sản phẩm bán tại rạp' },
    { path: '/admin/invoices', label: 'Hóa đơn của rạp' },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          CINEMA ADMIN
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              end={item.path === '/admin'}
              className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
              style={({ isActive }) => ({
                color: isActive ? '#1976d2' : '#333333',
                textDecoration: 'none'
              })}
            >
              <span style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <span className="ms-2" style={{ color: 'inherit' }}>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn w-100">
            <LogOut size={20} />
            <span className="ms-2">Đăng xuất</span>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header px-4 d-flex justify-content-end align-items-center shadow-sm" style={{ height: '70px', background: '#fff' }}>
          <Dropdown className="admin-profile-dropdown">
            <Dropdown.Toggle id="dropdown-admin-profile" as="div" className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <img 
                src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" 
                alt="Admin Avatar" 
                className="admin-avatar rounded-circle border"
                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
              />
              <ChevronDown size={18} style={{ color: '#6c757d' }} />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" className="border-0 shadow-lg mt-3 py-2" style={{ borderRadius: '15px', minWidth: '220px' }}>
              <div className="px-3 py-2 border-bottom mb-2">
                <div className="fw-bold text-dark">Quản trị viên</div>
                <div className="text-muted small">admin@cinema.com</div>
              </div>
              
              <Dropdown.Item as={Link} to="/admin/profile" className="py-2 px-3 d-flex align-items-center gap-2">
                <User size={18} className="text-primary" />
                <span className="fw-semibold">Trang cá nhân</span>
              </Dropdown.Item>

              <Dropdown.Item as={Link} to="/" className="py-2 px-3 d-flex align-items-center gap-2">
                <HomeIcon size={18} className="text-success" />
                <span className="fw-semibold">Về trang chủ</span>
              </Dropdown.Item>

              <Dropdown.Divider className="mx-2" />

              <Dropdown.Item onClick={handleLogout} className="py-2 px-3 d-flex align-items-center gap-2 text-danger">
                <LogOut size={18} />
                <span className="fw-semibold">Đăng xuất</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </header>

        {/* Dynamic Content */}
        <div className="content-wrapper p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
