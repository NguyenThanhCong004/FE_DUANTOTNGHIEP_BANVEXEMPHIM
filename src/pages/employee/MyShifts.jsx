import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, RefreshCw, ChevronRight, CheckCircle2, History } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { SHIFTS } from "../../constants/apiEndpoints";
import { clearAuthSession } from "../../utils/authStorage";
import { useNavigate } from "react-router-dom";

export default function MyShifts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setClockTick] = useState(0);

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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTick((tick) => tick + 1);
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const { upcomingShifts, pastShifts } = (() => {
    const now = new Date();
    // Lấy ngày local YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    
    const upcoming = [];
    const past = [];

    rows.forEach(r => {
      // Không parse ISO không có timezone bằng new Date(string): trình duyệt có thể hiểu UTC.
      // Tạo Date theo giờ địa phương Việt Nam từ date + HH:mm, đồng thời hỗ trợ ca qua nửa đêm.
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
        if (now >= start && now <= end) {
          status = 'WORKING';
        } else if (now > end) {
          status = 'COMPLETED';
        }
      } else {
        // Fallback cho dữ liệu cũ nếu không có raw times
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

    // Sắp xếp ca tương lai: ca đang làm việc lên đầu, sau đó theo thời gian tăng dần
    upcoming.sort((a, b) => {
      if (a.status === 'WORKING') return -1;
      if (b.status === 'WORKING') return 1;
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    });
    
    past.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

    return { upcomingShifts: upcoming, pastShifts: past };
  })();

  const ShiftCard = ({ shift, isPast }) => (
    <div className={`shift-card ${isPast ? 'past' : ''} ${shift.status === 'WORKING' ? 'working' : ''}`}>
      <div className="shift-date-box">
        <span className="month">{new Date(shift.date).toLocaleDateString('vi-VN', { month: 'short' })}</span>
        <span className="day">{new Date(shift.date).getDate()}</span>
      </div>
      <div className="shift-info">
        <div className="shift-type">{shift.shiftType || "Ca làm việc"}</div>
        <div className="shift-time">
          <Clock size={14} />
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        <div className="shift-role">{shift.role || "Nhân viên"}</div>
      </div>
      <div className="shift-status">
        {shift.status === 'WORKING' ? (
          <span className="status-badge working-now shadow-pulse">
            <span className="dot" /> Đang làm việc
          </span>
        ) : isPast ? (
          <span className="status-badge completed"><CheckCircle2 size={12} /> Hoàn thành</span>
        ) : (
          <span className="status-badge upcoming">Sắp tới</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="my-shifts-container custom-scrollbar">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-white mb-1">Lịch làm việc của tôi</h1>
          <p className="text-white-50 small mb-0">Theo dõi và quản lý các ca làm việc đã được phân công.</p>
        </div>
        <button className="refresh-btn" onClick={() => load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Làm mới
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
          {/* Section: Upcoming */}
          <section className="shifts-section">
            <h2 className="section-title"><Calendar size={18} /> LỊCH LÀM SẮP TỚI</h2>
            <div className="shifts-grid">
              {upcomingShifts.length > 0 ? (
                upcomingShifts.map(s => <ShiftCard key={s.id} shift={s} isPast={false} />)
              ) : (
                <div className="empty-mini">Không có lịch làm sắp tới.</div>
              )}
            </div>
          </section>

          {/* Section: History */}
          <section className="shifts-section mt-5">
            <h2 className="section-title history"><History size={18} /> LỊCH SỬ CA LÀM</h2>
            <div className="shifts-grid">
              {pastShifts.length > 0 ? (
                pastShifts.map(s => <ShiftCard key={s.id} shift={s} isPast={true} />)
              ) : (
                <div className="empty-mini">Chưa có lịch sử làm việc.</div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .my-shifts-container { 
          padding: 24px; 
          color: white; 
          height: calc(100vh - 64px); 
          overflow-y: auto; 
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        .refresh-btn { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          background: rgba(56, 189, 248, 0.1); 
          border: 1px solid rgba(56, 189, 248, 0.2); 
          color: #38bdf8; 
          padding: 8px 16px; 
          border-radius: 10px; 
          font-size: 13px; 
          font-weight: 700; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .refresh-btn:hover { background: #38bdf8; color: #0f172a; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .shifts-section { margin-bottom: 32px; }
        .section-title { 
          font-size: 14px; 
          font-weight: 800; 
          color: #38bdf8; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          margin-bottom: 20px; 
          letter-spacing: 1px;
        }
        .section-title.history { color: #94a3b8; }

        .shifts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        
        .shift-card { 
          background: #1e293b; 
          border-radius: 16px; 
          padding: 16px; 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          border: 1px solid rgba(255,255,255,0.05); 
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .shift-card:hover { transform: translateY(-4px); border-color: #38bdf8; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .shift-card.past { opacity: 0.7; background: rgba(30, 41, 59, 0.5); }
        .shift-card.past:hover { opacity: 1; }
        .shift-card.working { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.25); background: rgba(30,41,59,1); }

        .status-badge.working-now { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); animation: pulse-border 2s infinite; }
        .status-badge.working-now .dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: blink 1s infinite; flex-shrink: 0; }
        @keyframes pulse-border { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .shadow-pulse { }

        .shift-date-box { 
          width: 60px; 
          height: 60px; 
          background: #0f172a; 
          border-radius: 12px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .shift-date-box .month { font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; }
        .shift-date-box .day { font-size: 20px; font-weight: 900; color: #f1f5f9; line-height: 1; }

        .shift-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .shift-type { font-weight: 800; font-size: 15px; color: #f1f5f9; }
        .shift-time { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; font-weight: 600; }
        .shift-role { font-size: 12px; color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 4px; width: fit-content; margin-top: 4px; }

        .status-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 100px; display: flex; align-items: center; gap: 4px; }
        .status-badge.upcoming { background: #38bdf8; color: #0f172a; }
        .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

        .empty-mini { padding: 30px; text-align: center; background: rgba(15, 23, 42, 0.3); border-radius: 16px; color: #64748b; font-size: 14px; border: 1px dashed rgba(255,255,255,0.1); }
        .alert-custom { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 16px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); font-weight: 600; }
      `}</style>
    </div>
  );
}
