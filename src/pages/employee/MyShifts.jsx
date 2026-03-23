import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { SHIFTS } from "../../constants/apiEndpoints";
import { clearAuthSession } from "../../utils/authStorage";
import { useNavigate } from "react-router-dom";

export default function MyShifts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(SHIFTS.ME);
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        clearAuthSession();
        navigate("/login", { replace: true });
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
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedByDate = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const d = r.date || "—";
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(r);
    }
    return [...m.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  }, [rows]);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold text-white mb-1">Ca làm của tôi</h1>
          <p className="text-secondary small mb-0">
            Chỉ hiển thị các ca được phân cho tài khoản của bạn (theo hệ thống).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-info btn-sm d-flex align-items-center gap-2"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5 text-secondary">
          <div className="spinner-border text-info" role="status" />
          <p className="mt-3 mb-0">Đang tải lịch ca…</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger border-0 shadow-sm">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-3 p-5 text-center border border-secondary border-opacity-25 bg-dark bg-opacity-25">
          <Calendar className="mx-auto mb-3 text-secondary" size={40} />
          <p className="fw-semibold text-white mb-1">Chưa có ca nào được phân</p>
          <p className="text-secondary small mb-0">
            Khi quản lý rạp thêm bạn vào ca (Bán vé / Soát vé / Phục vụ), lịch sẽ hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {groupedByDate.map(([date, items]) => (
            <section key={date}>
              <h2 className="h6 text-info mb-3 d-flex align-items-center gap-2">
                <Calendar size={18} />
                {date}
              </h2>
              <div className="table-responsive rounded-3 border border-secondary border-opacity-25 overflow-hidden">
                <table className="table table-dark table-hover mb-0 align-middle">
                  <thead className="table-secondary text-dark">
                    <tr>
                      <th>Ca</th>
                      <th>Giờ</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id}>
                        <td className="fw-semibold">{r.shiftType || "—"}</td>
                        <td>
                          <span className="d-inline-flex align-items-center gap-1">
                            <Clock size={14} className="text-secondary" />
                            {r.startTime || "—"} – {r.endTime || "—"}
                          </span>
                        </td>
                        <td>{r.role || "—"}</td>
                        <td>
                          <span className="badge bg-primary bg-opacity-75">{r.status || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
