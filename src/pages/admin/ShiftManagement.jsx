import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { SHIFTS, STAFF } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
import "../../styles/admin-design-system.css";

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekDays = (startDate) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  return days;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

/** Gom 3 bản ghi StaffShift (cùng ngày + khung giờ) thành 1 nhóm ca */
function groupShiftRows(items) {
  const map = new Map();
  for (const row of items) {
    const key = `${row.date}|${row.startTime}|${row.endTime}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        date: row.date,
        shiftType: row.shiftType,
        startTime: row.startTime,
        endTime: row.endTime,
        repId: row.id,
        banve: null,
        soatve: null,
        phucvu: null,
        status: row.status,
      };
      map.set(key, g);
    }
    if (row.role === "Bán vé") {
      g.banve = row;
      g.repId = row.id;
    } else if (row.role === "Soát vé") g.soatve = row;
    else if (row.role === "Phục vụ") g.phucvu = row;
  }
  return [...map.values()].sort((a, b) => {
    const d = String(a.date).localeCompare(String(b.date));
    if (d !== 0) return d;
    return String(a.startTime).localeCompare(String(b.startTime));
  });
}

export default function ShiftManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [rawShifts, setRawShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekStartStr = formatDate(weekDays[0]);
  const weekEndStr = formatDate(weekDays[6]);

  const loadData = useCallback(async () => {
    if (!effectiveCinemaId) {
      setRawShifts([]);
      setStaffList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qStaff = `?cinemaId=${effectiveCinemaId}`;
      const qShifts = `?cinemaId=${effectiveCinemaId}&startDate=${weekStartStr}&endDate=${weekEndStr}`;
      const [staffRes, shiftRes] = await Promise.all([
        apiFetch(`${STAFF.LIST}${qStaff}`),
        apiFetch(`${SHIFTS.LIST}${qShifts}`),
      ]);
      const [staffJson, shiftJson] = await Promise.all([
        staffRes.json().catch(() => null),
        shiftRes.json().catch(() => null),
      ]);
      let errMsg = null;
      if (!staffRes.ok) {
        errMsg = staffJson?.message || "Không tải được danh sách nhân viên";
        setStaffList([]);
      } else {
        const arr = Array.isArray(staffJson?.data) ? staffJson.data : [];
        setStaffList(arr);
      }
      if (!shiftRes.ok) {
        errMsg = shiftJson?.message || "Không tải được ca làm";
        setRawShifts([]);
      } else {
        const arr = Array.isArray(shiftJson?.data) ? shiftJson.data : [];
        setRawShifts(arr);
      }
      setError(errMsg);
    } catch {
      setError("Không kết nối được máy chủ");
      setRawShifts([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId, weekStartStr, weekEndStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groups = useMemo(() => groupShiftRows(rawShifts), [rawShifts]);

  const staffByRoleCounts = useMemo(() => {
    const c = { "Bán vé": 0, "Soát vé": 0, "Phục vụ": 0, Khác: 0 };
    for (const s of staffList) {
      const r = s.role;
      if (r === "Bán vé" || r === "Soát vé" || r === "Phục vụ") c[r]++;
      else c.Khác++;
    }
    return c;
  }, [staffList]);

  const navigateWeek = (dir) => {
    const n = new Date(weekStart);
    n.setDate(weekStart.getDate() + (dir === "prev" ? -7 : 7));
    setWeekStart(n);
  };

  const handleDeleteGroup = async (repId) => {
    if (!window.confirm("Xóa cả nhóm ca (3 vị trí: Bán vé, Soát vé, Phục vụ)?")) return;
    setDeletingId(repId);
    try {
      const res = await apiFetch(SHIFTS.BY_ID(repId), { method: "DELETE" });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        alert(j?.message || "Xóa ca thất bại");
        return;
      }
      await loadData();
    } catch {
      alert("Không kết nối được máy chủ");
    } finally {
      setDeletingId(null);
    }
  };

  if (!effectiveCinemaId) {
    return (
      <div className="admin-page admin-fade-in">
        <div className="alert alert-warning border-0 shadow-sm">
          <strong>Chưa chọn rạp.</strong>{" "}
          {isSuperAdmin ? "Super Admin: chọn rạp trên header." : "Tài khoản admin cần được gán rạp (cinemaId)."}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-fade-in">
      <div className="admin-action-bar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="admin-section-title m-0">
            <Clock size={20} className="me-2" style={{ verticalAlign: "middle" }} />
            Ca làm theo rạp
          </h2>
          <p className="text-muted small mb-0">
            Mỗi ca gồm 3 nhân viên: <strong>Bán vé</strong>, <strong>Soát vé</strong>, <strong>Phục vụ</strong> (khớp BE). Đồng bộ lịch tuần với API.
          </p>
        </div>
        <Link to={`${prefix}/shifts/add`} className="admin-btn admin-btn-primary text-decoration-none d-inline-flex align-items-center gap-1">
          <Plus size={18} />
          Phân ca mới
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger border-0 shadow-sm small mb-3">{error}</div>
      ) : null}

      <div className="admin-card mb-3">
        <div className="admin-card-header py-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h6 className="admin-card-title mb-0 small d-flex align-items-center gap-1">
            <Users size={16} />
            Nhân viên rạp (lọc theo cinemaId)
          </h6>
          <span className="text-muted small">
            Bán vé: {staffByRoleCounts["Bán vé"]} · Soát vé: {staffByRoleCounts["Soát vé"]} · Phục vụ:{" "}
            {staffByRoleCounts["Phục vụ"]}
            {staffByRoleCounts.Khác ? ` · Vai trò khác: ${staffByRoleCounts.Khác}` : ""}
          </span>
        </div>
        <div className="admin-card-body py-2 small text-muted">
          Phân ca qua nút <strong>Phân ca mới</strong> hoặc <strong>Sửa</strong>. Vai trò trên hợp đồng phải đúng ba nhãn trên thì mới xuất hiện trong dropdown form.
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigateWeek("prev")}>
          <ChevronLeft size={16} />
        </button>
        <div className="d-flex align-items-center gap-2">
          <Calendar size={18} className="text-muted" />
          <span className="fw-bold small">
            {weekStartStr} → {weekEndStr}
          </span>
        </div>
        <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigateWeek("next")}>
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="admin-empty py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 mb-0">Đang tải ca làm…</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-header py-2">
            <h6 className="admin-card-title mb-0 small">Nhóm ca trong tuần ({groups.length})</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ngày</th>
                  <th>Ca</th>
                  <th>Giờ</th>
                  <th>Bán vé</th>
                  <th>Soát vé</th>
                  <th>Phục vụ</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      Chưa có ca trong tuần này.{" "}
                      <Link to={`${prefix}/shifts/add`}>Tạo phân ca</Link>
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => (
                    <tr key={g.key}>
                      <td className="text-nowrap">{g.date}</td>
                      <td>
                        <span className="badge bg-primary">{g.shiftType}</span>
                      </td>
                      <td className="text-nowrap small">
                        {g.startTime} – {g.endTime}
                      </td>
                      <td className="small">{g.banve?.staffName || "—"}</td>
                      <td className="small">{g.soatve?.staffName || "—"}</td>
                      <td className="small">{g.phucvu?.staffName || "—"}</td>
                      <td>
                        <span className="badge bg-secondary">{g.banve?.status || g.status || "—"}</span>
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          to={`${prefix}/shifts/edit/${g.repId}`}
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Sửa nhóm ca"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={deletingId === g.repId}
                          onClick={() => handleDeleteGroup(g.repId)}
                          title="Xóa nhóm ca"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
