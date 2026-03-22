import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../../styles/admin-design-system.css';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminDashboard = () => {
  const chartData = {
    labels: ['—'],
    datasets: [
      {
        label: 'Doanh thu (Triệu VNĐ)',
        data: [0],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        padding: 12,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => value + 'M',
          font: { size: 11 },
          color: '#64748b',
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { size: 12, weight: '500' },
          color: '#64748b',
        },
      },
    },
  };

  const stats = [
    { title: 'Tổng doanh thu', value: '—', subtitle: 'Tất cả rạp', icon: 'bi-currency-dollar', color: '#6366f1', change: 'Nối API', changeType: 'increase' },
    { title: 'Tổng nhân viên', value: '—', subtitle: 'người', icon: 'bi-person-badge', color: '#10b981', change: '', changeType: 'increase' },
    { title: 'Tổng khách hàng', value: '—', subtitle: 'người', icon: 'bi-people', color: '#3b82f6', change: '', changeType: 'increase' },
    { title: 'Tổng phim', value: '—', subtitle: 'bộ phim', icon: 'bi-film', color: '#f59e0b', change: '', changeType: 'increase' },
    { title: 'Tổng sản phẩm', value: '—', subtitle: 'Bắp/Nước', icon: 'bi-box-seam', color: '#ef4444', change: '', changeType: 'increase' },
  ];

  const exportExcel = () => {
    const headers = ['Hang muc', 'Gia tri', 'Xu huong'];
    const rows = stats.map((s) => [s.title, s.value, s.change]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-admin-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-shield-lock me-3"></i>
              Super Admin Dashboard
            </h1>
            <p className="lead">
              Tổng quan hệ thống toàn bộ rạp chiếu phim
            </p>
          </div>
          <button className="admin-btn" style={{ background: 'white', color: '#6366f1' }} onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="admin-stat-card admin-slide-up" 
            style={{ 
              '--stat-color': stat.color, 
              '--icon-bg': `${stat.color}15`,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="admin-stat-icon">
              <i className={`bi ${stat.icon}`}></i>
            </div>
            <div className="admin-stat-value">{stat.value}</div>
            <div className="admin-stat-label">{stat.subtitle}</div>
            {stat.change && (
              <div className={`admin-stat-change ${stat.changeType}`}>
                <i className={`bi bi-arrow-${stat.changeType === 'increase' ? 'up' : 'down'}`}></i>
                {stat.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div className="admin-card admin-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-bar-chart-line me-2 text-primary"></i>
            Biểu đồ doanh thu theo rạp
          </h4>
          <span className="text-muted small">Đơn vị: Triệu VNĐ</span>
        </div>
        <div className="admin-card-body">
          <div style={{ height: '400px', position: 'relative' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
