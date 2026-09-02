import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Row, Col, Spinner } from "react-bootstrap";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { SHIFTS, STAFF } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
import { useAdminToast } from "../../components/admin/AdminToast";
import useRealtimeSync from "../../utils/useRealtimeSync";
import { isActiveStatus } from "../../utils/statusFormat";

const DAY_NAMES = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const SHIFT_TYPES = [
  { id: 1, name: "Ca 1", range: "07:00 - 13:00", start: "07:00", end: "13:00" },
  { id: 2, name: "Ca 2", range: "13:00 - 19:00", start: "13:00", end: "19:00" },
  { id: 3, name: "Ca 3", range: "19:00 - 01:00", start: "19:00", end: "01:00" },
];
const POSITIONS = [
  { id: "banve", name: "Bán vé", role: "Bán vé" },
  { id: "checkve", name: "Check vé", role: "Soát vé" },
  { id: "donphong", name: "Dọn phòng", role: "Phục vụ" },
];

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

const toIso = (d) => {
  if (!d || isNaN(d.getTime())) return "";
  // Dung thanh phan ngay LOCAL (khong qua toISOString, vi no doi sang UTC va
  // lam lui 1 ngay o mui gio UTC+7 khi gio local la 00:00-06:59) de dateStr
  // luon khop voi nhan Thu trong tuan (DAY_NAMES[day.getDay()]).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatSyncTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

export default function ShiftManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const { showToast, ToastComponent } = useAdminToast();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [dragData, setDragData] = useState(null);
  const [pickerCell, setPickerCell] = useState(null); // { date, shiftName, posId }
  const [pickerDays, setPickerDays] = useState([]); // các ngày được chọn thêm để phân công cùng lúc

  // Auto-scroll logic when dragging
  useEffect(() => {
    if (!dragData) return;

    const handleGlobalDragOver = (e) => {
      const threshold = 120; // Khoảng cách từ mép màn hình để bắt đầu cuộn (px)
      const scrollSpeed = 20; // Tốc độ cuộn
      
      // 1. Cuộn dọc toàn trang
      if (window.innerHeight - e.clientY < threshold) {
        window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
      } else if (e.clientY < threshold) {
        window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
      }

      // 2. Cuộn ngang container bảng (nếu có thanh cuộn)
      const container = document.querySelector('.table-responsive');
      if (container) {
        const rect = container.getBoundingClientRect();
        if (e.clientY > rect.top && e.clientY < rect.bottom) {
          if (e.clientX > rect.right - threshold) {
            container.scrollBy({ left: scrollSpeed, behavior: 'auto' });
          } else if (e.clientX < rect.left + threshold) {
            container.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
          }
        }
      }
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    return () => window.removeEventListener("dragover", handleGlobalDragOver);
  }, [dragData]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekRangeStr = useMemo(() => {
    if (weekDays.length < 7) return "";
    return `${toIso(weekDays[0])} - ${toIso(weekDays[6])}`;
  }, [weekDays]);

  const loadData = useCallback(async () => {
    if (!effectiveCinemaId) return;
    setLoading(true);
    try {
      const staffPath = withQuery(STAFF.LIST, { cinemaId: effectiveCinemaId, search: searchTerm });
      const qShifts = `?cinemaId=${effectiveCinemaId}&startDate=${toIso(weekDays[0])}&endDate=${toIso(weekDays[6])}`;

      const [staffRes, shiftRes] = await Promise.all([
        apiFetch(staffPath),
        apiFetch(`${SHIFTS.LIST}${qShifts}`),
      ]);
      
      const staffJson = await staffRes.json();
      const shiftJson = await shiftRes.json();

      // staff data structure from API: staffId, fullname, role, etc.
      setStaffList(Array.isArray(staffJson?.data) ? staffJson.data : []);
      
      const loadedShifts = (Array.isArray(shiftJson?.data) ? shiftJson.data : []).map(s => ({
        id: s.id,
        serverId: s.id,
        date: s.date,
        shiftType: s.shiftType,
        startTime: s.startTime,
        endTime: s.endTime,
        role: s.role,
        staffId: s.staffId ?? null,
        staffName: s.staffName || "Không tên",
      }));

      setShifts(loadedShifts);
    } catch (err) {
      console.error("Lỗi tải dữ liệu ca làm:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId, weekDays, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStaff = useMemo(() => {
    // Filter out Admin and Super Admin, AND only active staff
    return staffList
      .filter(s => {
        if (!isActiveStatus(s.status)) return false;

        const role = (s.role || "").toLowerCase();
        return !role.includes("admin") && !role.includes("super");
      });
  }, [staffList]);

  const getShiftsInCell = (date, shiftName, role) => {
    return shifts.filter(s => s.date === date && s.shiftType === shiftName && s.role === role);
  };

  // Gán 1 nhân viên vào cùng ca/vị trí cho nhiều ngày đã chọn — lưu ngay lập tức (không qua bước "Lưu" riêng).
  const assignStaffToDays = async (days, shiftObj, posObj, staffId, staffName) => {
    const now = new Date();
    const todayStr = toIso(now);
    let createdCount = 0;
    let skippedPast = 0;
    let skippedDuplicate = 0;
    let failedCount = 0;

    setSaving(true);
    try {
      for (const date of days) {
        if (date < todayStr) { skippedPast++; continue; }
        if (date === todayStr && shiftObj.start) {
          const [h, m] = shiftObj.start.split(":").map(Number);
          const shiftStart = new Date(date + "T00:00:00");
          shiftStart.setHours(h, m, 0, 0);
          if (shiftStart < now) { skippedPast++; continue; }
        }
        const alreadyInShift = shifts.find(s => s.date === date && s.shiftType === shiftObj.name && s.staffId === staffId);
        if (alreadyInShift) { skippedDuplicate++; continue; }

        try {
          const res = await apiFetch(`${SHIFTS.LIST}/individual`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              staffId,
              date,
              shiftType: shiftObj.name,
              startTime: shiftObj.start,
              endTime: shiftObj.end,
              role: posObj.role,
              cinemaId: Number(effectiveCinemaId),
            }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            failedCount++;
            continue;
          }
          const newId = json?.data;
          setShifts(prev => [...prev, {
            id: newId, serverId: newId, date,
            shiftType: shiftObj.name, startTime: shiftObj.start, endTime: shiftObj.end,
            role: posObj.role, staffId, staffName,
          }]);
          createdCount++;
        } catch {
          failedCount++;
        }
      }
    } finally {
      setSaving(false);
    }

    if (createdCount > 0) notifySync("shifts:saved");

    const skippedParts = [];
    if (skippedPast > 0) skippedParts.push(`${skippedPast} ngày/giờ đã qua`);
    if (skippedDuplicate > 0) skippedParts.push(`${skippedDuplicate} ngày đã có ca`);
    if (failedCount > 0) skippedParts.push(`${failedCount} ngày lưu thất bại`);
    const suffix = skippedParts.length > 0 ? ` (bỏ qua ${skippedParts.join(", ")})` : "";

    if (createdCount > 0) {
      showToast(`Đã phân công ${staffName} cho ${createdCount} ngày${suffix}.`, "success");
    } else {
      showToast(`Không thể phân công ${staffName} — tất cả ngày đã chọn đều không hợp lệ hoặc trùng ca.`, "warning");
    }
  };

  const assignStaffToCell = (date, shiftObj, posObj, staffId, staffName) =>
    assignStaffToDays([date], shiftObj, posObj, staffId, staffName);

  const onDropStaff = (date, shiftObj, posObj) => {
    if (!dragData) return;
    assignStaffToCell(date, shiftObj, posObj, dragData.staffId, dragData.staffName);
    setDragData(null);
  };

  const openPicker = (dateStr, shiftName, posId) => {
    const isOpen = pickerCell
      && pickerCell.date === dateStr
      && pickerCell.shiftName === shiftName
      && pickerCell.posId === posId;
    if (isOpen) {
      setPickerCell(null);
      setPickerDays([]);
    } else {
      setPickerCell({ date: dateStr, shiftName, posId });
      setPickerDays([dateStr]);
    }
  };

  const togglePickerDay = (dateStr) => {
    setPickerDays(prev => prev.includes(dateStr)
      ? prev.filter(d => d !== dateStr)
      : [...prev, dateStr]);
  };

  // Gỡ phân công — xóa ngay trên server, không cần bước "Lưu" riêng.
  const handleRemoveShift = async (shift) => {
    setShifts(prev => prev.filter(s => s.id !== shift.id));
    if (!shift.serverId) return;
    setSaving(true);
    try {
      const res = await apiFetch(SHIFTS.BY_ID(shift.serverId), { method: "DELETE" });
      if (!res.ok) {
        showToast(`Bỏ phân công ${shift.staffName} thất bại, vui lòng thử lại.`, "danger");
        await loadData();
        return;
      }
      notifySync("shifts:saved");
    } catch {
      showToast("Lỗi kết nối khi bỏ phân công, vui lòng thử lại.", "danger");
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (weeks) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + (weeks * 7));
    setWeekStart(next);
    // loadData sẽ được gọi tự động qua useEffect vì weekStart thay đổi
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setWeekStart(getWeekStart(new Date(selectedDate)));
    }
  };

  const { lastSyncedAt, syncing: realtimeSyncing, notifySync } = useRealtimeSync({
    enabled: Boolean(effectiveCinemaId),
    intervalMs: 10000,
    hasPendingChanges: saving || Boolean(dragData),
    onSync: loadData,
    channelName: `java6-shifts-${effectiveCinemaId || "none"}`,
  });
  const syncLabel = saving
    ? "Đang lưu..."
    : realtimeSyncing
      ? "Đang đồng bộ"
      : lastSyncedAt
        ? `Đồng bộ ${formatSyncTime(lastSyncedAt)}`
        : "Real-time sẵn sàng";

  if (!effectiveCinemaId) {
    return (
      <AdminPanelPage icon="calendar-check" title="Quản lý Ca làm việc">
        <div className="alert alert-warning border-0 shadow-sm mb-0">
          <strong>Chưa chọn rạp.</strong> {isSuperAdmin ? "Vui lòng chọn rạp trên header để quản lý ca làm việc." : "Tài khoản của bạn chưa được gán cho rạp nào."}
        </div>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage
      icon="calendar-check"
      title="Quản lý Ca làm việc"
      headerRight={
        <div className="d-flex align-items-center gap-3">
          <span className={`admin-realtime-pill ${saving ? "is-paused" : realtimeSyncing ? "is-syncing" : ""}`}>
            {saving && <Spinner animation="border" size="sm" className="me-1" />}
            {syncLabel}
          </span>
          <div className="d-flex align-items-center bg-white rounded shadow-sm px-2 py-1 border">
            <Button 
              variant="link" 
              size="sm" 
              className="p-1 text-muted" 
              onClick={() => navigateWeek(-1)}
              title="Tuần trước"
            >
            </Button>
            <div className="px-2 fw-bold text-primary small" style={{ minWidth: "160px", textAlign: "center", fontSize: '0.8rem' }}>
              {weekRangeStr}
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="p-1 text-muted" 
              onClick={() => navigateWeek(1)}
              title="Tuần sau"
            >
            </Button>
            <div className="position-relative ms-2">
              <input
                type="date"
                className="position-absolute opacity-0"
                style={{ width: '24px', height: '24px', cursor: 'pointer', zIndex: 1, left: 0, top: 0 }}
                onChange={handleDateChange}
                title="Chọn ngày để xem lịch"
              />
              <Button
                variant="link"
                size="sm"
                className="p-1 text-primary"
                title="Chọn ngày để xem lịch"
              >
                Lịch
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {/* Horizontal Staff List at Top */}
      <Card className="admin-card border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 border-0 d-flex align-items-center justify-content-between">
          <h6 className="mb-0 fw-bold d-flex align-items-center">
            Nhân viên sẵn sàng
          </h6>
          <div className="input-group input-group-sm shadow-xs" style={{ maxWidth: '250px' }}>
            <input
              type="text" 
              className="form-control border-start-0" 
              placeholder="Tìm nhân viên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card.Header>
        <Card.Body className="pt-0 pb-3">
          <div className="staff-horizontal-list d-flex gap-3 overflow-auto pb-2" style={{ minHeight: '80px' }}>
            {loading ? (
              <div className="text-center w-100 py-3"><Spinner animation="border" size="sm" variant="primary" /></div>
            ) : filteredStaff.length > 0 ? filteredStaff.map(staff => (
              <div 
                key={staff.staffId || staff.id}
                draggable
                onDragStart={() => setDragData({ staffId: staff.staffId || staff.id, staffName: staff.fullname || staff.fullName || staff.name || "Không tên" })}
                className="staff-item-horizontal d-flex align-items-center p-2 rounded border bg-white shadow-xs"
                style={{ minWidth: '180px', cursor: 'grab' }}
              >
                <div className="bg-primary bg-opacity-10 text-primary rounded p-1 me-2">
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>{staff.fullname || staff.fullName || staff.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Nhân viên rạp</div>
                </div>
              </div>
            )) : (
              <div className="text-center w-100 py-3 text-muted small">Không tìm thấy nhân viên phù hợp</div>
            )}
          </div>
        </Card.Body>
      </Card>

      <div className="mb-4">
        <Card className="admin-card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-bordered mb-0 shift-grid-table">
              <thead className="bg-light">
                <tr>
                  <th className="text-center align-middle" style={{ width: '100px', background: 'var(--admin-bg-subtle)' }}>Ca / Thứ</th>
                  {weekDays.map((day, idx) => (
                    <th key={idx} className="text-center py-2" style={{ minWidth: '150px' }}>
                      <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>{DAY_NAMES[day.getDay()]}</div>
                      <div className="text-muted small fw-normal" style={{ fontSize: '0.75rem' }}>{toIso(day)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFT_TYPES.map(shift => (
                  <tr key={shift.id}>
                    <td className="align-middle text-center bg-light">
                      <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{shift.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>{shift.range}</div>
                    </td>
                    {weekDays.map((day, dIdx) => {
                      const dateStr = toIso(day);
                      const isPast = dateStr < toIso(new Date());
                      return (
                        <td key={dIdx} className="p-2 align-top">
                          <div className="d-flex flex-column gap-2">
                            {POSITIONS.map(pos => {
                              const assignments = getShiftsInCell(dateStr, shift.name, pos.role);
                              const hasAssignments = assignments.length > 0;
                              const isPickerOpen = pickerCell
                                && pickerCell.date === dateStr
                                && pickerCell.shiftName === shift.name
                                && pickerCell.posId === pos.id;
                              return (
                                <div
                                  key={pos.id}
                                  onDragOver={(e) => !isPast && e.preventDefault()}
                                  onDrop={() => !isPast && onDropStaff(dateStr, shift, pos)}
                                  onClick={() => !isPast && openPicker(dateStr, shift.name, pos.id)}
                                  className={`position-slot-v2 p-2 rounded ${
                                    isPast
                                      ? (hasAssignments ? 'border-past-v2 bg-past-assigned' : 'bg-past-empty border-dashed-past')
                                      : (hasAssignments ? 'border-solid-v2 bg-white shadow-xs' : 'bg-light bg-opacity-50')
                                  } ${isPast ? 'past-no-hover' : ''}`}
                                  style={{ cursor: isPast ? 'not-allowed' : 'pointer', minHeight: '60px', position: 'relative' }}
                                >
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className={`d-flex align-items-center gap-1 fw-bold ${isPast ? 'text-muted opacity-50' : 'text-primary opacity-75'}`} style={{ fontSize: '0.6rem' }}>
                                      {pos.name}
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                      {hasAssignments && (
                                        <Badge bg={isPast ? "secondary" : "primary"} className="rounded-pill" style={{ fontSize: '0.55rem' }}>
                                          {assignments.length} người
                                        </Badge>
                                      )}
                                      {!isPast && (
                                        <button
                                          type="button"
                                          className="add-staff-btn-v2 btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                          style={{ width: '18px', height: '18px', fontSize: '0.75rem', lineHeight: 1, padding: 0 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openPicker(dateStr, shift.name, pos.id);
                                          }}
                                          title="Thêm nhân viên vào ca này"
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {isPickerOpen && (() => {
                                    const assignedIdsInShift = new Set(
                                      shifts.filter(s => s.date === dateStr && s.shiftType === shift.name).map(s => s.staffId)
                                    );
                                    const pickerStaffOptions = filteredStaff.filter(
                                      staff => !assignedIdsInShift.has(staff.staffId || staff.id)
                                    );
                                    const todayStr = toIso(new Date());
                                    return (
                                    <div
                                      className="bg-white border rounded shadow-lg"
                                      style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, maxHeight: 280, overflowY: 'auto' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="p-2 border-bottom bg-light">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.6rem' }}>
                                          Áp dụng cho ngày ({pickerDays.length} đã chọn):
                                        </div>
                                        <div className="d-flex flex-wrap gap-1">
                                          {weekDays.map((day, wIdx) => {
                                            const ds = toIso(day);
                                            const dayPast = ds < todayStr;
                                            const daySelected = pickerDays.includes(ds);
                                            return (
                                              <button
                                                key={wIdx}
                                                type="button"
                                                disabled={dayPast}
                                                className={`btn btn-sm ${daySelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                style={{ fontSize: '0.6rem', padding: '2px 6px', opacity: dayPast ? 0.35 : 1 }}
                                                onClick={() => togglePickerDay(ds)}
                                                title={`${DAY_NAMES[day.getDay()]} (${ds})`}
                                              >
                                                {DAY_NAMES[day.getDay()].replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      {pickerStaffOptions.length === 0 ? (
                                        <div className="text-muted small p-2 text-center">Không còn nhân viên trống ca này</div>
                                      ) : pickerStaffOptions.map((staff) => (
                                        <button
                                          key={staff.staffId || staff.id}
                                          type="button"
                                          className="btn btn-light w-100 text-start rounded-0 border-0 py-2 px-3"
                                          style={{ fontSize: '0.75rem' }}
                                          onClick={() => {
                                            const days = pickerDays.length > 0 ? pickerDays : [dateStr];
                                            assignStaffToDays(days, shift, pos, staff.staffId || staff.id, staff.fullname || staff.fullName || staff.name || "Không tên");
                                            setPickerCell(null);
                                            setPickerDays([]);
                                          }}
                                        >
                                          {staff.fullname || staff.fullName || staff.name}
                                        </button>
                                      ))}
                                    </div>
                                    );
                                  })()}

                                  <div className="d-flex flex-column gap-2">
                                    {hasAssignments ? (
                                      assignments.map((assignment, idx) => (
                                        <div 
                                          key={assignment.id || idx} 
                                          className={`d-flex align-items-center gap-2 p-1 rounded ${!isPast ? 'bg-light' : ''}`}
                                          style={{ borderBottom: idx < assignments.length - 1 ? '1px solid var(--admin-border)' : 'none' }}
                                        >
                                          <div className={`${isPast ? 'bg-secondary' : 'bg-success'} bg-opacity-10 ${isPast ? 'text-secondary' : 'text-success'} rounded-circle d-flex align-items-center justify-content-center staff-avatar-sm flex-shrink-0`}>
                                            {assignment.staffName.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-grow-1 overflow-hidden">
                                            <div className={`fw-bold ${isPast ? 'text-muted' : 'text-dark'} text-truncate`} style={{ fontSize: '0.7rem' }}>
                                              {assignment.staffName}
                                            </div>
                                            {!isPast && (
                                              <div className="text-muted" style={{ fontSize: '0.55rem' }}>Đã phân công</div>
                                            )}
                                          </div>
                                          {!isPast && (
                                            <button
                                              className="btn btn-link btn-sm p-0 text-danger opacity-50 hover-opacity-100 flex-shrink-0"
                                              onClick={(e) => { e.stopPropagation(); handleRemoveShift(assignment); }}
                                              title="Bỏ phân công"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-muted text-center py-2" style={{ fontSize: '0.6rem', opacity: isPast ? 0.3 : 0.5 }}>
                                        {isPast ? '—' : 'Bấm hoặc kéo vào đây'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <style>{`
        .shift-management-v2 .staff-item-horizontal {
          transition: all 0.2s;
        }
        .shift-management-v2 .staff-item-horizontal:hover {
          border-color: #6366f1 !important;
          background-color: var(--admin-bg-subtle) !important;
          transform: translateY(-2px);
        }
        .staff-horizontal-list::-webkit-scrollbar {
          height: 6px;
        }
        .staff-horizontal-list::-webkit-scrollbar-track {
          background: var(--admin-bg-subtle);
        }
        .staff-horizontal-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .shift-management-v2 .position-slot-v2 {
          min-height: 48px;
          border: 1px dashed #cbd5e1;
          transition: all 0.2s;
        }
        .shift-management-v2 .position-slot-v2:hover {
          border-color: #6366f1 !important;
          background-color: var(--admin-bg-subtle) !important;
        }
        .shift-management-v2 .border-solid-v2 {
          border: 1px solid #e2e8f0 !important;
          border-left: 3px solid #6366f1 !important;
        }
        .shift-management-v2 .border-past-v2 {
          border: 1px solid #cbd5e1 !important;
          border-left: 3px solid #94a3b8 !important;
        }
        .shift-management-v2 .bg-past-empty {
          background-color: #f8fafc !important;
        }
        .shift-management-v2 .bg-past-assigned {
          background-color: var(--admin-bg-subtle) !important;
        }
        .shift-management-v2 .border-dashed-past {
          border: 1px dashed #e2e8f0 !important;
        }
        .shift-management-v2 .staff-avatar-sm {
          width: 18px;
          height: 18px;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .shift-grid-table th, .shift-grid-table td {
          border-color: var(--admin-border) !important;
        }
        .shift-management-v2 .hover-opacity-100:hover {
          opacity: 1 !important;
        }
        .add-staff-btn-v2 {
          border: none;
          transition: transform 0.15s;
        }
        .add-staff-btn-v2:hover {
          transform: scale(1.15);
        }
        .shadow-xs {
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
      `}</style>
      <ToastComponent />
    </AdminPanelPage>
  );
}
