import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Row, Col, Spinner } from "react-bootstrap";
import { Users, GripVertical, Search, Clock, Calendar, Save, Trash2, UserPlus, ShieldCheck, Brush, ChevronLeft, ChevronRight } from "lucide-react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { SHIFTS, STAFF } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

const DAY_NAMES = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const SHIFT_TYPES = [
  { id: 1, name: "Ca 1", range: "07:00 - 13:00", start: "07:00", end: "13:00" },
  { id: 2, name: "Ca 2", range: "13:00 - 19:00", start: "13:00", end: "19:00" },
  { id: 3, name: "Ca 3", range: "19:00 - 01:00", start: "19:00", end: "01:00" },
];
const POSITIONS = [
  { id: "banve", name: "Bán vé", icon: <UserPlus size={14} />, role: "Bán vé" },
  { id: "checkve", name: "Check vé", icon: <ShieldCheck size={14} />, role: "Soát vé" },
  { id: "donphong", name: "Dọn phòng", icon: <Brush size={14} />, role: "Phục vụ" },
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
  return d.toISOString().slice(0, 10);
};

export default function ShiftManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [dragData, setDragData] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekRangeStr = useMemo(() => {
    if (weekDays.length < 7) return "";
    return `${toIso(weekDays[0])} - ${toIso(weekDays[6])}`;
  }, [weekDays]);

  const loadData = useCallback(async () => {
    if (!effectiveCinemaId) return;
    setLoading(true);
    try {
      const qStaff = `?cinemaId=${effectiveCinemaId}`;
      const qShifts = `?cinemaId=${effectiveCinemaId}&startDate=${toIso(weekDays[0])}&endDate=${toIso(weekDays[6])}`;
      
      const [staffRes, shiftRes] = await Promise.all([
        apiFetch(`${STAFF.LIST}${qStaff}`),
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
        staffId: s.staffId,
        staffName: s.staffName || "Không tên",
        dirty: false
      }));
      setShifts(loadedShifts);
      setPendingDeleteIds([]);
    } catch (err) {
      console.error("Lỗi tải dữ liệu ca làm:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId, weekStart, weekDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStaff = useMemo(() => {
    // Filter out Admin and Super Admin
    return staffList
      .filter(s => {
        const role = (s.role || "").toLowerCase();
        return !role.includes("admin") && !role.includes("super");
      })
      .filter(s => (s.fullname || s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staffList, searchTerm]);

  const getShiftInCell = (date, shiftName, role) => {
    return shifts.find(s => s.date === date && s.shiftType === shiftName && s.role === role);
  };

  const onDropStaff = (date, shiftObj, posObj) => {
    if (!dragData) return;
    const { staffId, staffName } = dragData;
    
    // Check if staff already has a shift in this specific CA (Ca 1, Ca 2, or Ca 3) on this day
    const alreadyInShift = shifts.find(s => s.date === date && s.shiftType === shiftObj.name && s.staffId === staffId);
    
    if (alreadyInShift) {
      if (alreadyInShift.role === posObj.role) return; // Same position, do nothing
      alert(`Nhân viên ${staffName} đã được phân công vị trí "${alreadyInShift.role}" trong ${shiftObj.name}. Một người không thể làm nhiều vị trí trong cùng một ca.`);
      return;
    }

    const existing = getShiftInCell(date, shiftObj.name, posObj.role);
    
    if (existing) {
      setShifts(prev => prev.map(s => 
        s === existing 
          ? { ...s, staffId, staffName, dirty: true } 
          : s
      ));
    } else {
      const newShift = {
        id: `local-${Date.now()}-${Math.random()}`,
        serverId: null,
        date,
        shiftType: shiftObj.name,
        startTime: shiftObj.start,
        endTime: shiftObj.end,
        role: posObj.role,
        staffId,
        staffName,
        dirty: false
      };
      setShifts(prev => [...prev, newShift]);
    }
    setDragData(null);
  };

  const handleRemoveShift = (shift) => {
    if (shift.serverId) {
      setPendingDeleteIds(prev => [...prev, shift.serverId]);
    }
    setShifts(prev => prev.filter(s => s.id !== shift.id));
  };

  const handleSave = async () => {
    if (!effectiveCinemaId) return;
    setSaving(true);
    try {
      for (const id of pendingDeleteIds) {
        await apiFetch(SHIFTS.BY_ID(id), { method: "DELETE" });
      }
      
      for (const s of shifts) {
        if (!s.serverId || s.dirty) {
          const body = {
            staffId: s.staffId,
            date: s.date,
            shiftType: s.shiftType,
            startTime: s.startTime,
            endTime: s.endTime,
            role: s.role,
            cinemaId: Number(effectiveCinemaId)
          };
          
          if (s.serverId) {
            await apiFetch(SHIFTS.BY_ID(s.serverId), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
          } else {
            await apiFetch(SHIFTS.LIST, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
          }
        }
      }
      alert("Đã lưu lịch làm việc thành công!");
      await loadData();
    } catch (err) {
      alert("Lỗi khi lưu lịch làm việc.");
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (weeks) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + (weeks * 7));
    setWeekStart(next);
  };

  const hasChanges = pendingDeleteIds.length > 0 || shifts.some(s => !s.serverId || s.dirty);

  if (!effectiveCinemaId) {
    return (
      <AdminPanelPage icon="calendar-check" title="Quản lý Ca làm việc" description="Chọn rạp để phân lịch">
        <div className="alert alert-warning border-0 shadow-sm mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Chưa chọn rạp.</strong> {isSuperAdmin ? "Vui lòng chọn rạp từ thanh sidebar để quản lý ca làm việc." : "Tài khoản của bạn chưa được gán cho rạp nào."}
        </div>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage
      icon="calendar-check"
      title="Quản lý Ca làm việc"
      description={
        <div className="d-flex align-items-center gap-2">
          <span>Phân bổ nhân sự trực quan bằng cách kéo thả.</span>
          {hasChanges && <Badge bg="warning" text="dark" className="admin-fade-in">Có thay đổi chưa lưu</Badge>}
        </div>
      }
      headerRight={
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center bg-white rounded shadow-sm px-2 py-1 border">
            <Button variant="link" size="sm" className="p-1 text-muted" onClick={() => navigateWeek(-1)}>
              <ChevronLeft size={16} />
            </Button>
            <div className="px-2 fw-bold text-primary small" style={{ minWidth: "160px", textAlign: "center", fontSize: '0.8rem' }}>
              {weekRangeStr}
            </div>
            <Button variant="link" size="sm" className="p-1 text-muted" onClick={() => navigateWeek(1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
          
          <Button 
            variant="light" 
            className="fw-bold text-primary shadow-sm d-flex align-items-center px-3"
            disabled={saving || !hasChanges}
            onClick={handleSave}
            style={{ height: '38px' }}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-2" /> : <Save size={18} className="me-2" />}
            Lưu lịch làm việc
          </Button>
        </div>
      }
    >
      {/* Horizontal Staff List at Top */}
      <Card className="admin-card border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 border-0 d-flex align-items-center justify-content-between">
          <h6 className="mb-0 fw-bold d-flex align-items-center">
            <Users size={18} className="me-2 text-primary" />
            Nhân viên sẵn sàng
          </h6>
          <div className="input-group input-group-sm shadow-xs" style={{ maxWidth: '250px' }}>
            <span className="input-group-text bg-white border-end-0"><Search size={14} /></span>
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
                  <GripVertical size={14} />
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>{staff.fullname || staff.fullName || staff.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>{staff.role}</div>
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
                  <th className="text-center align-middle" style={{ width: '100px', background: '#f8f9fa' }}>Ca / Thứ</th>
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
                      return (
                        <td key={dIdx} className="p-2 align-top">
                          <div className="d-flex flex-column gap-2">
                            {POSITIONS.map(pos => {
                              const assignment = getShiftInCell(dateStr, shift.name, pos.role);
                              return (
                                <div 
                                  key={pos.id}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => onDropStaff(dateStr, shift, pos)}
                                  className={`position-slot-v2 p-2 rounded ${assignment ? 'border-solid-v2 bg-white shadow-xs' : 'bg-light bg-opacity-50'}`}
                                >
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <div className="d-flex align-items-center gap-1 text-muted fw-bold" style={{ fontSize: '0.6rem' }}>
                                      {pos.icon} {pos.name}
                                    </div>
                                    {assignment && (
                                      <button 
                                        className="btn btn-link btn-sm p-0 text-danger opacity-50 hover-opacity-100"
                                        onClick={() => handleRemoveShift(assignment)}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {assignment ? (
                                    <div className="d-flex align-items-center overflow-hidden">
                                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.75rem' }}>
                                        {assignment.staffName}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted italic text-center" style={{ fontSize: '0.6rem', opacity: 0.5 }}>Trống</div>
                                  )}
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
          background-color: #f5f3ff !important;
          transform: translateY(-2px);
        }
        .staff-horizontal-list::-webkit-scrollbar {
          height: 6px;
        }
        .staff-horizontal-list::-webkit-scrollbar-track {
          background: #f1f5f9;
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
          background-color: #f5f3ff !important;
        }
        .shift-management-v2 .border-solid-v2 {
          border: 1px solid #e2e8f0 !important;
          border-left: 3px solid #6366f1 !important;
        }
        .shift-management-v2 .staff-avatar-sm {
          width: 18px;
          height: 18px;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .shift-grid-table th, .shift-grid-table td {
          border-color: #f1f5f9 !important;
        }
        .shift-management-v2 .hover-opacity-100:hover {
          opacity: 1 !important;
        }
        .shadow-xs {
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
      `}</style>
    </AdminPanelPage>
  );
}
