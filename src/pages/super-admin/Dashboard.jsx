import React, { useState, useEffect } from 'react';
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
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiJson } from '../../utils/apiClient';
import { SUPER_ADMIN_DASHBOARD } from '../../constants/apiEndpoints';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [cinemaRankings, setCinemaRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, revenueRes, rankingRes] = await Promise.all([
        apiJson(SUPER_ADMIN_DASHBOARD.SUMMARY),
        apiJson(SUPER_ADMIN_DASHBOARD.REVENUE_CHART(new Date().getFullYear())),
        apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_RANKING)
      ]);

      if (summaryRes.ok) setSummary(summaryRes.data);
      if (revenueRes.ok) setRevenueData(revenueRes.data || []);
      if (rankingRes.ok) setCinemaRankings(rankingRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: revenueData.map(item => item.label),
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: revenueData.map(item => item.totalAmount),
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
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
            }
            return label;
          }
        }
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
          callback: (value) => (value / 1000000).toFixed(1) + 'M',
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
    { 
      title: 'Tổng doanh thu', 
      value: summary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.totalRevenue) : '0 ₫', 
      subtitle: 'Tất cả rạp', 
      icon: 'bi-currency-dollar', 
      color: '#6366f1', 
      change: summary ? `${summary.revenueGrowth.toFixed(1)}%` : '0%', 
      changeType: summary && summary.revenueGrowth >= 0 ? 'increase' : 'decrease' 
    },
    { 
      title: 'Tổng nhân viên', 
      value: summary ? (summary.totalStaff || 0).toLocaleString() : '0', 
      subtitle: 'người', 
      icon: 'bi-person-badge', 
      color: '#10b981', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Khách hàng', 
      value: summary ? summary.totalUsers.toLocaleString() : '0', 
      subtitle: 'người', 
      icon: 'bi-people', 
      color: '#3b82f6', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Tổng rạp', 
      value: summary ? summary.totalCinemas.toLocaleString() : '0', 
      subtitle: 'chi nhánh', 
      icon: 'bi-building', 
      color: '#f59e0b', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Tổng phim', 
      value: summary ? (summary.totalMovies || 0).toLocaleString() : '0', 
      subtitle: 'bộ phim', 
      icon: 'bi-film', 
      color: '#6366f1', 
      change: '', 
      changeType: 'increase' 
    }
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
    <AdminPanelPage
      icon="shield-lock"
      title="Super Admin Dashboard"
      description="Tổng quan hệ thống toàn bộ rạp chiếu phim"
      headerRight={
        <button type="button" className="admin-btn" style={{ background: 'white', color: '#6366f1' }} onClick={exportExcel}>
          <i className="bi bi-file-earmark-excel me-2"></i>
          Xuất Excel
        </button>
      }
    >
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="admin-stat-card admin-slide-up"
            style={{
              '--stat-color': stat.color,
              '--icon-bg': `${stat.color}15`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="admin-stat-icon">
              <i className={`bi ${stat.icon}`}></i>
            </div>
            <div className="admin-stat-value" style={{ fontSize: stat.title === 'Tổng doanh thu' ? '1.25rem' : '1.5rem' }}>
              {stat.value}
            </div>
            <div className="admin-stat-label">{stat.title} ({stat.subtitle})</div>
            {stat.change && (
              <div className={`admin-stat-change ${stat.changeType}`}>
                <i className={`bi bi-arrow-${stat.changeType === 'increase' ? 'up' : 'down'}`}></i>
                {stat.change}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="row mt-4">
        <div className="col-lg-8">
          <div className="admin-card admin-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="admin-card-header">
              <h4>
                <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                Biểu đồ doanh thu năm {new Date().getFullYear()}
              </h4>
              <span className="text-muted small">Đơn vị: VNĐ</span>
            </div>
            <div className="admin-card-body">
              <div style={{ height: '400px', position: 'relative' }}>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="admin-card admin-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="admin-card-header">
              <h4>
                <i className="bi bi-trophy me-2 text-warning"></i>
                Xếp hạng doanh thu rạp
              </h4>
            </div>
            <div className="admin-card-body p-0">
              <div className="table-responsive">
                <table className="admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Tên rạp</th>
                      <th className="text-end">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="2" className="text-center py-4">Đang tải...</td></tr>
                    ) : cinemaRankings.length > 0 ? (
                      cinemaRankings.map((cinema, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold">
                            <span className="me-2 text-muted">{idx + 1}.</span>
                            {cinema.cinemaName}
                          </td>
                          <td className="text-end text-primary fw-bold">
                            {new Intl.NumberFormat('vi-VN').format(cinema.revenue)} ₫
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="2" className="text-center py-4">Chưa có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default SuperAdminDashboard;
