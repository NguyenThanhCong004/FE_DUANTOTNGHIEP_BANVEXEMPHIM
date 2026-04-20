import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Spinner, Alert } from 'react-bootstrap';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiJson } from '../../utils/apiClient';
import { SUPER_ADMIN_DASHBOARD } from '../../constants/apiEndpoints';
import { getAccessToken, getStoredUser, clearAuthSession } from '../../utils/authStorage';
import { decodeJwtPayload } from '../../utils/jwt';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [cinemaRankings, setCinemaRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Kiểm tra quyền Super Admin từ localStorage và Token
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login', { state: { message: 'Vui lòng đăng nhập để truy cập Dashboard.', type: 'warning' } });
      return;
    }

    const payload = decodeJwtPayload(token);
    const roles = payload?.roles || [];
    const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');

    if (!isSuperAdmin) {
      setErrorMsg("Bạn không có quyền truy cập vùng Quản trị cấp cao. Vui lòng liên hệ Quản trị viên hệ thống.");
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      // Nếu đã có lỗi quyền ở useEffect trên thì không fetch
      if (errorMsg) return;

      try {
        setLoading(true);
        setErrorMsg('');

        const [summaryRes, revenueRes, rankingRes] = await Promise.all([
          apiJson(SUPER_ADMIN_DASHBOARD.SUMMARY),
          apiJson(SUPER_ADMIN_DASHBOARD.REVENUE_CHART(new Date().getFullYear())),
          apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_RANKING)
        ]);

        if (!mounted) return;

        // Bắt lỗi Access Denied (401/403) từ Server
        if (summaryRes.status === 401 || revenueRes.status === 401) {
           clearAuthSession();
           navigate('/login', { state: { message: 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.', type: 'danger' } });
           return;
        }

        if (summaryRes.status === 403 || revenueRes.status === 403) {
           setErrorMsg("Bạn không có quyền thực hiện hành động này. Yêu cầu ROLE_SUPER_ADMIN.");
           return;
        }

        // Bắt lỗi chung
        if (!summaryRes.ok && !revenueRes.ok) {
           setErrorMsg("Không thể tải dữ liệu từ máy chủ. " + (summaryRes.message || ""));
           return;
        }

        if (summaryRes.ok) setSummary(summaryRes.data);
        if (revenueRes.ok) setRevenueData(revenueRes.data || []);
        if (rankingRes.ok) setCinemaRankings(rankingRes.data || []);

      } catch (error) {
        if (mounted) {
           console.error('Lỗi khi tải Dashboard Super Admin:', error);
           setErrorMsg("Lỗi kết nối mạng hoặc máy chủ không phản hồi.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => { mounted = false; };
  }, [navigate, errorMsg]);

  const chartData = {
    labels: revenueData.map(item => item.label),
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: revenueData.map(item => item.totalAmount),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const cinemaChartData = {
    labels: cinemaRankings.map(item => item.cinemaName),
    datasets: [
      {
        data: cinemaRankings.map(item => item.revenue),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: '600' } },
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
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) {
              const value = typeof context.parsed === 'number' ? context.parsed : context.parsed.y;
              label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: {
          callback: (value) => (value / 1000000).toFixed(1) + 'M',
          font: { size: 11 },
          color: '#64748b',
        },
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 12, weight: '500' }, color: '#64748b' },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 15, font: { size: 11, weight: '500' } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1) + '%';
            return `${label}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} (${percentage})`;
          }
        }
      }
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const stats = [
    { 
      title: 'Tổng doanh thu', 
      value: summary ? formatMoney(summary.totalRevenue) : '0 ₫', 
      subtitle: 'Toàn hệ thống', 
      icon: 'bi-currency-dollar', 
      color: '#6366f1', 
      change: summary ? `${summary.revenueGrowth?.toFixed(1)}%` : '0%', 
      changeType: summary && summary.revenueGrowth >= 0 ? 'increase' : 'decrease' 
    },
    { 
      title: 'Tổng vé đã bán', 
      value: summary ? (summary.totalTicketsSold || 0).toLocaleString() : '0', 
      subtitle: 'vé', 
      icon: 'bi-ticket-perforated', 
      color: '#ec4899', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Khách hàng', 
      value: summary ? (summary.totalUsers || 0).toLocaleString() : '0', 
      subtitle: 'người', 
      icon: 'bi-people', 
      color: '#3b82f6', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Tổng rạp', 
      value: summary ? (summary.totalCinemas || 0).toLocaleString() : '0', 
      subtitle: 'chi nhánh', 
      icon: 'bi-building', 
      color: '#f59e0b', 
      change: '', 
      changeType: 'increase' 
    },
    { 
      title: 'Kho phim', 
      value: summary ? (summary.totalMovies || 0).toLocaleString() : '0', 
      subtitle: 'bộ phim', 
      icon: 'bi-film', 
      color: '#10b981', 
      change: '', 
      changeType: 'increase' 
    }
  ];

  return (
    <AdminPanelPage
      icon="globe"
      title="Trung tâm điều hành - Hệ thống Rạp"
      description="Quản lý và thống kê dữ liệu toàn bộ các chi nhánh."
    >
      {errorMsg ? (
         <Alert variant="danger" className="mt-3">
            <Alert.Heading><i className="bi bi-exclamation-octagon-fill me-2"></i>Lỗi Truy Cập</Alert.Heading>
            <p className="mb-0">{errorMsg}</p>
         </Alert>
      ) : loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Đang tính toán số liệu toàn hệ thống…</p>
        </div>
      ) : (
        <>
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
            {/* Biểu đồ doanh thu theo thời gian */}
            <div className="col-lg-8 mb-4">
              <div className="admin-card admin-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="admin-card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                    Biểu đồ doanh thu năm {new Date().getFullYear()}
                  </h4>
                </div>
                <div className="admin-card-body">
                  <div style={{ height: '350px', position: 'relative' }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Biểu đồ tỉ trọng doanh thu rạp */}
            <div className="col-lg-4 mb-4">
              <div className="admin-card admin-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="admin-card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-pie-chart-fill me-2 text-info"></i>
                    Tỉ trọng doanh thu rạp
                  </h4>
                </div>
                <div className="admin-card-body">
                  <div style={{ height: '350px', position: 'relative' }}>
                    <Pie data={cinemaChartData} options={pieOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng xếp hạng rạp chi tiết */}
            <div className="col-12">
              <div className="admin-card admin-slide-up" style={{ animationDelay: '0.6s' }}>
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">
                    <i className="bi bi-trophy me-2 text-warning"></i>
                    Xếp hạng doanh thu chi tiết các chi nhánh
                  </h4>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
                    Tổng cộng: {cinemaRankings.length} rạp
                  </span>
                </div>
                <div className="admin-card-body p-0">
                  <div className="table-responsive">
                    <table className="admin-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>Hạng</th>
                          <th>Tên rạp chi nhánh</th>
                          <th className="text-center">Số vé đã bán</th>
                          <th className="text-end">Doanh thu tổng</th>
                          <th className="text-center">Tỉ lệ (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cinemaRankings.length > 0 ? (
                          cinemaRankings.map((cinema, idx) => {
                            const total = cinemaRankings.reduce((a, b) => a + b.revenue, 0);
                            const percent = ((cinema.revenue / total) * 100).toFixed(1);
                            return (
                              <tr key={idx}>
                                <td className="text-center">
                                  <span className={`admin-badge ${idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary' : idx === 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
                                     #{idx + 1}
                                  </span>
                                </td>
                                <td className="fw-bold text-dark">
                                  {cinema.cinemaName}
                                </td>
                                <td className="text-center fw-medium">
                                  {cinema.count?.toLocaleString()} vé
                                </td>
                                <td className="text-end text-primary fw-bold">
                                  {formatMoney(cinema.revenue)}
                                </td>
                                <td className="text-center">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                      <div className="progress-bar bg-primary" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className="small fw-bold" style={{ minWidth: '40px' }}>{percent}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có dữ liệu thống kê từ các rạp</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPanelPage>
  );
};

export default SuperAdminDashboard;