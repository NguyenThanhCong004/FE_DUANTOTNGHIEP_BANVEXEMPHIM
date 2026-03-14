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
  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: ['CGV Vincom', 'Lotte Cinema', 'BHD Star', 'Galaxy Cinema', 'Beta Cinemas', 'Cinestar', 'Mega GS'],
    datasets: [
      {
        label: 'Doanh thu (Triệu VNĐ)',
        data: [450, 380, 320, 290, 250, 210, 180],
        backgroundColor: 'rgba(13, 110, 253, 0.7)',
        borderColor: 'rgb(13, 110, 253)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value + 'M',
        },
      },
    },
  };

  // Dữ liệu ảo (Mock data) cho các thẻ thống kê
  const stats = [
    {
      label: 'Tổng doanh thu (Tất cả rạp)',
      value: '2,450,000,000 VNĐ',
      icon: 'bi-currency-dollar',
      color: 'primary',
      trend: '+12% so với tháng trước'
    },
    {
      label: 'Tổng số nhân viên',
      value: '124',
      icon: 'bi-person-badge',
      color: 'success',
      trend: 'Hoạt động trên 12 rạp'
    },
    {
      label: 'Tổng số khách hàng',
      value: '12,850',
      icon: 'bi-people',
      color: 'info',
      trend: '850 thành viên mới'
    },
    {
      label: 'Tổng bộ phim đã tạo',
      value: '342',
      icon: 'bi-film',
      color: 'warning',
      trend: '24 phim đang chiếu'
    },
    {
      label: 'Tổng sản phẩm (Bắp/Nước)',
      value: '56',
      icon: 'bi-box-seam',
      color: 'danger',
      trend: '8 loại sản phẩm'
    }
  ];

  return (
    <div className="dashboard-container">
      <style>{`
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
          border-radius: 15px;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .icon-shape {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 24px;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark m-0">Tổng quan hệ thống</h2>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        {stats.map((stat, index) => (
          <div className="col-12 col-md-6 col-lg-4 col-xl" key={index}>
            <div className="card stat-card shadow-sm h-100 p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`icon-shape bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>
                <span className={`badge bg-${stat.color} bg-opacity-10 text-${stat.color} border border-${stat.color}`}>
                  Thống kê
                </span>
              </div>
              <div>
                <h6 className="text-muted fw-normal mb-1">{stat.label}</h6>
                <h3 className="fw-bold mb-2">{stat.value}</h3>
                <small className="text-success d-flex align-items-center">
                  <i className="bi bi-arrow-up-right me-1"></i>
                  {stat.trend}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row cho Biểu đồ */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '15px' }}>
            <h5 className="fw-bold mb-4">Biểu đồ doanh thu theo rạp (Triệu VNĐ)</h5>
            <div style={{ height: '400px', position: 'relative' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
