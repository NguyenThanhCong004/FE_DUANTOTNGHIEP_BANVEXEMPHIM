import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Row, Col, Modal } from "react-bootstrap";
import { Film, GripVertical, Search, Clock, Calendar, Hash, CreditCard, Trash2 } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { ROOMS, MOVIES, SHOWTIMES } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

import { useAdminToast } from "../../components/admin/AdminToast";

const SLOT_INTERVAL = 5; 
const SLOT_WIDTH = 12;

const makeMinuteSlots = () => {
  const result = [];
  const startMins = 7 * 60; 
  const endMins = 25 * 60;  
  for (let m = startMins; m <= endMins; m += SLOT_INTERVAL) {
    let h = Math.floor(m / 60);
    const mins = m % 60;
    const displayH = h >= 24 ? h - 24 : h;
    result.push(`${String(displayH).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  }
  return result;
};

const TIME_SLOTS = makeMinuteSlots(); 

const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toBusinessMinutes = (hhmm) => {
  let mins = toMinutes(hhmm);
  if (mins < 7 * 60) mins += 24 * 60; 
  return mins;
};

const fromBusinessMinutes = (totalMins) => {
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const displayH = h >= 24 ? h - 24 : h;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const toIso = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getBusinessDate = (actualDate, timeStr) => {
  if (!actualDate || !timeStr) return actualDate;
  if (toMinutes(timeStr) < 7 * 60) return addDays(actualDate, -1);
  return actualDate;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) return "";
  let totalMins = toBusinessMinutes(startTime) + (durationMinutes || 120);
  return fromBusinessMinutes(totalMins);
};

const isPastShowtime = (businessDate, startTime) => {
  if (!businessDate || !startTime) return false;
  
  // Lấy ngày thực tế từ businessDate và startTime
  const actualDate = toMinutes(startTime) < 7 * 60 ? addDays(businessDate, 1) : businessDate;
  const showtimeStr = `${actualDate}T${startTime}:00`;
  const showtimeDate = new Date(showtimeStr);
  
  return showtimeDate < new Date();
};

const DAY_NAMES = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const CLEANUP_TIME = 15; // Khoảng nghỉ 15 phút

export default function ShowtimeManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const { showToast, ToastComponent } = useAdminToast();

  const [state, setState] = useState({ rooms: [], movies: [], events: [] });
  const [dataLoading, setDataLoading] = useState(false);
  const [globalDate, setGlobalDate] = useState(toIso(new Date()));
  const [roomDates, setRoomDates] = useState({});
  const [movieSearchTerm, setMovieSearchTerm] = useState("");
  const [dragData, setDragData] = useState(null);
  const [deleteZone, setDeleteZone] = useState(false); 
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [weeklySurcharge, setWeeklySurcharge] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 });

  const movieMap = useMemo(() => state.movies.reduce((acc, m) => ({ ...acc, [m.id]: m }), {}), [state.movies]);

  const loadShowtimeData = useCallback(async () => {
    if (!effectiveCinemaId) return;
    setDataLoading(true);
    try {
      const q = "?cinemaId=" + effectiveCinemaId;
      const [rRes, mRes, sRes] = await Promise.all([
        apiFetch(ROOMS.LIST + q).then(res => res.json()),
        apiFetch(MOVIES.LIST).then(res => res.json()),
        apiFetch(SHOWTIMES.LIST + q).then(res => res.json()),
      ]);
      const rooms = (rRes?.data || []).map(r => ({ id: r.id, name: r.name }));
      const movies = (mRes?.data || []).map(m => ({ id: m.id, title: m.title, durationMin: m.duration || 120, basePrice: m.basePrice || 60000 }));
      const events = (sRes?.data || []).map(s => ({
        id: s.id, serverId: s.id, movieId: s.movie_id || s.movieId, roomId: s.room_id || s.roomId,
        businessDate: getBusinessDate(s.date, s.time), startTime: s.time, surcharge: s.surcharge || 0, 
        soldTicketsCount: s.sold_tickets_count || 0, dirty: false
      }));

      // Tự động trích xuất phụ thu theo thứ từ dữ liệu suất chiếu hiện có (nếu chưa có trong state)
      const extractedSurcharges = { ...weeklySurcharge };
      events.forEach(ev => {
        const day = new Date(ev.businessDate).getDay();
        // Nếu ngày này trong state đang là 0 và suất chiếu có phụ thu > 0, cập nhật state
        if (extractedSurcharges[day] === 0 && ev.surcharge > 0) {
          extractedSurcharges[day] = ev.surcharge;
        }
      });
      setWeeklySurcharge(extractedSurcharges);

      setState({ rooms, movies, events });
      setPendingDeleteIds([]);
      const initialRoomDates = {};
      rooms.forEach(r => { initialRoomDates[r.id] = globalDate; });
      setRoomDates(initialRoomDates);
    } catch (e) { console.error(e); } finally { setDataLoading(false); }
  }, [effectiveCinemaId, globalDate]);

  useEffect(() => { loadShowtimeData(); }, [loadShowtimeData]);

  const handleSaveShowtimes = async () => {
    if (!effectiveCinemaId || saving) return;
    setSaving(true);
    try {
      for (const id of pendingDeleteIds) await apiFetch(SHOWTIMES.BY_ID(id), { method: "DELETE" });
      for (const ev of state.events) {
        if (!ev.dirty && ev.serverId) continue;
        const actualDate = toMinutes(ev.startTime) < 7 * 60 ? addDays(ev.businessDate, 1) : ev.businessDate;
        const body = { movieId: ev.movieId, roomId: ev.roomId, startTime: actualDate + "T" + ev.startTime + ":00", surcharge: ev.surcharge };
        if (ev.serverId) await apiFetch(SHOWTIMES.BY_ID(ev.serverId), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        else await apiFetch(SHOWTIMES.LIST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      await loadShowtimeData();
      showToast("Đã lưu lịch chiếu thành công!", "success");
    } catch (e) { showToast("Lỗi khi lưu dữ liệu.", "danger"); } finally { setSaving(false); }
  };

  const handleDragStart = (e, type, data) => {
    let offset = 0;
    if (type === "event") {
      const rect = e.currentTarget.getBoundingClientRect();
      offset = Math.floor((e.clientX - rect.left) / SLOT_WIDTH);
    }
    setDragData({ ...data, type, slotOffset: offset });
  };

  const onDropCell = (roomId, time) => {
    if (!dragData) return;
    const bDate = roomDates[roomId] || globalDate;
    
    if (isPastShowtime(bDate, time)) {
      showToast("Không thể thêm hoặc chuyển suất chiếu vào thời gian đã qua.", "warning");
      return;
    }

    const movieId = dragData.type === "movie" ? dragData.movieId : state.events.find(e => e.id === dragData.eventId)?.movieId;
    if (!movieId) return;
    
    let startMins = toBusinessMinutes(time);
    if (dragData.slotOffset) startMins -= dragData.slotOffset * SLOT_INTERVAL;
    if (startMins < 7 * 60) startMins = 7 * 60;

    const movie = movieMap[movieId];
    const duration = movie?.durationMin || 120;

    if (startMins + duration > 25 * 60) { showToast("Quá giờ hoạt động!", "warning"); return; }

    setState(p => {
      let updatedEvents = [...p.events];
      const dropTimeStr = fromBusinessMinutes(startMins);
      let targetId = dragData.eventId;

      const eventAtDrop = updatedEvents.find(ev => ev.roomId === roomId && ev.businessDate === bDate && ev.startTime === dropTimeStr);

      if (eventAtDrop && eventAtDrop.soldTicketsCount > 0) {
        showToast("Suất chiếu tại vị trí này đã có vé được bán, không thể hoán đổi hay đẩy lùi.", "danger");
        return p;
      }

      if (dragData.type === "event") {
        const sourceEv = updatedEvents.find(e => e.id === dragData.eventId);
        if (!sourceEv) return p;
        if (sourceEv.soldTicketsCount > 0) {
          showToast("Suất chiếu này đã có vé được bán, không thể di chuyển.", "danger");
          return p;
        }

        if (eventAtDrop && eventAtDrop.id !== sourceEv.id) {
          const oldSourceTime = sourceEv.startTime;
          sourceEv.startTime = eventAtDrop.startTime;
          eventAtDrop.startTime = oldSourceTime;
          sourceEv.dirty = true;
          eventAtDrop.dirty = true;
          return { ...p, events: updatedEvents };
        } else {
          updatedEvents = updatedEvents.map(ev => 
            ev.id === dragData.eventId ? { ...ev, roomId, businessDate: bDate, startTime: dropTimeStr, dirty: true } : ev
          );
        }
      } else {
        targetId = "local-" + Date.now();
        updatedEvents.push({ 
          id: targetId, 
          serverId: null, 
          movieId, 
          roomId, 
          businessDate: bDate, 
          startTime: dropTimeStr, 
          surcharge: weeklySurcharge[new Date(bDate).getDay()] || 0, 
          dirty: true,
          soldTicketsCount: 0
        });
      }

      const roomEvents = updatedEvents
        .filter(ev => ev.roomId === roomId && ev.businessDate === bDate)
        .sort((a, b) => {
          const diff = toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime);
          if (diff !== 0) return diff;
          if (a.id === targetId) return -1;
          if (b.id === targetId) return 1;
          return 0;
        });

      let changed = true;
      let iterations = 0;
      while (changed && iterations < 50) {
        changed = false;
        for (let i = 0; i < roomEvents.length - 1; i++) {
          const current = roomEvents[i];
          const next = roomEvents[i+1];
          const currentEnd = toBusinessMinutes(current.startTime) + (movieMap[current.movieId]?.durationMin || 120);
          const nextStart = toBusinessMinutes(next.startTime);
          const minNextStart = currentEnd + CLEANUP_TIME;
          
          if (nextStart < minNextStart) {
            if (next.soldTicketsCount > 0) {
              showToast(`Không thể lùi lịch suất chiếu "${movieMap[next.movieId]?.title}" vì đã có vé được bán.`, "danger");
              return p; 
            }
            next.startTime = fromBusinessMinutes(minNextStart);
            next.dirty = next.serverId ? true : next.dirty;
            changed = true;
          }
        }
        iterations++;
      }

      if (roomEvents.length > 0) {
        const lastEv = roomEvents[roomEvents.length - 1];
        if (toBusinessMinutes(lastEv.startTime) + (movieMap[lastEv.movieId]?.durationMin || 120) > 25 * 60) {
          showToast("Việc đẩy lịch khiến các suất chiếu sau vượt quá giờ hoạt động (1h sáng).", "warning");
          return p;
        }
      }

      return { ...p, events: updatedEvents };
    });

    setDragData(null);
  };

  const hasUnsaved = pendingDeleteIds.length > 0 || state.events.some(e => !e.serverId || e.dirty);

  return (
    <div className="admin-page p-3 admin-fade-in" style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm">
        <div>
          <h2 className="h4 mb-0 fw-bold text-primary"><i className="bi bi-calendar3 me-2"></i>Quản lý Suất chiếu (7h - 1h sáng)</h2>
          <p className="text-muted small mb-0">Ca đêm (00:00 - 01:00) tính vào ngày kinh doanh hôm trước.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant={hasUnsaved ? "primary" : "outline-primary"} size="sm" disabled={saving || !hasUnsaved} onClick={handleSaveShowtimes}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <input type="date" className="form-control form-control-sm" style={{ width: "150px" }} value={globalDate} onChange={e => {
            setGlobalDate(e.target.value);
            const nd = {}; state.rooms.forEach(r => nd[r.id] = e.target.value);
            setRoomDates(nd);
          }} />
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-3 rounded-3">
        <Card.Header className="bg-white fw-bold text-primary border-0 pt-3 pb-0">Phụ thu Ngày Kinh Doanh (VNĐ)</Card.Header>
        <Card.Body className="pt-2">
          <Row className="g-2">
            {[1, 2, 3, 4, 5, 6, 0].map(d => (
              <Col key={d} xs={6} md={3} lg>
                <div className="p-2 border rounded bg-light d-flex justify-content-between align-items-center shadow-xs">
                  <span className="small fw-bold text-muted">{DAY_NAMES[d]}</span>
                  <input 
                    type="number" 
                    className="form-control form-control-sm border-0 bg-transparent text-end fw-bold text-primary p-0" 
                    style={{ width: "70px" }} 
                    value={weeklySurcharge[d]} 
                    onChange={e => {
                      const newVal = Number(e.target.value);
                      setWeeklySurcharge(p => ({ ...p, [d]: newVal }));
                      
                      // Tự động cập nhật phụ thu cho các suất chiếu cùng thứ trong tuần
                      setState(prev => ({
                        ...prev,
                        events: prev.events.map(ev => {
                          const eventDay = new Date(ev.businessDate).getDay();
                          const isFuture = !isPastShowtime(ev.businessDate, ev.startTime);
                          
                          // Chỉ cập nhật nếu: Cùng thứ, chưa diễn ra, và chưa bán vé
                          if (eventDay === d && isFuture && ev.soldTicketsCount === 0) {
                            return { ...ev, surcharge: newVal, dirty: !!ev.serverId };
                          }
                          return ev;
                        })
                      }));
                    }} 
                    step="1000" 
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mb-3 rounded-3">
        <Card.Header className="bg-white py-2 border-0 d-flex justify-content-between align-items-center">
          <span className="fw-bold text-muted small"><i className="bi bi-film me-2"></i>Phim đang chiếu</span>
          <input type="text" className="form-control form-control-sm w-auto bg-light border-0" placeholder="Tìm phim..." value={movieSearchTerm} onChange={e => setMovieSearchTerm(e.target.value)} style={{ fontSize: "0.7rem" }} />
        </Card.Header>
        <Card.Body className="p-2">
          <div className="d-flex gap-3 overflow-auto pb-2 px-2">
            {state.movies.filter(m => m.title.toLowerCase().includes(movieSearchTerm.toLowerCase())).map(m => (
              <div key={m.id} draggable onDragStart={e => handleDragStart(e, "movie", { movieId: m.id })} className="p-2 border rounded text-center bg-white shadow-xs" style={{ minWidth: "150px", cursor: "grab" }}>
                <div className="fw-bold small text-truncate mb-1">{m.title}</div>
                <Badge bg="info" className="text-dark fw-normal" style={{ fontSize: "0.65rem" }}>{m.durationMin} phút</Badge>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className="table-responsive bg-white rounded-3 shadow-sm border" style={{ maxHeight: "650px" }}>
        <table className="table table-bordered mb-0" style={{ tableLayout: "fixed", minWidth: (TIME_SLOTS.length * SLOT_WIDTH + 200) + "px" }}>
          <thead className="sticky-top bg-light" style={{ zIndex: 10 }}>
            <tr>
              <th style={{ width: "200px", position: "sticky", left: 0, zIndex: 11 }} className="bg-light align-middle text-center border-bottom-2 small fw-bold">PHÒNG CHIẾU</th>
              {TIME_SLOTS.map(t => (
                <th key={t} className="p-0 text-center fw-normal border-bottom-2" style={{ width: SLOT_WIDTH + "px", fontSize: "0.6rem", borderLeft: t.endsWith(":00") ? "1px solid #ddd" : "none" }}>
                  {t.endsWith(":00") ? <div className="py-2 text-primary fw-bold">{t}</div> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.rooms.map(room => (
              <tr key={room.id}>
                <td style={{ position: "sticky", left: 0, zIndex: 8 }} className="bg-white border-end">
                  <div className="p-2 d-flex flex-column"><span className="fw-bold text-dark">{room.name}</span><span className="text-muted" style={{ fontSize: "0.7rem" }}>{formatDate(roomDates[room.id] || globalDate)}</span></div>
                </td>
                {TIME_SLOTS.map(time => {
                  const ev = state.events.find(e => e.roomId === room.id && e.businessDate === (roomDates[room.id] || globalDate) && e.startTime === time);
                  const movie = ev ? movieMap[ev.movieId] : null;
                  const duration = movie?.durationMin || 120;
                  const isPast = ev ? isPastShowtime(ev.businessDate, ev.startTime) : false;
                  
                  return (
                    <td key={time} className="p-0 position-relative" onDragOver={e => e.preventDefault()} onDrop={() => onDropCell(room.id, time)} style={{ height: "95px" }}>
                      {ev && (
                        <div 
                          draggable={!isPast}
                          onDragStart={e => !isPast && handleDragStart(e, "event", { eventId: ev.id })} 
                          onClick={() => { setDetailEvent(ev); setShowDetailModal(true); }} 
                          className={"position-absolute rounded-2 p-2 shadow-sm overflow-hidden " + 
                            (isPast ? "bg-secondary bg-opacity-25 border-secondary text-muted" : 
                             (ev.dirty || !ev.serverId ? "bg-warning" : "bg-primary text-white"))
                          } 
                          style={{ 
                            top: "6px", left: "2px", height: "83px", zIndex: 5, 
                            cursor: isPast ? "default" : "pointer", 
                            width: ((duration / SLOT_INTERVAL) * SLOT_WIDTH - 4) + "px", 
                            borderWidth: "2px",
                            opacity: isPast ? 0.7 : 1,
                            borderStyle: "solid"
                          }}
                        >
                          <div className="fw-bold text-truncate mb-1" style={{ fontSize: "0.75rem" }}>
                            {movie?.title || "Đang tải..."}
                            {isPast && <span className="ms-1 small opacity-75">(Đã chiếu)</span>}
                          </div>

                          {/* Nút X xóa suất chiếu */}
                          {!isPast && ev.soldTicketsCount === 0 && (
                            <button
                              type="button"
                              className="btn-close btn-close-white position-absolute"
                              style={{ top: "4px", right: "4px", fontSize: "0.5rem", zIndex: 10, padding: "0.4rem", filter: "invert(1)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Bạn có chắc muốn xóa suất chiếu phim "${movie?.title}" không?`)) {
                                  if (ev.serverId) setPendingDeleteIds(prev => [...prev, ev.serverId]);
                                  setState(prev => ({ ...prev, events: prev.events.filter(x => x.id !== ev.id) }));
                                }
                              }}
                            />
                          )}

                          <div className="small opacity-75" style={{ fontSize: "0.65rem" }}><i className="bi bi-clock me-1"></i>{ev.startTime} - {calculateEndTime(ev.startTime, duration)}</div>
                          <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
                            <span className="badge bg-dark bg-opacity-10 text-dark" style={{ fontSize: "0.6rem" }}>+{ev.surcharge.toLocaleString()}đ</span>
                            <span className="fw-bold" style={{ fontSize: "0.7rem" }}>{((movie?.basePrice || 0) + ev.surcharge).toLocaleString()}đ</span>
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

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">
            <Clock size={20} className="me-2"/> Chi tiết Suất chiếu {detailEvent && isPastShowtime(detailEvent.businessDate, detailEvent.startTime) && "(Đã kết thúc)"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailEvent && (
            <div className="row g-3">
              {isPastShowtime(detailEvent.businessDate, detailEvent.startTime) && (
                <div className="col-12">
                  <div className="alert alert-info py-2 px-3 small border-0 mb-0">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Suất chiếu này đã diễn ra hoặc đang chiếu. Bạn chỉ có thể xem thông tin, không thể sửa đổi.
                  </div>
                </div>
              )}
              <div className="col-12 bg-light p-3 rounded-3 mb-2 border border-primary border-opacity-10">
                <h5 className="fw-bold text-dark mb-1">{movieMap[detailEvent.movieId]?.title}</h5>
                <Badge bg="primary">{movieMap[detailEvent.movieId]?.durationMin} phút</Badge>
              </div>
              <div className="col-6"><div className="small text-muted mb-1">Ngày (Kinh doanh)</div><div className="fw-bold">{formatDate(detailEvent.businessDate)}</div></div>
              <div className="col-6"><div className="small text-muted mb-1">Thời gian</div><div className="fw-bold text-primary">{detailEvent.startTime} - {calculateEndTime(detailEvent.startTime, movieMap[detailEvent.movieId]?.durationMin)}</div></div>
              <div className="col-12"><hr className="my-1 opacity-10"/></div>
              <div className="col-6"><label className="form-label small text-muted mb-1">Giá gốc phim</label><div className="fw-bold">{(movieMap[detailEvent.movieId]?.basePrice || 0).toLocaleString()}đ</div></div>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Phụ thu suất (VNĐ)</label>
                <input 
                  type="number" 
                  className="form-control form-control-sm fw-bold border-primary border-opacity-25" 
                  value={detailEvent.surcharge}
                  disabled={isPastShowtime(detailEvent.businessDate, detailEvent.startTime)}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setState(p => ({ ...p, events: p.events.map(ev => ev.id === detailEvent.id ? { ...ev, surcharge: val, dirty: !!ev.serverId } : ev) }));
                    setDetailEvent(prev => ({ ...prev, surcharge: val }));
                  }} step="1000" min="0" 
                />
              </div>
              <div className="col-12 mt-3 p-3 bg-primary bg-opacity-10 rounded-3 text-center">
                <span className="small text-primary fw-bold d-block mb-1">TỔNG GIÁ VÉ DỰ KIẾN</span>
                <h3 className="fw-bold text-primary mb-0">{((movieMap[detailEvent.movieId]?.basePrice || 0) + detailEvent.surcharge).toLocaleString()}đ</h3>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0"><Button variant="secondary" className="w-100 fw-bold py-2 rounded-2" onClick={() => setShowDetailModal(false)}>Đóng</Button></Modal.Footer>
      </Modal>

      <ToastComponent />
    </div>
  );
}
