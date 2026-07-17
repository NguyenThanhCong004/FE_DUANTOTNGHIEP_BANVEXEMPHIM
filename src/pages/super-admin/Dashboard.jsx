import React, { useState, useEffect, useRef } from 'react';
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
import { Bar, Pie, getElementAtEvent } from 'react-chartjs-2';
import { Spinner, Alert } from 'react-bootstrap';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiJson } from '../../utils/apiClient';
import { SUPER_ADMIN_DASHBOARD } from '../../constants/apiEndpoints';
import { getAccessToken, clearAuthSession } from '../../utils/authStorage';
import { decodeJwtPayload } from '../../utils/jwt';
import { formatNumber, formatVnd } from '../../utils/formatters';

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
  const barChartRef = useRef();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [cinemaRankings, setCinemaRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái tháng/năm đang được chọn để xem tỉ trọng
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  // 1. Kiểm tra Token & Role
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/staff/login', { state: { message: 'Vui lòng đăng nhập.', type: 'warning' } });
      return;
    }

    const payload = decodeJwtPayload(token);
    const authorities = payload?.authorities || [];
    if (!authorities.includes('ROLE_SUPER_ADMIN')) {
      setErrorMsg("Bạn không có quyền truy cập Dashboard Super Admin.");
      setLoading(false);
    }
  }, [navigate]);

  // 2. Fetch dữ liệu tổng quan & biểu đồ năm (Chạy khi đổi năm)
  useEffect(() => {
    let mounted = true;
    const fetchMainStats = async () => {
      if (errorMsg) return;
      try {
        setLoading(true);
        const [summaryRes, revenueRes] = await Promise.all([
          apiJson(SUPER_ADMIN_DASHBOARD.SUMMARY),
          apiJson(SUPER_ADMIN_DASHBOARD.REVENUE_CHART(selectedYear))
        ]);

        if (!mounted) return;

        if (summaryRes.status === 401) {
           clearAuthSession();
           navigate('/staff/login');
           return;
        }

        if (!summaryRes.ok || !revenueRes.ok) {
          setErrorMsg(summaryRes.message || revenueRes.message || "Lỗi khi tải dữ liệu thống kê.");
          return;
        }

        setSummary(summaryRes.data);
        setRevenueData(revenueRes.data || []);

      } catch {
        if (mounted) setErrorMsg("Lỗi kết nối máy chủ.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMainStats();
    return () => { mounted = false; };
  }, [selectedYear, errorMsg, navigate]);

  // 3. Fetch xếp hạng rạp (Chạy khi đổi tháng/năm)
  useEffect(() => {
    let mounted = true;
    const fetchRankings = async () => {
      try {
        setRankingLoading(true);
        // Gọi hàm với tham số cụ thể
        const res = await apiJson(SUPER_ADMIN_DASHBOARD.CINEMA_RANKING(selectedYear, selectedMonth));
        if (mounted && res.ok) {
          setCinemaRankings(res.data || []);
        }
      } catch (err) {
        console.error("Rankings error:", err);
      } finally {
        if (mounted) setRankingLoading(false);
      }
    };
    fetchRankings();
    return () => { mounted = false; };
  }, [selectedMonth, selectedYear]);

  // Xử lý click vào biểu đồ cột
  const handleBarClick = (event) => {
    const { current: chart } = barChartRef;
    if (!chart) return;
    const element = getElementAtEvent(chart, event);
    if (element.length > 0) {
      setSelectedMonth(element[0].index + 1);
    }
  };

  const barData = {
    labels: revenueData.map(item => item.label),
    datasets: [
      {
        label: 'Doanh thu',
        data: revenueData.map(item => item.totalAmount),
        backgroundColor: revenueData.map((_, i) => (i + 1 === selectedMonth ? '#6366f1' : 'rgba(99, 102, 241, 0.3)')),
        borderRadius: 4,
      }
    ]
  };

  const pieData = {
    labels: cinemaRankings.map(c => c.cinemaName),
    datasets: [
      {
        data: cinemaRankings.map(c => c.revenue),
        backgroundColor: ['#6366f1', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const formatVN = (v) => formatVnd(v, { compact: true });

  return (
    <AdminPanelPage
      icon="globe"
      title="Trung tâm điều hành"
      description="Dữ liệu toàn hệ thống. Nhấn vào biểu đồ doanh thu để lọc theo tháng."
    >
      {errorMsg ? <Alert variant="danger">{errorMsg}</Alert> : loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
        <>
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard title="Doanh thu" value={formatVN(summary?.totalRevenue)} color="#6366f1" icon="bi-currency-dollar" />
            <StatCard title="Nhân viên" value={formatNumber(summary?.totalStaff)} color="#ec4899" icon="bi-person-badge" />
            <StatCard title="Khách hàng" value={formatNumber(summary?.totalUsers)} color="#3b82f6" icon="bi-people" />
            <StatCard title="Rạp" value={summary?.totalCinemas} color="#f59e0b" icon="bi-building" />
            <StatCard title="Tổng phim" value={formatNumber(summary?.totalMovies)} color="#10b981" icon="bi-film" />
          </div>

          <div className="row mt-4">
            <div className="col-lg-8 mb-4">
              <div className="admin-card">
                <div className="admin-card-header"><h4>Doanh thu năm {selectedYear}</h4></div>
                <div className="admin-card-body" style={{ height: '350px' }}>
                  <Bar ref={barChartRef} data={barData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    onClick: handleBarClick,
                    plugins: { legend: { display: false } }
                  }} />
                </div>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="admin-card h-100">
                <div className="admin-card-header"><h4>Tỉ trọng Tháng {selectedMonth}</h4></div>
                <div className="admin-card-body position-relative" style={{ height: '350px' }}>
                  {rankingLoading && <div className="admin-loading-overlay"><Spinner size="sm" /></div>}
                  {cinemaRankings.length > 0 ? <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} /> : <p className="text-center mt-5">Không có dữ liệu</p>}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="admin-card">
                <div className="admin-card-header"><h4>Chi tiết doanh thu chi nhánh - Tháng {selectedMonth}</h4></div>
                <div className="admin-card-body p-0">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Hạng</th><th>Tên rạp</th><th className="text-end">Doanh thu</th><th>Tỉ lệ</th></tr>
                    </thead>
                    <tbody>
                      {cinemaRankings.map((c, i) => {
                        const total = cinemaRankings.reduce((a, b) => a + b.revenue, 0);
                        const pct = total > 0 ? ((c.revenue / total) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={i}>
                            <td>#{i+1}</td>
                            <td className="fw-bold">{c.cinemaName}</td>
                            <td className="text-end text-primary">{formatVN(c.revenue)}</td>
                            <td>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPanelPage>
  );
};

const StatCard = ({ title, value, color, icon }) => (
  <div className="admin-stat-card" style={{ '--stat-color': color, '--icon-bg': `${color}15` }}>
    <div className="admin-stat-icon"></div>
    <div className="admin-stat-value" style={{ fontSize: '1.2rem' }}>{value || 0}</div>
    <div className="admin-stat-label">{title}</div>
  </div>
);

export default SuperAdminDashboard;
