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

const AdminDashboard = () => {
  // Dữ liệu cho biểu đồ doanh thu theo tuần (ví dụ cho 1 rạp)
  const chartData = {
    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
    datasets: [
      {
        label: 'Doanh thu ngày (VNĐ)',
        data: [12000000, 15000000, 11000000, 18000000, 25000000, 45000000, 52000000],
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: '#3498db',
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
          callback: (value) => value.toLocaleString('vi-VN') + ' đ',
        },
      },
    },
  };

  // Dữ liệu ảo (Mock data) cho các thẻ thống kê của Admin rạp
  const stats = [
    {
      label: 'Doanh thu hôm nay',
      value: '12,450,000 đ',
      icon: 'bi-cash-stack',
      color: 'primary',
      trend: '+15% so với hôm qua'
    },
    {
      label: 'Vé đã bán (Hôm nay)',
      value: '142',
      icon: 'bi-ticket-perforated',
      color: 'success',
      trend: '6 suất chiếu đã hoàn thành'
    },
    {
      label: 'Sản phẩm đã bán',
      value: '85',
      icon: 'bi-cup-straw',
      color: 'info',
      trend: 'Bắp nước & Combo'
    },
    {
      label: 'Nhân viên đang ca',
      value: '8',
      icon: 'bi-people',
      color: 'warning',
      trend: 'Ca sáng (08:00 - 14:00)'
    }
  ];

  return (
    <div className="admin-dashboard">
      <style>{`
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
          border-radius: 15px;
          background: #fff;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .icon-shape {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 20px;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="fw-bold text-dark m-0">Báo cáo doanh thu rạp</h2>
        <p className="text-muted">Chào mừng trở lại! Đây là thống kê hoạt động của rạp hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        {stats.map((stat, index) => (
          <div className="col-12 col-md-6 col-lg-3" key={index}>
            <div className="card stat-card shadow-sm h-100 p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`icon-shape bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>
              </div>
              <div>
                <h6 className="text-muted fw-normal mb-1">{stat.label}</h6>
                <h4 className="fw-bold mb-2 text-dark">{stat.value}</h4>
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
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '15px' }}>
            <h5 className="fw-bold mb-4">Thống kê doanh thu tuần này</h5>
            <div style={{ height: '350px', position: 'relative' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 h-100" style={{ borderRadius: '15px' }}>
            <h5 className="fw-bold mb-4">Hoạt động gần đây</h5>
            <div className="activity-list">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="d-flex gap-3 mb-3 pb-3 border-bottom border-light">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-cart-check"></i>
                  </div>
                  <div>
                    <p className="mb-0 fw-bold text-dark small">Bán thành công 02 vé</p>
                    <small className="text-muted">Phim: Kung Fu Panda 4 - 2 phút trước</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
