import React, { useEffect, useState, useCallback, useRef } from "react";
import { Calendar, Clock, RefreshCw, CheckCircle2, History, X, Ticket, ShoppingBag, DollarSign, CreditCard, ChevronRight, Filter } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
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

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterInput, setFilterInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const calRef = useRef(null);

  const openCalendar = () => {
    const base = filterDate ? new Date(filterDate + 'T00:00:00') : new Date();
    setCalYear(base.getFullYear()); setCalMonth(base.getMonth());
    setShowCalendar(v => !v);
  };

  const clearFilter = () => { setFilterDate(''); setFilterInput(''); setShowCalendar(false); };

  const handleFilterInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let fmt = digits;
    if (digits.length > 2) fmt = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) fmt = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    setFilterInput(fmt);
    if (digits.length === 8) {
      const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
      const obj = new Date(`${y}-${m}-${d}T00:00:00`);
      if (!isNaN(obj) && obj.getDate() === +d && obj.getMonth() + 1 === +m) {
        setFilterDate(`${y}-${m}-${d}`);
        setCalYear(+y); setCalMonth(+m - 1);
      }
    } else {
      setFilterDate('');
    }
  };

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

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

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

  const { upcomingShifts, pastShifts } = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
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

      if (status === 'WORKING' || status === 'UPCOMING') {
        upcoming.push({ ...r, status });
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

  const filteredPastShifts = filterDate
    ? pastShifts.filter(s => s.date === filterDate)
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
                <div className="cal-wrapper" ref={calRef}>
                  <div className="date-filter-bar">
                    <Filter size={14} className="filter-icon" />
                    <input
                      type="text"
                      className="filter-text-input"
                      placeholder="DD/MM/YYYY"
                      value={filterInput}
                      onChange={e => handleFilterInput(e.target.value)}
                      maxLength={10}
                    />
                    <button className="cal-toggle-btn" onClick={openCalendar} title="Mở lịch">
                      <Calendar size={14} />
                    </button>
                    {(filterInput || filterDate) && (
                      <button className="clear-filter-btn" onClick={clearFilter} title="Xoá bộ lọc">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {showCalendar && (() => {
                    const today = new Date();
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
                    const cells = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
                    while (cells.length % 7 !== 0) cells.push(null);
                    const selParts = filterDate ? filterDate.split('-').map(Number) : null;
                    const isSelected = d => selParts && selParts[0] === calYear && selParts[1] === calMonth + 1 && selParts[2] === d;
                    const isToday = d => today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
                    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
                    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
                    const pickDay = d => { if (!d) return; const mm = String(calMonth+1).padStart(2,'0'); const dd = String(d).padStart(2,'0'); setFilterDate(`${calYear}-${mm}-${dd}`); setFilterInput(`${dd}/${mm}/${calYear}`); setShowCalendar(false); };
                    const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
                    return (
                      <div className="cal-popup">
                        <div className="cal-header">
                          <button className="cal-nav" onClick={prevMonth}>‹</button>
                          <span className="cal-month-label">{monthNames[calMonth]} {calYear}</span>
                          <button className="cal-nav" onClick={nextMonth}>›</button>
                        </div>
                        <div className="cal-grid">
                          {['T2','T3','T4','T5','T6','T7','CN'].map(d => <div key={d} className="cal-dow">{d}</div>)}
                          {cells.map((d, i) => (
                            <div key={i}
                              className={`cal-day${d ? ' active' : ''}${d && isSelected(d) ? ' selected' : ''}${d && isToday(d) ? ' today' : ''}`}
                              onClick={() => pickDay(d)}
                            >{d || ''}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {filterDate && (
                <div className="filter-active-badge">
                  Đang lọc: {filterDate.split('-').reverse().join('/')}
                  {' '}· {filteredPastShifts.length} ca
                </div>
              )}
              <div className="shifts-grid">
                {filteredPastShifts.length > 0
                  ? filteredPastShifts.map(s => <ShiftCard key={s.id} shift={s} isPast={true} />)
                  : <div className="empty-mini">{filterDate ? `Không có ca làm nào vào ngày đã chọn.` : 'Chưa có lịch sử làm việc.'}</div>}
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
                        <span className="breakdown-method">{r.method}</span>
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
                        <div key={i} className="order-row">
                          <div className="order-code">{o.orderCode}</div>
                          <div className="order-meta">
                            <span className={`order-status-dot ${o.status === 1 ? 'paid' : 'other'}`} />
                            {o.status === 1 ? 'Đã thanh toán' : 'Khác'}
                          </div>
                          <div className="order-amount">{fmtCurrency(o.finalAmount)}</div>
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

        /* Date filter */
        .history-section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
        .cal-wrapper { position: relative; }
        .date-filter-bar { display: flex; align-items: center; gap: 6px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 5px 10px; transition: border-color 0.2s; }
        .date-filter-bar:focus-within { border-color: rgba(56,189,248,0.4); }
        .filter-icon { color: #64748b; flex-shrink: 0; }
        .filter-text-input { background: transparent; border: none; outline: none; color: #f1f5f9; font-size: 13px; font-weight: 600; width: 92px; letter-spacing: 0.5px; }
        .filter-text-input::placeholder { color: #475569; font-weight: 400; letter-spacing: 0; }
        .cal-toggle-btn { background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.15); color: #38bdf8; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; flex-shrink: 0; }
        .cal-toggle-btn:hover { background: rgba(56,189,248,0.2); }
        .clear-filter-btn { background: rgba(239,68,68,0.15); border: none; color: #ef4444; border-radius: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; padding: 0; flex-shrink: 0; }
        .clear-filter-btn:hover { background: rgba(239,68,68,0.3); }
        .filter-active-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(129,140,248,0.1); border: 1px solid rgba(129,140,248,0.2); color: #818cf8; font-size: 12px; font-weight: 600; border-radius: 8px; padding: 5px 12px; margin-bottom: 14px; }

        /* Calendar popup */
        .cal-popup { position: absolute; top: calc(100% + 8px); right: 0; z-index: 200; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; width: 260px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cal-month-label { font-size: 14px; font-weight: 800; color: #f1f5f9; }
        .cal-nav { background: rgba(255,255,255,0.06); border: none; color: #94a3b8; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; line-height: 1; }
        .cal-nav:hover { background: rgba(56,189,248,0.15); color: #38bdf8; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .cal-dow { text-align: center; font-size: 10px; font-weight: 800; color: #475569; padding: 4px 0; text-transform: uppercase; }
        .cal-day { text-align: center; font-size: 13px; font-weight: 500; color: #64748b; padding: 6px 2px; border-radius: 8px; }
        .cal-day.active { color: #cbd5e1; cursor: pointer; transition: all 0.15s; }
        .cal-day.active:hover { background: rgba(56,189,248,0.15); color: #38bdf8; }
        .cal-day.today { color: #38bdf8; font-weight: 800; }
        .cal-day.today::after { content: '·'; display: block; font-size: 16px; line-height: 0; margin-top: 2px; color: #38bdf8; }
        .cal-day.selected { background: #38bdf8 !important; color: #0f172a !important; font-weight: 800; }

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
        .order-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 12px; }
        .order-code { font-weight: 700; color: #38bdf8; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .order-meta { display: flex; align-items: center; gap: 4px; color: #64748b; flex-shrink: 0; }
        .order-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .order-status-dot.paid { background: #10b981; }
        .order-status-dot.other { background: #64748b; }
        .order-amount { font-weight: 700; color: #f1f5f9; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
