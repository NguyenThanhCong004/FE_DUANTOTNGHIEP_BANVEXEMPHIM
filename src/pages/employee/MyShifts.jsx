import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, RefreshCw, CheckCircle2, History, X, Ticket, ShoppingBag, DollarSign, CreditCard, ChevronRight, ChevronLeft } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import InvoiceSummaryCard from "../../components/common/InvoiceSummaryCard";
import { SHIFTS, STAFF_DASHBOARD } from "../../constants/apiEndpoints";
import { withQuery } from "../../utils/apiClient";
import { clearAuthSession } from "../../utils/authStorage";
import { useNavigate } from "react-router-dom";

export default function MyShifts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setClockTick] = useState(0);

  // Filter state — lọc theo tháng/năm
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1–12
  const [filterActive, setFilterActive] = useState(false);

  const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  const prevMonth = () => {
    if (filterMonth === 1) { setFilterMonth(12); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 12) { setFilterMonth(1); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };
  const clearFilter = () => {
    setFilterActive(false);
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
  };
  const applyFilter = () => setFilterActive(true);

  // Panel state
  const [selectedShift, setSelectedShift] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [shiftStats, setShiftStats] = useState(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const res = await apiFetch(SHIFTS.ME);
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        clearAuthSession();
        navigate("/staff/login", { replace: true });
        return;
      }
      if (!res.ok) {
        setError(json?.message || "Không tải được lịch ca");
        setRows([]);
        return;
      }
      const list = json?.data ?? json ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setError("Không kết nối được máy chủ");
      setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTick((tick) => tick + 1);
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const loadShiftDetail = useCallback(async (shift) => {
    setSelectedShift(shift);
    setPanelLoading(true);
    setShiftStats(null);
    setRevenueBreakdown([]);
    setRecentOrders([]);
    try {
      const sid = shift.id;
      const [statsRes, revenueRes, ordersRes] = await Promise.all([
        apiFetch(withQuery(STAFF_DASHBOARD.STATS, { shiftId: sid })),
        apiFetch(withQuery(STAFF_DASHBOARD.REVENUE_BREAKDOWN, { shiftId: sid })),
        apiFetch(withQuery(STAFF_DASHBOARD.RECENT_ORDERS, { shiftId: sid })),
      ]);
      const [statsJson, revenueJson, ordersJson] = await Promise.all([
        statsRes.json().catch(() => null),
        revenueRes.json().catch(() => null),
        ordersRes.json().catch(() => null),
      ]);
      setShiftStats(statsJson?.data ?? null);
      setRevenueBreakdown(revenueJson?.data ?? []);
      setRecentOrders(ordersJson?.data ?? []);
    } catch {
      setShiftStats(null);
    } finally {
      setPanelLoading(false);
    }
  }, []);

  const closePanel = () => setSelectedShift(null);

  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const openOrderDetail = useCallback(async (orderCode) => {
    setOrderDetail({ orderCode, loading: true });
    setOrderDetailLoading(true);
    try {
      const res = await apiFetch(STAFF_DASHBOARD.ORDER_DETAIL(orderCode));
      const json = await res.json().catch(() => null);
      setOrderDetail(json?.data ?? { orderCode });
    } catch {
      setOrderDetail({ orderCode });
    } finally {
      setOrderDetailLoading(false);
    }
  }, []);

  const closeOrderDetail = () => setOrderDetail(null);

  const { upcomingShifts, pastShifts } = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    // Tính ngày Chủ Nhật cuối tuần hiện tại (tuần T2–CN)
    const dayOfWeek = now.getDay(); // 0=CN, 1=T2, ..., 6=T7
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    const endOfWeekStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

    const upcoming = [];
    const past = [];

    rows.forEach(r => {
      const makeLocalTime = (date, time) => {
        if (!date || !time) return null;
        const [year, month, day] = String(date).split('-').map(Number);
        const [hour, minute] = String(time).split(':').map(Number);
        if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
        return new Date(year, month - 1, day, hour, minute, 0, 0);
      };
      const start = makeLocalTime(r.date, r.startTime);
      let end = makeLocalTime(r.date, r.endTime);
      if (start && end && end < start) end.setDate(end.getDate() + 1);

      let status = 'UPCOMING';
      if (start && end) {
        if (now >= start && now <= end) status = 'WORKING';
        else if (now > end) status = 'COMPLETED';
      } else {
        const isToday = r.date === todayStr;
        const isPastDate = r.date < todayStr;
        const isWorkingNow = isToday && currentTimeStr >= r.startTime && currentTimeStr <= r.endTime;
        if (isWorkingNow) status = 'WORKING';
        else if (isPastDate || (isToday && currentTimeStr > r.endTime)) status = 'COMPLETED';
      }

      if ((status === 'WORKING' || status === 'UPCOMING') && r.date <= endOfWeekStr) {
        upcoming.push({ ...r, status });
      } else if (status === 'WORKING' || status === 'UPCOMING') {
        // Ca tuần sau trở đi → không hiển thị, cũng không đưa vào lịch sử
      } else {
        past.push({ ...r, status: 'COMPLETED' });
      }
    });

    upcoming.sort((a, b) => {
      if (a.status === 'WORKING') return -1;
      if (b.status === 'WORKING') return 1;
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    });
    past.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

    return { upcomingShifts: upcoming, pastShifts: past };
  })();

  const filteredPastShifts = filterActive
    ? pastShifts.filter(s => {
        const [y, m] = String(s.date).split('-').map(Number);
        return y === filterYear && m === filterMonth;
      })
    : pastShifts;

  const fmt = (num) => new Intl.NumberFormat('vi-VN').format(num ?? 0);
  const fmtCurrency = (num) => fmt(num) + 'đ';

  const ShiftCard = ({ shift, isPast }) => (
    <div
      className={`shift-card ${isPast ? 'past clickable' : ''} ${shift.status === 'WORKING' ? 'working' : ''} ${selectedShift?.id === shift.id ? 'selected' : ''}`}
      onClick={isPast ? () => loadShiftDetail(shift) : undefined}
    >
      <div className="shift-date-box">
        <span className="month">{new Date(shift.date).toLocaleDateString('vi-VN', { month: 'short' })}</span>
        <span className="day">{new Date(shift.date).getDate()}</span>
      </div>
      <div className="shift-info">
        <div className="shift-type">{shift.shiftType || "Ca làm việc"}</div>
        <div className="shift-time"><Clock size={14} /><span>{shift.startTime} - {shift.endTime}</span></div>
        <div className="shift-role">{shift.role || "Nhân viên"}</div>
      </div>
      <div className="shift-status">
        {shift.status === 'WORKING' ? (
          <span className="status-badge working-now shadow-pulse"><span className="dot" /> Đang làm việc</span>
        ) : isPast ? (
          <span className="status-badge completed"><CheckCircle2 size={12} /> Hoàn thành</span>
        ) : (
          <span className="status-badge upcoming">Sắp tới</span>
        )}
        {isPast && <ChevronRight size={16} className="chevron-hint" />}
      </div>
    </div>
  );

  return (
    <div className="my-shifts-wrapper">
      <div className={`my-shifts-container custom-scrollbar ${selectedShift ? 'panel-open' : ''}`}>
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h4 fw-bold text-white mb-1">Lịch làm việc của tôi</h1>
            <p className="text-white-50 small mb-0">Theo dõi và quản lý các ca làm việc đã được phân công.</p>
          </div>
          <button className="refresh-btn" onClick={() => load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />Làm mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-secondary">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-3">Đang tải lịch làm việc...</p>
          </div>
        ) : error ? (
          <div className="alert-custom">{error}</div>
        ) : (
          <div className="shifts-content-area">
            <section className="shifts-section">
              <h2 className="section-title"><Calendar size={18} /> LỊCH LÀM SẮP TỚI</h2>
              <div className="shifts-grid">
                {upcomingShifts.length > 0
                  ? upcomingShifts.map(s => <ShiftCard key={s.id} shift={s} isPast={false} />)
                  : <div className="empty-mini">Không có lịch làm sắp tới.</div>}
              </div>
            </section>

            <section className="shifts-section mt-5">
              <div className="history-section-header">
                <h2 className="section-title history mb-0"><History size={18} /> LỊCH SỬ CA LÀM <span className="click-hint">— bấm vào ca để xem thống kê</span></h2>
                <div className="month-filter-bar">
                  <button className="month-nav-btn" onClick={prevMonth}><ChevronLeft size={14} /></button>
                  <button
                    className={`month-label-btn ${filterActive ? 'active' : ''}`}
                    onClick={applyFilter}
                  >
                    <Calendar size={13} />
                    {MONTH_NAMES[filterMonth - 1]} {filterYear}
                  </button>
                  <button className="month-nav-btn" onClick={nextMonth}><ChevronRight size={14} /></button>
                  {filterActive && (
                    <button className="clear-filter-btn" onClick={clearFilter} title="Xoá bộ lọc"><X size={13} /></button>
                  )}
                </div>
              </div>
              {filterActive && (
                <div className="filter-active-badge">
                  {MONTH_NAMES[filterMonth - 1]} {filterYear} · {filteredPastShifts.length} ca
                </div>
              )}
              <div className="shifts-grid">
                {filteredPastShifts.length > 0
                  ? filteredPastShifts.map(s => <ShiftCard key={s.id} shift={s} isPast={true} />)
                  : <div className="empty-mini">{filterActive ? `Không có ca làm nào trong ${MONTH_NAMES[filterMonth - 1]} ${filterYear}.` : 'Chưa có lịch sử làm việc.'}</div>}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className={`shift-detail-panel custom-scrollbar ${selectedShift ? 'open' : ''}`}>
        {selectedShift && (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">Thống kê ca làm</div>
                <div className="panel-subtitle">
                  {new Date(selectedShift.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' · '}{selectedShift.startTime} – {selectedShift.endTime}
                </div>
              </div>
              <button className="close-panel-btn" onClick={closePanel}><X size={18} /></button>
            </div>

            {panelLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-info" role="status" /></div>
            ) : (
              <div className="panel-body">
                {/* Stats */}
                <div className="panel-stats-grid">
                  <div className="panel-stat-card">
                    <DollarSign size={20} className="stat-icon revenue" />
                    <div className="stat-label">Doanh thu</div>
                    <div className="stat-value">{fmtCurrency(shiftStats?.totalRevenue)}</div>
                  </div>
                  <div className="panel-stat-card">
                    <Ticket size={20} className="stat-icon ticket" />
                    <div className="stat-label">Vé đã bán</div>
                    <div className="stat-value">{fmt(shiftStats?.totalTicketsSold)}</div>
                  </div>
                  <div className="panel-stat-card">
                    <ShoppingBag size={20} className="stat-icon food" />
                    <div className="stat-label">Sản phẩm</div>
                    <div className="stat-value">{fmt(shiftStats?.totalProductsSold)}</div>
                  </div>
                </div>

                {/* Revenue breakdown */}
                {revenueBreakdown.length > 0 && (
                  <div className="panel-section">
                    <div className="panel-section-title"><CreditCard size={14} /> Doanh thu theo thanh toán</div>
                    {revenueBreakdown.map((r, i) => (
                      <div key={i} className="breakdown-row">
                        <span className="breakdown-method">{r.method === 'CASH' ? 'Tiền mặt' : r.method === 'TRANSFER' ? 'Chuyển khoản' : r.method}</span>
                        <span className="breakdown-amount">{fmtCurrency(r.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent orders */}
                <div className="panel-section">
                  <div className="panel-section-title"><ShoppingBag size={14} /> Hóa đơn trong ca</div>
                  {recentOrders.length === 0 ? (
                    <div className="empty-mini" style={{ padding: '16px', fontSize: '13px' }}>Không có hóa đơn nào trong ca này.</div>
                  ) : (
                    <div className="orders-list">
                      {recentOrders.map((o, i) => (
                        <div key={i} className="order-row clickable" onClick={() => openOrderDetail(o.orderCode)}>
                          <div className="order-code">{o.orderCode}</div>
                          <div className="order-meta">
                            <span className={`order-status-dot ${o.status === 1 ? 'paid' : 'other'}`} />
                            {o.status === 1 ? 'Đã thanh toán' : 'Khác'}
                          </div>
                          <div className="order-amount">{fmtCurrency(o.finalAmount)}</div>
                          <ChevronRight size={13} style={{ color: '#475569', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {orderDetail && (
        <div className="pos-overlay" onClick={closeOrderDetail}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết hóa đơn</h3>
              <button className="close-btn" onClick={closeOrderDetail}><X size={20} /></button>
            </div>
            <div className="modal-body custom-scrollbar">
              {orderDetailLoading
                ? <div className="text-center py-5"><div className="spinner-border text-info" role="status" /></div>
                : <InvoiceSummaryCard order={orderDetail} />}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .my-shifts-wrapper { display: flex; height: calc(100vh - 64px); background: #0f172a; overflow: hidden; }

        .my-shifts-container {
          flex: 1;
          padding: 24px;
          color: white;
          overflow-y: auto;
          transition: all 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .refresh-btn { display: flex; align-items: center; gap: 8px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2); color: #38bdf8; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .refresh-btn:hover { background: #38bdf8; color: #0f172a; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .shifts-section { margin-bottom: 32px; }
        .section-title { font-size: 14px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; letter-spacing: 1px; }
        .section-title.history { color: #94a3b8; }
        .click-hint { font-size: 11px; font-weight: 400; color: #475569; letter-spacing: 0; }

        .shifts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        .shift-card { background: #1e293b; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; position: relative; overflow: hidden; }
        .shift-card.clickable { cursor: pointer; }
        .shift-card:hover { transform: translateY(-3px); border-color: #38bdf8; box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
        .shift-card.past { opacity: 0.75; background: rgba(30,41,59,0.5); }
        .shift-card.past:hover { opacity: 1; }
        .shift-card.working { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.25); background: rgba(30,41,59,1); }
        .shift-card.selected { border-color: #818cf8; background: rgba(30,41,59,1); opacity: 1; box-shadow: 0 0 0 2px rgba(129,140,248,0.3); }

        .chevron-hint { color: #475569; margin-left: auto; flex-shrink: 0; transition: color 0.2s; }
        .shift-card:hover .chevron-hint { color: #38bdf8; }

        .shift-date-box { width: 56px; height: 56px; background: #0f172a; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.05); }
        .shift-date-box .month { font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; }
        .shift-date-box .day { font-size: 20px; font-weight: 900; color: #f1f5f9; line-height: 1; }

        .shift-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .shift-type { font-weight: 800; font-size: 14px; color: #f1f5f9; }
        .shift-time { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; font-weight: 600; }
        .shift-role { font-size: 11px; color: #38bdf8; font-weight: 700; background: rgba(56,189,248,0.1); padding: 2px 8px; border-radius: 4px; width: fit-content; margin-top: 2px; }

        .shift-status { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .status-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 100px; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
        .status-badge.upcoming { background: #38bdf8; color: #0f172a; }
        .status-badge.completed { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .status-badge.working-now { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); animation: pulse-border 2s infinite; }
        .status-badge.working-now .dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: blink 1s infinite; flex-shrink: 0; }
        @keyframes pulse-border { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .empty-mini { padding: 30px; text-align: center; background: rgba(15,23,42,0.3); border-radius: 16px; color: #64748b; font-size: 14px; border: 1px dashed rgba(255,255,255,0.1); }
        .alert-custom { background: rgba(239,68,68,0.1); color: #ef4444; padding: 16px; border-radius: 12px; border: 1px solid rgba(239,68,68,0.2); font-weight: 600; }

        /* Month filter */
        .history-section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
        .month-filter-bar { display: flex; align-items: center; gap: 4px; }
        .month-nav-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; flex-shrink: 0; }
        .month-nav-btn:hover { background: rgba(56,189,248,0.1); color: #38bdf8; border-color: rgba(56,189,248,0.3); }
        .month-label-btn { display: flex; align-items: center; gap: 6px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; border-radius: 8px; padding: 5px 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .month-label-btn:hover { border-color: rgba(56,189,248,0.4); color: #38bdf8; }
        .month-label-btn.active { background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.4); color: #38bdf8; }
        .clear-filter-btn { background: rgba(239,68,68,0.15); border: none; color: #ef4444; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; margin-left: 2px; }
        .clear-filter-btn:hover { background: rgba(239,68,68,0.3); }
        .filter-active-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(129,140,248,0.1); border: 1px solid rgba(129,140,248,0.2); color: #818cf8; font-size: 12px; font-weight: 600; border-radius: 8px; padding: 5px 12px; margin-bottom: 14px; }

        /* Detail Panel */
        .shift-detail-panel {
          width: 0;
          overflow: hidden;
          background: #1e293b;
          border-left: 1px solid rgba(255,255,255,0.06);
          transition: width 0.3s ease;
          color: white;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .shift-detail-panel.open { width: 360px; }

        .panel-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; position: sticky; top: 0; background: #1e293b; z-index: 1; }
        .panel-title { font-size: 15px; font-weight: 800; color: #f1f5f9; }
        .panel-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .close-panel-btn { background: rgba(255,255,255,0.05); border: none; color: #94a3b8; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .close-panel-btn:hover { background: rgba(255,255,255,0.1); color: white; }

        .panel-body { padding: 16px; display: flex; flex-direction: column; gap: 20px; }

        .panel-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .panel-stat-card { background: #0f172a; border-radius: 12px; padding: 12px 10px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
        .stat-icon { margin: 0 auto 6px; display: block; }
        .stat-icon.revenue { color: #f59e0b; }
        .stat-icon.ticket { color: #38bdf8; }
        .stat-icon.food { color: #a78bfa; }
        .stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 14px; font-weight: 800; color: #f1f5f9; word-break: break-all; }

        .panel-section { background: #0f172a; border-radius: 12px; padding: 14px; border: 1px solid rgba(255,255,255,0.05); }
        .panel-section-title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }

        .breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-method { color: #94a3b8; }
        .breakdown-amount { font-weight: 700; color: #f59e0b; }

        .orders-list { display: flex; flex-direction: column; gap: 6px; }
        .order-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 12px; border: 1px solid transparent; transition: all 0.15s; }
        .order-row.clickable { cursor: pointer; }
        .order-row.clickable:hover { background: rgba(56,189,248,0.06); border-color: rgba(56,189,248,0.2); }
        .order-code { font-weight: 700; color: #38bdf8; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .order-meta { display: flex; align-items: center; gap: 4px; color: #64748b; flex-shrink: 0; }
        .order-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .order-status-dot.paid { background: #10b981; }
        .order-status-dot.other { background: #64748b; }
        .order-amount { font-weight: 700; color: #f1f5f9; flex-shrink: 0; }

        /* Order detail modal — giống Dashboard */
        .pos-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px; }
        .detail-modal { background: #1e293b; border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #f1f5f9; }
        .modal-body { flex: 1; overflow-y: auto; padding: 24px; }
        .close-btn { background: transparent; border: none; color: #64748b; cursor: pointer; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: rgba(255,255,255,0.05); color: white; }
      `}</style>
    </div>
  );
}
