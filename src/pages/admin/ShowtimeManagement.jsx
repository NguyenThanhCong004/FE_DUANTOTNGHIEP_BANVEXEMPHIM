import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Row, Col, Modal } from "react-bootstrap";
import { Film, GripVertical, Search, Clock, Calendar, Hash, CreditCard } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { ROOMS, MOVIES, SHOWTIMES } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
// Hàm tạo các mốc thời gian (cách nhau 5 phút theo spec)
const makeMinuteSlots = (startHour = 0, endHour = 24, interval = 5) => {
  const result = [];
  // Create slots from 00:00 to 24:00 exactly
  const maxMinutes = 24 * 60; // 24:00 in minutes
  for (let m = 0; m <= maxMinutes; m += interval) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    result.push(`${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  }
  return result;
};

// Hàm tính giờ kết thúc
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  // Hiển thị giờ kết thúc thực tế (có thể > 24)
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};
const SLOT_INTERVAL = 5; // 5 phút mỗi ô
const SLOT_WIDTH = 8;   // 8px width mỗi ô
const TIME_SLOTS = makeMinuteSlots(0, 23, SLOT_INTERVAL); 
const toIso = (d) => new Date(d).toISOString().slice(0, 10);
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const isOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const INITIAL_STATE = { rooms: [], movies: [], events: [] };

const DAY_NAMES = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function ShowtimeManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [state, setState] = useState(INITIAL_STATE);
  const [dataLoading, setDataLoading] = useState(false);
  const [globalDate, setGlobalDate] = useState(toIso(new Date()));
  const [roomDates, setRoomDates] = useState({});
  const [movieSearchTerm, setMovieSearchTerm] = useState("");
  const [individualDateMode, setIndividualDateMode] = useState(false); // Toggle for individual date mode
  const [dragData, setDragData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [dragRoomState, setDragRoomState] = useState({ draggedId: null, targetId: null, dragType: null });
  const [deleteZone, setDeleteZone] = useState(false); // Track if dragging over delete zone
  const [autoScrollInterval, setAutoScrollInterval] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // VAT Settings per Day of Week (0: Sunday, 1: Monday, ..., 6: Saturday)
  const [weeklyVAT, setWeeklyVAT] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0
  });

  const handleShowDetail = (ev) => {
    setDetailEvent(ev);
    setShowDetailModal(true);
  };

  const getVATForDate = (dateString) => {
    const day = new Date(dateString).getDay();
    return weeklyVAT[day] || 0;
  };

  const calculateFinalPrice = (basePrice, vatPercent) => {
    return basePrice * (1 + vatPercent / 100);
  };

  const formatFetchedData = (roomsJson, moviesJson, stJson) => {
    const rooms = (roomsJson?.data || []).map(r => ({
      id: r.id,
      name: r.name,
      status: r.status === 1 ? "active" : "inactive",
    }));

    const movies = (moviesJson?.data || []).map(m => ({
      id: m.id,
      title: m.title,
      durationMin: m.duration ?? 120,
      basePrice: m.basePrice ?? 60000,
    }));

    const events = (stJson?.data || []).map((st) => ({
      id: st.id,
      serverId: st.id,
      movieId: st.movie_id ?? st.movieId,
      roomId: st.room_id ?? st.roomId,
      date: st.date,
      startTime: st.time,
      vatPercent: st.vat != null ? Number(st.vat) : 0,
      dirty: false,
    }));

    return { rooms, movies, events };
  };

  const loadShowtimeData = useCallback(async () => {
    if (!effectiveCinemaId) {
      setState(INITIAL_STATE);
      setPendingDeleteIds([]);
      return;
    }
    setDataLoading(true);
    try {
      const query = `?cinemaId=${effectiveCinemaId}`;
      const responses = await Promise.all([
        apiFetch(`${ROOMS.LIST}${query}`),
        apiFetch(MOVIES.LIST),
        apiFetch(`${SHOWTIMES.LIST}${query}`),
      ]);
      const [roomsJson, moviesJson, stJson] = await Promise.all(responses.map((res) => res.json().catch(() => null)));
      const formattedData = formatFetchedData(roomsJson, moviesJson, stJson);
      setState(formattedData);
      setPendingDeleteIds([]);
      setRoomDates((prev) => {
        const newDates = { ...prev };
        formattedData.rooms.forEach((r) => {
          if (!newDates[r.id]) newDates[r.id] = toIso(new Date());
        });
        return newDates;
      });
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu suất chiếu:", e);
    } finally {
      setDataLoading(false);
    }
  }, [effectiveCinemaId]);

  useEffect(() => {
    loadShowtimeData();
  }, [loadShowtimeData]);

  const hasUnsavedChanges =
    pendingDeleteIds.length > 0 || state.events.some((e) => e.serverId == null || e.dirty);

  const handleSaveShowtimes = async () => {
    if (!effectiveCinemaId || !hasUnsavedChanges) return;
    const toDelete = [...pendingDeleteIds];
    const snapshot = state.events.map((e) => ({ ...e }));
    setSaving(true);
    try {
      for (const sid of toDelete) {
        const res = await apiFetch(SHOWTIMES.BY_ID(sid), { method: "DELETE" });
        const j = await res.json().catch(() => null);
        if (!res.ok) {
          alert(j?.message || `Xóa suất #${sid} thất bại`);
          await loadShowtimeData();
          return;
        }
      }
      setPendingDeleteIds([]);

      for (const ev of snapshot) {
        if (ev.serverId != null && ev.dirty) {
          const startIso = `${ev.date}T${ev.startTime}:00`;
          const res = await apiFetch(SHOWTIMES.BY_ID(ev.serverId), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movieId: ev.movieId,
              roomId: ev.roomId,
              startTime: startIso,
              vatPercent: ev.vatPercent ?? 0,
            }),
          });
          const j = await res.json().catch(() => null);
          if (!res.ok) {
            alert(j?.message || "Cập nhật suất chiếu thất bại");
            await loadShowtimeData();
            return;
          }
        }
      }

      for (const ev of snapshot) {
        if (ev.serverId == null) {
          const startIso = `${ev.date}T${ev.startTime}:00`;
          const res = await apiFetch(SHOWTIMES.LIST, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movieId: ev.movieId,
              roomId: ev.roomId,
              startTime: startIso,
              vatPercent: ev.vatPercent ?? 0,
            }),
          });
          const j = await res.json().catch(() => null);
          if (!res.ok) {
            alert(j?.message || "Tạo suất chiếu thất bại");
            await loadShowtimeData();
            return;
          }
        }
      }

      await loadShowtimeData();
    } catch {
      alert("Không kết nối được máy chủ");
      await loadShowtimeData();
    } finally {
      setSaving(false);
    }
  };

  // Update VAT for existing showtimes when weeklyVAT changes - Only for newly added unsaved ones to avoid confusion
  useEffect(() => {
    if (state.events.length === 0) return;
    
    setState(prev => {
      let changed = false;
      const newEvents = prev.events.map(ev => {
        const currentExpectedVAT = getVATForDate(ev.date);
        // Only auto-update if it's a new unsaved event (local-)
        if (ev.id.toString().startsWith('local-') && ev.vatPercent !== currentExpectedVAT) {
          changed = true;
          return {
            ...ev,
            vatPercent: currentExpectedVAT
          };
        }
        return ev;
      });
      
      return changed ? { ...prev, events: newEvents } : prev;
    });
  }, [weeklyVAT]);

  const handleUpdateEventVAT = (eventId, newVat) => {
    setState(prev => ({
      ...prev,
      events: prev.events.map(ev => 
        ev.id === eventId 
          ? { ...ev, vatPercent: Number(newVat), dirty: ev.serverId != null ? true : ev.dirty } 
          : ev
      )
    }));
    if (detailEvent && detailEvent.id === eventId) {
      setDetailEvent(prev => ({ ...prev, vatPercent: Number(newVat) }));
    }
  };

  const movieMap = useMemo(() => {
    return state.movies.reduce((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});
  }, [state.movies]);

  const filteredMovies = useMemo(() => {
    if (!movieSearchTerm.trim()) return state.movies;
    return state.movies.filter(movie => 
      movie.title.toLowerCase().includes(movieSearchTerm.toLowerCase())
    );
  }, [state.movies, movieSearchTerm]);

  const canPlaceEvent = useCallback((eventId, roomId, targetDate, startTime, duration) => {
    const startMins = toMinutes(startTime);
    const endMins = startMins + duration;
    
    // Limit end time to 24:00 for conflict detection
    const maxEndMinutes = 24 * 60; // 24:00
    const actualEndMins = Math.min(endMins, maxEndMinutes);

    return !state.events.some(ev => {
      if (eventId && ev.id === eventId) return false;
      if (ev.roomId !== roomId || ev.date !== targetDate) return false;

      const evDuration = movieMap[ev.movieId]?.durationMin || 120;
      const evStart = toMinutes(ev.startTime);
      const evEnd = evStart + evDuration;
      
      // Also limit existing event end time to 24:00
      const actualEvEnd = Math.min(evEnd, maxEndMinutes);

      return isOverlap(startMins, actualEndMins, evStart, actualEvEnd);
    });
  }, [state.events, movieMap]);

  const onDropCell = (roomId, time) => {
    stopAutoScroll();
    if (!dragData) return;

    const targetDate = roomDates[roomId];
    const isNewMovie = dragData.type === "movie";
    const eventIdToMove = !isNewMovie ? dragData.eventId : null;
    const existing = !isNewMovie ? state.events.find((e) => e.id === eventIdToMove) : null;
    const movieId = isNewMovie ? dragData.movieId : existing?.movieId;

    const duration = movieMap[movieId]?.durationMin || 120;

    if (!canPlaceEvent(eventIdToMove, roomId, targetDate, time, duration)) {
      alert("⚠️ Không thể đặt lịch: Đã bị trùng với một suất chiếu khác trong phòng này.");
      setDragData(null);
      return;
    }

    if (isNewMovie) {
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const currentVat = getVATForDate(targetDate);
      setState((prev) => ({
        ...prev,
        events: [
          {
            id: localId,
            serverId: null,
            movieId,
            roomId,
            date: targetDate,
            startTime: time,
            vatPercent: currentVat,
            dirty: false,
          },
          ...prev.events,
        ],
      }));
    } else {
      setState((prev) => ({
        ...prev,
        events: prev.events.map((ev) =>
          ev.id === eventIdToMove
            ? {
                ...ev,
                roomId,
                date: targetDate,
                startTime: time,
                dirty: ev.serverId != null ? true : ev.dirty,
              }
            : ev
        ),
      }));
    }

    setDragData(null);
    setIsDragging(false);
    setHoveredCell(null);
  };

  const findStartEvent = (roomId, date, time) => {
  // Find showtime starting at this time on this date
  const exactMatch = state.events.find(e => e.roomId === roomId && e.date === date && e.startTime === time);
  if (exactMatch) return exactMatch;
  
  // For overnight showtimes, only show at the very first slot (00:00)
  if (time !== '00:00') return null;
  
  // Find overnight showtime from previous day that spans into this date
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  
  const overnightMatch = state.events.find(e => {
    if (e.roomId !== roomId || e.date !== prevDateStr) return false;
    
    const duration = movieMap[e.movieId]?.durationMin || 120;
    const [hours, minutes] = e.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    // Check if this showtime goes past midnight (now extends to 00:30)
    return endMinutes > 24 * 60;
  });
  
  return overnightMatch;
};

  // Kéo thả thay đổi thứ tự phòng
  const handleRoomDragStart = (id) => setDragRoomState(prev => ({ ...prev, draggedId: id, dragType: 'room' }));
  const handleRoomDragOver = (e, targetId) => {
    e.preventDefault();
    if (targetId !== dragRoomState.draggedId) setDragRoomState(prev => ({ ...prev, targetId }));
  };
  const handleRoomDragLeave = () => setDragRoomState(prev => ({ ...prev, targetId: null }));
  const handleRoomDrop = (targetId) => {
    const { draggedId, dragType } = dragRoomState;
    if (!draggedId || draggedId === targetId || dragType !== 'room') {
      setDragRoomState({ draggedId: null, targetId: null, dragType: null });
      return;
    }
    
    // Only handle room-to-room drops, not from other elements
    const draggedRoom = state.rooms.find(r => r.id === draggedId);
    if (!draggedRoom) {
      setDragRoomState({ draggedId: null, targetId: null, dragType: null });
      return;
    }
    
    setState(prev => {
      const newRooms = [...prev.rooms];
      const fromIdx = newRooms.findIndex(r => r.id === draggedId);
      const toIdx = newRooms.findIndex(r => r.id === targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [movedRoom] = newRooms.splice(fromIdx, 1);
        newRooms.splice(toIdx, 0, movedRoom);
      }
      return { ...prev, rooms: newRooms };
    });
    
    setDragRoomState({ draggedId: null, targetId: null, dragType: null });
  };

  const handleRoomDateChange = (roomId, newDate) => {
    setRoomDates(prev => ({
      ...prev,
      [roomId]: newDate
    }));
  };

  // Delete zone handlers
  const handleDeleteZoneDragOver = (e) => {
    e.preventDefault();
    setDeleteZone(true);
  };

  const handleDeleteZoneDragLeave = () => {
    setDeleteZone(false);
  };

  const handleDeleteZoneDrop = (e) => {
    e.preventDefault();
    if (dragData && dragData.type === "event") {
      const ev = state.events.find((x) => x.id === dragData.eventId);
      if (ev) {
        if (ev.serverId != null) {
          setPendingDeleteIds((prev) => (prev.includes(ev.serverId) ? prev : [...prev, ev.serverId]));
        }
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((x) => x.id !== ev.id),
        }));
      }
    }
    setDeleteZone(false);
    setDragData(null);
    setIsDragging(false);
  };

  // Auto-scroll functionality
  const startAutoScroll = (direction) => {
    if (autoScrollInterval) return;
    const interval = setInterval(() => {
      const scrollContainer = document.querySelector('.table-responsive');
      if (scrollContainer) {
        const scrollAmount = 2;
        const currentScroll = scrollContainer.scrollLeft;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        if (direction === 'left' && currentScroll > 0) {
          scrollContainer.scrollLeft = Math.max(0, currentScroll - scrollAmount);
        } else if (direction === 'right' && currentScroll < maxScroll) {
          scrollContainer.scrollLeft = Math.min(maxScroll, currentScroll + scrollAmount);
        } else {
          stopAutoScroll();
        }
      }
    }, 100);
    setAutoScrollInterval(interval);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="admin-page superadmin-page admin-fade-in showtime-schedule-page">
      {!effectiveCinemaId ? (
        <div className="alert alert-warning border-0 shadow-sm mb-3">
          <strong>Chưa có rạp để hiển thị.</strong> Super Admin: chọn rạp trên sidebar. Admin rạp: tài khoản cần được
          gán <code>cinemaId</code>.
        </div>
      ) : null}
      {dataLoading && effectiveCinemaId ? (
        <div className="alert alert-light border shadow-sm d-flex align-items-center gap-2 py-2 px-3 mb-3" role="status">
          <div className="spinner-border spinner-border-sm text-primary" aria-hidden />
          <span className="small text-muted mb-0">Đang tải phòng, phim và suất chiếu…</span>
        </div>
      ) : null}

      {/* Header section with Title on Left and Controls on Right */}
      <div className="admin-header mb-4">
        <div className="admin-header-content d-flex justify-content-between align-items-center flex-nowrap w-100">
          <div>
            <h1 className="h3 mb-1">
              <i className="bi bi-calendar3-week me-2"></i>
              Quản lý Suất chiếu
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
              Kéo thả để sắp lịch trên lưới — chỉ lưu khi bấm <strong>Lưu</strong>.
              {hasUnsavedChanges && (
                <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: "0.7rem" }}>
                  Chưa lưu
                </Badge>
              )}
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="fw-bold shadow-sm d-flex align-items-center justify-content-center"
              disabled={!effectiveCinemaId || saving || !hasUnsavedChanges}
              onClick={handleSaveShowtimes}
              style={{ height: "32px", minWidth: "75px", fontSize: "0.75rem", padding: "0 0.75rem" }}
            >
              <i className="bi bi-save me-1"></i>
              {saving ? "..." : "Lưu"}
            </Button>
            <Button
              variant={individualDateMode ? "info" : "secondary"}
              size="sm"
              className="shadow-sm text-white d-flex align-items-center justify-content-center"
              onClick={() => setIndividualDateMode(!individualDateMode)}
              style={{ height: "32px", minWidth: "75px", fontSize: "0.75rem", padding: "0 0.75rem" }}
            >
              <i className={`bi ${individualDateMode ? 'bi-calendar-range' : 'bi-calendar-event'} me-1`}></i>
              {individualDateMode ? "Riêng" : "Chung"}
            </Button>
            <div className="d-flex align-items-center bg-white border rounded shadow-sm px-2" style={{ height: "32px" }}>
              <input
                type="date"
                className="form-control form-control-sm border-0 p-0"
                style={{ width: "110px", fontSize: "0.75rem", fontWeight: "600", outline: "none", boxShadow: "none" }}
                value={globalDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setGlobalDate(newDate);
                  if (!individualDateMode) {
                    setRoomDates((prev) => {
                      const newDates = { ...prev };
                      state.rooms.forEach((r) => {
                        newDates[r.id] = newDate;
                      });
                      return newDates;
                    });
                  }
                }}
              />
            </div>
            <div
              className={`d-flex align-items-center justify-content-center px-2 border rounded shadow-sm ${
                deleteZone ? "border-danger bg-danger bg-opacity-25" : "bg-light border-secondary border-opacity-25"
              }`}
              style={{
                height: "32px",
                cursor: isDragging && dragData?.type === "event" ? "pointer" : "default",
                minWidth: "100px",
                fontSize: "0.7rem",
                transition: "all 0.2s"
              }}
              onDragOver={handleDeleteZoneDragOver}
              onDragLeave={handleDeleteZoneDragLeave}
              onDrop={handleDeleteZoneDrop}
            >
              <i className={`bi bi-trash me-1 ${deleteZone ? 'text-danger' : 'text-danger opacity-75'}`}></i>
              <span className={deleteZone ? "text-danger fw-bold" : "text-dark"}>
                {deleteZone ? "Thả xóa" : "Thùng rác"}
              </span>
            </div>
          </div>
        </div>
      </div>
       
      {/* VAT Configuration Section - Moved above Movies */}
      <Card className="admin-card border-0 shadow-sm mb-3">
        <Card.Header className="bg-white py-2 border-bottom">
          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
            <i className="bi bi-percent me-2"></i> VAT theo ngày (%)
          </h6>
        </Card.Header>
        <Card.Body className="bg-light bg-opacity-25 py-2">
          <Row className="g-2">
            {[1, 2, 3, 4, 5, 6, 0].map(dayNum => (
              <Col key={dayNum} xs={6} sm={4} md={3} lg xl>
                <div className="d-flex align-items-center bg-white rounded border px-2 py-1 shadow-xs">
                  <label className="fw-bold small text-muted mb-0 me-2 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                    {DAY_NAMES[dayNum]}
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 p-0 text-primary fw-bold"
                    style={{ fontSize: '0.8rem', outline: 'none', boxShadow: 'none' }}
                    value={weeklyVAT[dayNum]}
                    onChange={(e) => setWeeklyVAT(prev => ({ ...prev, [dayNum]: Number(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-3">
        <Col xs={12}>
          <Card className="admin-card border-0 shadow-sm">
            <Card.Header className="admin-card-header border-0 py-2">
              <div className="d-flex justify-content-between align-items-center w-100">
                <h6 className="mb-0 fw-bold d-flex align-items-center text-primary">
                  <Film size={16} className="me-2" /> Phim đang chiếu
                </h6>
                <div className="ms-auto">
                  <div className="input-group input-group-sm" style={{ width: '200px' }}>
                    <span className="input-group-text bg-light border-end-0 py-0">
                      <Search size={14} />
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 py-1" 
                      style={{ fontSize: '0.75rem' }}
                      placeholder="Tìm phim..." 
                      value={movieSearchTerm}
                      onChange={(e) => setMovieSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 overflow-auto pb-2">
                {filteredMovies.map(movie => (
                  <div
                    key={movie.id}
                    draggable
                    onDragStart={() => {
                      setDragData({ type: "movie", movieId: movie.id });
                      setTimeout(() => setIsDragging(true), 0);
                    }}
                    className="border rounded p-3 bg-white shadow-sm d-flex flex-column align-items-center flex-shrink-0"
                    style={{ width: "160px", cursor: "grab", transition: "transform 0.2s" }}
                    onDragEnd={() => {
                      setDragData(null);
                      setIsDragging(false);
                      setHoveredCell(null);
                      stopAutoScroll(); 
                    }}
                  >
                    <div className="fw-bold text-truncate w-100 text-center mb-2" title={movie.title}>
                      {movie.title}
                    </div>
                    <Badge bg="info" className="text-dark w-100">{movie.durationMin} phút</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="admin-card border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <div className="table-responsive" style={{ maxHeight: '600px', position: 'relative' }}>
            <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed', minWidth: `${TIME_SLOTS.length * SLOT_WIDTH + 800}px` }}>
              <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                <tr>
                  <th className="bg-white align-middle text-center" style={{ width: "200px", position: "sticky", left: 0, zIndex: 10, borderBottom: '2px solid #dee2e6' }}>
                    Phòng chiếu
                  </th>
                  {TIME_SLOTS.map((time, idx) => (
                    <th key={time} className="text-center align-middle bg-light text-muted fw-normal p-0" style={{ width: `${SLOT_WIDTH}px`, fontSize: "0.7rem", borderLeft: time.endsWith('00') ? '2px solid #adb5bd' : time.endsWith('30') ? '1px dashed #dee2e6' : 'none', position: 'relative', height: '30px' }}>
                      {time.endsWith('00') || time.endsWith('30') ? (
                        <span style={{ position: 'absolute', bottom: '2px', left: '-12px', zIndex: 8, backgroundColor: '#f8f9fa', padding: '0 2px' }}>{time}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.rooms.map((room) => (
                  <tr 
                    key={room.id}
                    draggable
                    onDragStart={() => handleRoomDragStart(room.id)}
                    onDragOver={(e) => handleRoomDragOver(e, room.id)}
                    onDragLeave={handleRoomDragLeave}
                    onDrop={() => handleRoomDrop(room.id)}
                    style={{ 
                      backgroundColor: dragRoomState.targetId === room.id ? '#e9ecef' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td 
                      className="bg-white align-middle" 
                      style={{ position: "sticky", left: 0, zIndex: 8, cursor: "grab", borderRight: '2px solid #dee2e6' }}
                    >
                      <div className="d-flex flex-column px-2">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <GripVertical size={16} className="text-muted" />
                          <div className="text-end">
                            <div className="fw-bold">{room.name}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-calendar3 text-muted" style={{ fontSize: "12px" }}></i>
                          {individualDateMode ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              value={roomDates[room.id] || globalDate}
                              onChange={(e) => handleRoomDateChange(room.id, e.target.value)}
                            />
                          ) : (
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {formatDate(roomDates[room.id] || globalDate)}
                            </span>
                          )}
                        </div>
                        <Badge bg={room.status === "active" ? "success" : "secondary"} style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                          {room.status === "active" ? "Hoạt động" : "Bảo trì"}
                        </Badge>
                      </div>
                    </td>
                    
                    {TIME_SLOTS.map((time) => {
                      const event = findStartEvent(room.id, roomDates[room.id], time);
                      const draggedDuration = dragData ? (movieMap[dragData.type === 'movie' ? dragData.movieId : state.events.find(e => e.id === dragData.eventId)?.movieId]?.durationMin || 120) : 0;
                      
                      const isFromPreviousDay = event && event.date !== roomDates[room.id];
                      const prevDate = new Date(roomDates[room.id]);
                      prevDate.setDate(prevDate.getDate() - 1);
                      const prevDateStr = prevDate.toISOString().slice(0, 10);
                      const isOvernightFromPrevious = isFromPreviousDay && event.date === prevDateStr;

                      return (
                        <td
                          key={time}
                          onDragEnter={() => setHoveredCell({ roomId: room.id, time })}
                          onDragOver={(e) => {
                            e.preventDefault();
                            handleDragOver(e);
                          }}
                          onDrop={() => onDropCell(room.id, time)}
                          style={{
                            padding: 0,
                            position: "relative",
                            height: "80px",
                            borderLeft: time.endsWith('00') ? '2px solid #adb5bd' : time.endsWith('30') ? '1px dashed #dee2e6' : '1px solid #f8f9fa',
                            backgroundColor: '#fff',
                            minHeight: "80px"
                          }}
                        >
                          <div className="w-100 h-100" style={{ minHeight: "100%" }}></div>

                          {dragData && hoveredCell?.roomId === room.id && hoveredCell?.time === time && (
                            <div
                              style={{
                                position: "absolute",
                                left: "2px",
                                top: "5px",
                                height: "50px",
                                width: `${(draggedDuration / SLOT_INTERVAL) * SLOT_WIDTH - 4}px`,
                                backgroundColor: "rgba(79, 70, 229, 0.2)",
                                border: "2px dashed #4f46e5",
                                borderRadius: "6px",
                                zIndex: 10,
                                pointerEvents: "none",
                              }}
                            >
                              <div style={{ position: "absolute", top: "-28px", left: "0px", backgroundColor: "#dc3545", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", zIndex: 5 }}>
                                📍 Thả vào: {time}
                              </div>
                            </div>
                          )}

                          {event && (
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDragData({ type: "event", eventId: event.id });
                                setTimeout(() => setIsDragging(true), 0);
                              }}
                              onDragEnd={() => {
                                setDragData(null);
                                setIsDragging(false);
                                setHoveredCell(null);
                                stopAutoScroll(); 
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDetail(event);
                              }}
                              className="shadow-sm d-flex flex-column justify-content-center px-2 py-1"
                              style={{
                                position: "absolute",
                                left: "2px",
                                top: "5px",
                                height: "65px",
                                width: `${((movieMap[event.movieId]?.durationMin || 120) / SLOT_INTERVAL) * SLOT_WIDTH - 4}px`,
                                backgroundColor: isOvernightFromPrevious ? "#6366f1" : "#4f46e5",
                                color: "white",
                                borderRadius: "6px",
                                zIndex: 5,
                                cursor: "pointer",
                                overflow: "visible",
                                whiteSpace: "nowrap",
                                pointerEvents: isDragging ? "none" : "auto",
                                border: (event.startTime === '23:30' || event.startTime === '23:45' || event.startTime >= '23:00') ? '4px solid #f59e0b' : 'none',
                                boxShadow: (event.startTime === '23:30' || event.startTime === '23:45' || event.startTime >= '23:00') ? '0 0 15px rgba(245, 158, 11, 0.8)' : 'none',
                                opacity: isOvernightFromPrevious ? 0.8 : 1,
                                borderStyle: isOvernightFromPrevious ? 'dashed' : 'solid'
                              }}
                            >
                              <div className="fw-bold text-truncate" style={{ fontSize: "0.85rem" }}>
                                {movieMap[event.movieId]?.title || "Phim không xác định"}
                              </div>
                              <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                {event.startTime} - {calculateEndTime(event.startTime, movieMap[event.movieId]?.durationMin || 120)}
                              </div>
                              <div className="mt-auto d-flex justify-content-between align-items-center" style={{ fontSize: "0.7rem" }}>
                                <span className="badge bg-white text-dark py-0 px-1" style={{ fontSize: "0.65rem" }}>VAT: {event.vatPercent}%</span>
                                <span className="fw-bold">{calculateFinalPrice(movieMap[event.movieId]?.basePrice || 60000, event.vatPercent).toLocaleString("vi-VN")}đ</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Showtime Detail Modal */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        centered
        backdrop="static"
        keyboard={false}
        dialogClassName="modal-dialog-centered"
        contentClassName="border-0 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary d-flex align-items-center">
            <i className="bi bi-info-circle-fill me-2"></i>
            Chi tiết Suất chiếu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {detailEvent && (
            <div className="showtime-details">
              <div className="movie-info-header mb-4 p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                  <Film size={32} />
                </div>
                <div>
                  <h5 className="mb-1 fw-bold">{movieMap[detailEvent.movieId]?.title}</h5>
                  <Badge bg="info" text="dark">{movieMap[detailEvent.movieId]?.durationMin} phút</Badge>
                  {detailEvent.serverId == null && (
                    <Badge bg="warning" text="dark" className="ms-2">Chưa lưu</Badge>
                  )}
                  {detailEvent.dirty && (
                    <Badge bg="warning" text="dark" className="ms-2">Có thay đổi</Badge>
                  )}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <Hash size={14} /> ID Suất chiếu
                  </div>
                  <div className="fw-bold">{detailEvent.serverId || "Tạm thời (Chưa lưu)"}</div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <i className="bi bi-door-open" style={{ fontSize: '14px' }}></i> Phòng chiếu
                  </div>
                  <div className="fw-bold">{state.rooms.find(r => r.id === detailEvent.roomId)?.name}</div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <Calendar size={14} /> Ngày chiếu
                  </div>
                  <div className="fw-bold">{formatDate(detailEvent.date)}</div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <Clock size={14} /> Thời gian
                  </div>
                  <div className="fw-bold text-primary">
                    {detailEvent.startTime} - {calculateEndTime(detailEvent.startTime, movieMap[detailEvent.movieId]?.durationMin || 120)}
                  </div>
                </div>
                <div className="col-12"><hr className="my-1 opacity-10" /></div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <CreditCard size={14} /> Giá gốc
                  </div>
                  <div className="fw-bold">{(movieMap[detailEvent.movieId]?.basePrice || 0).toLocaleString("vi-VN")}đ</div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                    <i className="bi bi-percent" style={{ fontSize: '14px' }}></i> VAT áp dụng (%)
                  </div>
                  <input
                    type="number"
                    className="form-control form-control-sm fw-bold border-primary border-opacity-25"
                    value={detailEvent.vatPercent}
                    onChange={(e) => handleUpdateEventVAT(detailEvent.id, e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="col-12">
                  <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-primary">TỔNG CỘNG (TẠM TÍNH):</span>
                      <h4 className="mb-0 fw-bold text-primary">
                        {calculateFinalPrice(movieMap[detailEvent.movieId]?.basePrice || 0, detailEvent.vatPercent).toLocaleString("vi-VN")}đ
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailModal(false)} className="w-100 fw-bold">
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
