import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Row, Col, Modal } from "react-bootstrap";

import { apiFetch } from "../../utils/apiClient";
import { ROOMS, MOVIES, SHOWTIMES } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
import useRealtimeSync from "../../utils/useRealtimeSync";
import { isActiveStatus } from "../../utils/statusFormat";
import { useAdminToast } from "../../components/admin/AdminToast";

const SLOT_INTERVAL = 5; 
const SLOT_WIDTH = 12;
const MIN_SHOWTIME_LEAD_MINUTES = 60;
const BUSINESS_END_MINUTES = 25 * 60;

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

const parseIsoDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = parseIsoDate(dateStr);
  if (!d || isNaN(d.getTime())) return "";
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
  const d = parseIsoDate(dateStr);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getIsoWeekday = (dateStr) => {
  const d = parseIsoDate(dateStr);
  return d && !isNaN(d.getTime()) ? d.getDay() : 0;
};

const formatSyncTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) return "";
  let totalMins = toBusinessMinutes(startTime) + (durationMinutes || 120);
  return fromBusinessMinutes(totalMins);
};

const getEventEndBusinessMinutes = (event, movieMap) => (
  toBusinessMinutes(event.startTime) + (movieMap[event.movieId]?.durationMin || 120)
);

const getActualShowtimeDateTime = (businessDate, startTime) => {
  if (!businessDate || !startTime) return false;
  
  // Lấy ngày thực tế từ businessDate và startTime
  const actualDate = toMinutes(startTime) < 7 * 60 ? addDays(businessDate, 1) : businessDate;
  const showtimeStr = `${actualDate}T${startTime}:00`;
  return new Date(showtimeStr);
};

const isPastShowtime = (businessDate, startTime) => {
  const showtimeDate = getActualShowtimeDateTime(businessDate, startTime);
  if (!showtimeDate || isNaN(showtimeDate.getTime())) return false;
  return showtimeDate < new Date();
};

const isTooSoonShowtime = (businessDate, startTime) => {
  const showtimeDate = getActualShowtimeDateTime(businessDate, startTime);
  if (!showtimeDate || isNaN(showtimeDate.getTime())) return false;
  return showtimeDate < new Date(Date.now() + MIN_SHOWTIME_LEAD_MINUTES * 60 * 1000);
};

const DAY_NAMES = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const CLEANUP_TIME = 15; // Khoảng nghỉ 15 phút
const SHOWTIME_LEAD_WARNING = "Suất chiếu phải bắt đầu sau thời điểm hiện tại ít nhất 1 giờ.";
const WEEKLY_SURCHARGE_STORAGE_KEY = "java6.showtime.weeklySurcharge";

const DEFAULT_WEEKLY_SURCHARGE = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

const readStoredWeeklySurcharge = () => {
  if (typeof window === "undefined") return DEFAULT_WEEKLY_SURCHARGE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WEEKLY_SURCHARGE_STORAGE_KEY) || "{}");
    return { ...DEFAULT_WEEKLY_SURCHARGE, ...parsed };
  } catch {
    return DEFAULT_WEEKLY_SURCHARGE;
  }
};

const mapMovieOption = (m) => ({
  id: m.id,
  title: m.title,
  durationMin: m.duration || 120,
  basePrice: m.basePrice || 60000,
  status: m.status,
  isActive: isActiveStatus(m.status),
});

const readDragPayload = (event) => {
  if (!event?.dataTransfer) return null;
  const raw = event.dataTransfer.getData("application/json");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const resolveDraggedStartTime = (time, activeDrag) => {
  let startMins = toBusinessMinutes(time);
  if (activeDrag?.slotOffset) startMins -= activeDrag.slotOffset * SLOT_INTERVAL;
  if (startMins < 7 * 60) startMins = 7 * 60;
  return fromBusinessMinutes(startMins);
};

export default function ShowtimeManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const { showToast, ToastComponent } = useAdminToast();

  const [state, setState] = useState({ rooms: [], movies: [], events: [] });
  const [globalDate, setGlobalDate] = useState(toIso(new Date()));
  const [roomDates, setRoomDates] = useState({});
  const [movieSearchTerm, setMovieSearchTerm] = useState("");
  const [dragData, setDragData] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [pointerDragPreview, setPointerDragPreview] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  useEffect(() => {
    if (!showDetailModal || !detailEvent) return;
    const latest = state.events.find(e => e.id === detailEvent.id);
    if (latest && (latest.startTime !== detailEvent.startTime || latest.roomId !== detailEvent.roomId || latest.businessDate !== detailEvent.businessDate)) {
      setDetailEvent(latest);
    }
  }, [state.events, showDetailModal, detailEvent]);
  const [weeklySurcharge, setWeeklySurcharge] = useState(readStoredWeeklySurcharge);
  const [addSlot, setAddSlot] = useState(null); // { roomId, time }
  const [addSlotMovieId, setAddSlotMovieId] = useState("");
  const [pendingScrollTarget, setPendingScrollTarget] = useState(null); // { roomId, time }
  const pointerDragRef = useRef(null);
  const nativeDragActiveRef = useRef(false);
  const globalDateRef = useRef(globalDate);
  useEffect(() => { globalDateRef.current = globalDate; }, [globalDate]);
  const pointerCleanupRef = useRef(null);
  const lastScheduleWarningRef = useRef({ key: "", at: 0 });

  useEffect(() => {
    return () => {
      if (pointerCleanupRef.current) pointerCleanupRef.current();
      document.body.style.userSelect = "";
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WEEKLY_SURCHARGE_STORAGE_KEY, JSON.stringify(weeklySurcharge));
  }, [weeklySurcharge]);

  // Auto-scroll logic when dragging
  useEffect(() => {
    if (!dragData) return;

    const handleGlobalDragOver = (e) => {
      const threshold = 120; // Khoảng cách từ mép để bắt đầu cuộn
      const scrollSpeed = 25; // Tốc độ cuộn
      
      // 1. Cuộn Dọc (Toàn trang)
      if (window.innerHeight - e.clientY < threshold) {
        window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
      } else if (e.clientY < threshold) {
        window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
      }

      // 2. Cuộn Ngang (Chỉ cuộn khung chứa bảng suất chiếu)
      const container = document.querySelector('.table-responsive');
      if (container) {
        const rect = container.getBoundingClientRect();
        // Nếu chuột nằm trong phạm vi chiều dọc của bảng
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

  const movieMap = useMemo(() => state.movies.reduce((acc, m) => ({ ...acc, [m.id]: m }), {}), [state.movies]);
  const draggableMovies = useMemo(() => {
    const term = movieSearchTerm.trim().toLowerCase();
    return state.movies.filter((m) => {
      if (!m.isActive) return false;
      if (!term) return true;
      return (m.title || "").toLowerCase().includes(term);
    });
  }, [state.movies, movieSearchTerm]);

  const previewEvents = useMemo(() => {
    if (!dragOverCell || !dragData || !["movie", "event"].includes(dragData.type)) return null;
    const { roomId, time } = dragOverCell;
    const bDate = roomDates[roomId] || globalDate;
    const resolvedStartTime = resolveDraggedStartTime(time, dragData);
    if (isPastShowtime(bDate, resolvedStartTime) || isTooSoonShowtime(bDate, resolvedStartTime)) return null;
    const sourceEvent = dragData.type === "event"
      ? state.events.find(ev => ev.id === dragData.eventId)
      : null;
    if (sourceEvent?.soldTicketsCount > 0) return null;
    const movieId = dragData.type === "movie" ? dragData.movieId : sourceEvent?.movieId;
    if (!movieId) return null;
    const movie = movieMap[movieId];
    const duration = movie?.durationMin || 120;
    let startMins = toBusinessMinutes(time);
    if (dragData.slotOffset) startMins -= dragData.slotOffset * SLOT_INTERVAL;
    if (startMins < 7 * 60) startMins = 7 * 60;
    if (isPastShowtime(bDate, fromBusinessMinutes(startMins)) || isTooSoonShowtime(bDate, fromBusinessMinutes(startMins))) return null;
    const existingRoomEvents = state.events
      .filter(ev => ev.roomId === roomId && ev.businessDate === bDate && ev.id !== dragData.eventId)
      .sort((a, b) => toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime));
    const prevEvent = existingRoomEvents.filter(ev => toBusinessMinutes(ev.startTime) <= startMins).slice(-1)[0];
    if (dragData.type === "movie" && prevEvent) {
      const prevEnd = toBusinessMinutes(prevEvent.startTime) + (movieMap[prevEvent.movieId]?.durationMin || 120);
      if (startMins < prevEnd + CLEANUP_TIME) startMins = prevEnd + CLEANUP_TIME;
    }
    if (startMins + duration > BUSINESS_END_MINUTES) return null;
    const dropTimeStr = fromBusinessMinutes(startMins);
    const previewId = dragData.type === "event" ? dragData.eventId : "preview";
    const list = existingRoomEvents.map(ev => ({ ...ev }));
    list.push({
      ...(sourceEvent || {}),
      id: previewId,
      serverId: sourceEvent?.serverId ?? null,
      movieId,
      roomId,
      businessDate: bDate,
      startTime: dropTimeStr,
      surcharge: sourceEvent?.surcharge ?? weeklySurcharge[getIsoWeekday(bDate)] ?? 0,
      dirty: false,
      soldTicketsCount: sourceEvent?.soldTicketsCount ?? 0,
      isPreview: true
    });
    list.sort((a, b) => {
      const diff = toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime);
      if (diff !== 0) return diff;
      return a.id === previewId ? -1 : b.id === previewId ? 1 : 0;
    });
    let changed = true, iterations = 0;
    while (changed && iterations < 50) {
      changed = false;
      for (let i = 0; i < list.length - 1; i++) {
        const cur = list[i], nxt = list[i + 1];
        const curEnd = toBusinessMinutes(cur.startTime) + (movieMap[cur.movieId]?.durationMin || 120);
        const minNext = curEnd + CLEANUP_TIME;
        if (toBusinessMinutes(nxt.startTime) < minNext) {
          if (nxt.soldTicketsCount > 0) return null;
          nxt.startTime = fromBusinessMinutes(minNext);
          changed = true;
        }
      }
      iterations++;
    }
    const last = list[list.length - 1];
    if (last && getEventEndBusinessMinutes(last, movieMap) > BUSINESS_END_MINUTES) return null;
    return { roomId, bDate, events: list };
  }, [dragOverCell, dragData, state.events, movieMap, roomDates, globalDate, weeklySurcharge]);

  const loadShowtimeData = useCallback(async () => {
    if (!effectiveCinemaId) return;
    try {
      const q = "?cinemaId=" + effectiveCinemaId;
      const [rRes, mRes, sRes] = await Promise.all([
        apiFetch(ROOMS.LIST + q).then(res => res.json()),
        apiFetch(MOVIES.LIST).then(res => res.json()),
        apiFetch(SHOWTIMES.LIST + q).then(res => res.json()),
      ]);
      const rooms = (rRes?.data || []).filter(r => isActiveStatus(r.status)).map(r => ({ id: r.id, name: r.name }));
      const movies = (mRes?.data || []).map(mapMovieOption);
      const events = (sRes?.data || []).map(s => ({
        id: s.id, serverId: s.id, movieId: s.movie_id || s.movieId, roomId: s.room_id || s.roomId,
        businessDate: getBusinessDate(s.date, s.time), startTime: s.time, surcharge: s.surcharge || 0, 
        soldTicketsCount: s.sold_tickets_count || 0, dirty: false
      }));

      setState({ rooms, movies, events });
      setPendingDeleteIds([]);
      setRoomDates(prev => {
        const nextRoomDates = {};
        rooms.forEach(r => {
          nextRoomDates[r.id] = prev[r.id] || globalDateRef.current;
        });
        return nextRoomDates;
      });
    } catch (err) { console.error(err); }
  }, [effectiveCinemaId]);

  useEffect(() => { loadShowtimeData(); }, [loadShowtimeData]);

  // Lưới giờ trải dài 07:00 - 01:00 sáng, rộng hơn màn hình rất nhiều — suất chiếu mới thêm có thể
  // bị đẩy giờ ra sau (né trùng giờ) và nằm ngoài vùng đang cuộn, nhìn như "biến mất". Tự cuộn tới
  // đúng vị trí vừa thêm để admin luôn thấy ngay.
  useEffect(() => {
    if (!pendingScrollTarget) return;
    const { roomId, time } = pendingScrollTarget;
    const el = document.querySelector(
      `[data-showtime-drop-cell="true"][data-room-id="${roomId}"][data-time="${time}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setPendingScrollTarget(null);
  }, [pendingScrollTarget]);

  const hasUnsaved = pendingDeleteIds.length > 0 || state.events.some(e =>
    (!e.serverId || e.dirty) && !isPastShowtime(e.businessDate, e.startTime)
  );
  const validateShowtimeSchedule = useCallback((events) => {
    const changedKeys = new Set();
    const isChangedEvent = (ev) => !ev.serverId || ev.dirty;

    for (const ev of events) {
      if (!isChangedEvent(ev) || isPastShowtime(ev.businessDate, ev.startTime)) continue;
      changedKeys.add(`${ev.roomId}|${ev.businessDate}`);
    }

    if (changedKeys.size === 0) return { ok: true };

    const groups = new Map();
    for (const ev of events) {
      const key = `${ev.roomId}|${ev.businessDate}`;
      if (!changedKeys.has(key)) continue;

      const movie = movieMap[ev.movieId];
      const duration = movie?.durationMin || 120;
      const startMins = toBusinessMinutes(ev.startTime);
      const endMins = startMins + duration;

      if (isChangedEvent(ev) && endMins > BUSINESS_END_MINUTES) {
        return { ok: false, message: `Suất "${movie?.title || "phim"}" kết thúc sau 01:00. Vui lòng kéo lại lịch.` };
      }
      if (isChangedEvent(ev) && isPastShowtime(ev.businessDate, ev.startTime)) {
        continue; // bỏ qua suất quá khứ — không validate, không block save
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ev);
    }

    for (const roomEvents of groups.values()) {
      const sorted = [...roomEvents].sort((a, b) => toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime));
      for (let i = 0; i < sorted.length - 1; i++) {
        const cur = sorted[i];
        const next = sorted[i + 1];
        const curMovie = movieMap[cur.movieId];
        const curEnd = toBusinessMinutes(cur.startTime) + (curMovie?.durationMin || 120);
        const touchesChangedEvent = isChangedEvent(cur) || isChangedEvent(next);
        if (touchesChangedEvent && toBusinessMinutes(next.startTime) < curEnd + CLEANUP_TIME) {
          return { ok: false, message: "Lịch chiếu trong cùng phòng đang bị chồng giờ hoặc thiếu thời gian dọn phòng." };
        }
      }
    }
    return { ok: true };
  }, [movieMap]);

  const { lastSyncedAt, syncing: realtimeSyncing, notifySync } = useRealtimeSync({
    enabled: Boolean(effectiveCinemaId),
    intervalMs: 10000,
    hasPendingChanges: hasUnsaved || saving || Boolean(dragData),
    onSync: loadShowtimeData,
    channelName: `java6-showtimes-${effectiveCinemaId || "none"}`,
  });

  const handleSaveShowtimes = async () => {
    if (!effectiveCinemaId || saving) return;
    const scheduleCheck = validateShowtimeSchedule(state.events);
    if (!scheduleCheck.ok) {
      showToast(scheduleCheck.message, "warning");
      return;
    }
    setSaving(true);
    try {
      for (const id of pendingDeleteIds) await apiFetch(SHOWTIMES.BY_ID(id), { method: "DELETE" });
      for (const ev of state.events) {
        if (!ev.dirty && ev.serverId) continue;
        if (isPastShowtime(ev.businessDate, ev.startTime)) continue; // suất quá khứ — không thể lưu, bỏ qua
        const actualDate = toMinutes(ev.startTime) < 7 * 60 ? addDays(ev.businessDate, 1) : ev.businessDate;
        const body = { movieId: ev.movieId, roomId: ev.roomId, startTime: actualDate + "T" + ev.startTime + ":00", surcharge: ev.surcharge };
        const res = ev.serverId
          ? await apiFetch(SHOWTIMES.BY_ID(ev.serverId), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await apiFetch(SHOWTIMES.LIST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.message || "Lưu suất chiếu thất bại");
        }
      }
      await loadShowtimeData();
      notifySync("showtimes:saved");
      showToast("Đã lưu lịch chiếu thành công!", "success");
    } catch (err) { showToast(err?.message || "Lỗi khi lưu dữ liệu.", "danger"); } finally { setSaving(false); }
  };

  const handleDragStart = (e, type, data) => {
    nativeDragActiveRef.current = true;
    let offset = 0;
    if (type === "event") {
      const rect = e.currentTarget.getBoundingClientRect();
      offset = Math.floor((e.clientX - rect.left) / SLOT_WIDTH);
    }
    const payload = { ...data, type, slotOffset: offset };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", type);
    setDragData(payload);
  };

  const notifyIfDropTimeBlocked = useCallback((roomId, time, activeDrag) => {
    if (!activeDrag) return false;
    const bDate = roomDates[roomId] || globalDate;
    const startTime = resolveDraggedStartTime(time, activeDrag);
    let message = "";
    if (isPastShowtime(bDate, startTime)) {
      message = "Không thể thêm hoặc chuyển suất chiếu vào thời gian đã qua.";
    } else if (isTooSoonShowtime(bDate, startTime)) {
      message = SHOWTIME_LEAD_WARNING;
    }

    if (!message) return false;
    const now = Date.now();
    const key = `${bDate}:${startTime}:${message}`;
    if (lastScheduleWarningRef.current.key !== key || now - lastScheduleWarningRef.current.at > 2500) {
      lastScheduleWarningRef.current = { key, at: now };
      showToast(message, "warning");
    }
    return true;
  }, [globalDate, roomDates, showToast]);

  const handleDragOverCell = useCallback((roomId, time, activeDrag) => {
    const payload = activeDrag || dragData;
    if (payload?.type === "movie" || payload?.type === "event") {
      notifyIfDropTimeBlocked(roomId, time, payload);
    }
    setDragOverCell({ roomId, time });
  }, [dragData, notifyIfDropTimeBlocked]);

  const placeOnCell = (roomId, time, activeDrag) => {
    if (!activeDrag) return;
    const bDate = roomDates[roomId] || globalDate;

    const movieId = activeDrag.type === "movie"
      ? activeDrag.movieId
      : state.events.find(e => e.id === activeDrag.eventId)?.movieId;
    if (!movieId) return;

    let startMins = toBusinessMinutes(time);
    if (activeDrag.slotOffset) startMins -= activeDrag.slotOffset * SLOT_INTERVAL;
    if (startMins < 7 * 60) startMins = 7 * 60;

    const requestedStartTime = fromBusinessMinutes(startMins);
    if (isPastShowtime(bDate, requestedStartTime)) {
      showToast("Không thể thêm hoặc chuyển suất chiếu vào thời gian đã qua.", "warning");
      return;
    }
    if (isTooSoonShowtime(bDate, requestedStartTime)) {
      showToast(SHOWTIME_LEAD_WARNING, "warning");
      return;
    }

    const movie = movieMap[movieId];
    const duration = movie?.durationMin || 120;

    // Snap về sau phim trước nếu quá gần
    if (activeDrag.type === "movie") {
      const prevEvent = state.events
        .filter(ev => ev.roomId === roomId && ev.businessDate === bDate)
        .sort((a, b) => toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime))
        .filter(ev => toBusinessMinutes(ev.startTime) <= startMins)
        .slice(-1)[0];
      if (prevEvent) {
        const prevEnd = toBusinessMinutes(prevEvent.startTime) + (movieMap[prevEvent.movieId]?.durationMin || 120);
        if (startMins < prevEnd + CLEANUP_TIME) startMins = prevEnd + CLEANUP_TIME;
      }
    }

    if (startMins + duration > BUSINESS_END_MINUTES) {
      showToast("Suất chiếu này sẽ kết thúc sau 01:00 sáng, không thể thêm vào.", "warning");
      return;
    }

    // Tính trên bản sao riêng để nếu bị chặn thì state thật không bị đẩy lệch.
    let updatedEvents = state.events.map(ev => ({ ...ev }));
    const dropTimeStr = fromBusinessMinutes(startMins);
    let targetId = activeDrag.eventId;

    const eventAtDrop = updatedEvents.find(
      ev => ev.roomId === roomId && ev.businessDate === bDate && ev.startTime === dropTimeStr
    );
    if (eventAtDrop && eventAtDrop.soldTicketsCount > 0) {
      showToast("Suất chiếu tại vị trí này đã có vé được bán, không thể hoán đổi hay đẩy lùi.", "danger");
      return;
    }

    if (activeDrag.type === "event") {
      const sourceEv = updatedEvents.find(e => e.id === activeDrag.eventId);
      if (!sourceEv) return;
      if (sourceEv.soldTicketsCount > 0) {
        showToast("Suất chiếu này đã có vé được bán, không thể di chuyển.", "danger");
        return;
      }
      updatedEvents = updatedEvents.map(ev =>
        ev.id === activeDrag.eventId
          ? { ...ev, roomId, businessDate: bDate, startTime: dropTimeStr, dirty: true }
          : ev
      );
    } else {
      targetId = "local-" + Date.now();
      updatedEvents.push({
        id: targetId, serverId: null, movieId, roomId, businessDate: bDate,
        startTime: dropTimeStr, surcharge: weeklySurcharge[getIsoWeekday(bDate)] || 0,
        dirty: true, soldTicketsCount: 0,
      });
    }

    const roomEvents = updatedEvents
      .filter(ev => ev.roomId === roomId && ev.businessDate === bDate)
      .sort((a, b) => {
        const diff = toBusinessMinutes(a.startTime) - toBusinessMinutes(b.startTime);
        if (diff !== 0) return diff;
        return a.id === targetId ? -1 : b.id === targetId ? 1 : 0;
      });

    // Cascade: đẩy các suất sau nếu bị chồng giờ
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 50) {
      changed = false;
      for (let i = 0; i < roomEvents.length - 1; i++) {
        const cur = roomEvents[i];
        const nxt = roomEvents[i + 1];
        const curEnd = toBusinessMinutes(cur.startTime) + (movieMap[cur.movieId]?.durationMin || 120);
        const minNext = curEnd + CLEANUP_TIME;
        if (toBusinessMinutes(nxt.startTime) < minNext) {
          if (nxt.soldTicketsCount > 0) {
            showToast(`Không thể lùi lịch suất chiếu "${movieMap[nxt.movieId]?.title}" vì đã có vé được bán.`, "danger");
            return;
          }
          nxt.startTime = fromBusinessMinutes(minNext);
          nxt.dirty = true;
          changed = true;
        }
      }
      iterations++;
    }

    // Kiểm tra lần cuối: suất cuối có vượt 01:00 không
    if (roomEvents.length > 0) {
      const lastEv = roomEvents[roomEvents.length - 1];
      if (getEventEndBusinessMinutes(lastEv, movieMap) > BUSINESS_END_MINUTES) {
        showToast("Việc đẩy lịch khiến suất chiếu cuối vượt quá 01:00 sáng, hãy chọn giờ sớm hơn.", "warning");
        return;
      }
    }

    // Tất cả hợp lệ — cập nhật state một lần duy nhất
    setState(prev => ({ ...prev, events: updatedEvents }));
    setDragData(null);
    // Vị trí thực tế có thể lệch so với ô vừa bấm/thả (do bị đẩy giờ né trùng lịch) — cuộn tới đó.
    setPendingScrollTarget({ roomId, time: dropTimeStr });
  };

  const onDropCell = (e, roomId, time) => {
    e.preventDefault();
    e.stopPropagation();
    placeOnCell(roomId, time, dragData || readDragPayload(e));
  };

  const findDropCellAtPoint = (x, y) => {
    const element = document.elementFromPoint(x, y);
    const cell = element?.closest?.('[data-showtime-drop-cell="true"]');
    if (!cell) return null;
    const roomId = Number(cell.dataset.roomId);
    const time = cell.dataset.time;
    if (!Number.isFinite(roomId) || !time) return null;
    return { roomId, time };
  };

  const scrollWhilePointerDragging = (event) => {
    const threshold = 120;
    const scrollSpeed = 24;

    if (window.innerHeight - event.clientY < threshold) {
      window.scrollBy({ top: scrollSpeed, behavior: "auto" });
    } else if (event.clientY < threshold) {
      window.scrollBy({ top: -scrollSpeed, behavior: "auto" });
    }

    const container = document.querySelector(".showtime-table-scroll");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (event.clientY < rect.top || event.clientY > rect.bottom) return;
    if (event.clientX > rect.right - threshold) {
      container.scrollBy({ left: scrollSpeed, behavior: "auto" });
    } else if (event.clientX < rect.left + threshold) {
      container.scrollBy({ left: -scrollSpeed, behavior: "auto" });
    }
  };

  const startMoviePointerDrag = (event, movie) => {
    if (event.button !== 0) return;

    if (pointerCleanupRef.current) pointerCleanupRef.current();

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    pointerDragRef.current = {
      movieId: movie.id,
      title: movie.title,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      document.body.style.userSelect = previousUserSelect;
      pointerCleanupRef.current = null;
    };

    const onPointerMove = (moveEvent) => {
      if (nativeDragActiveRef.current) return;
      const current = pointerDragRef.current;
      if (!current) return;

      const moved = Math.hypot(moveEvent.clientX - current.startX, moveEvent.clientY - current.startY);
      if (!current.dragging && moved < 5) return;

      if (!current.dragging) {
        current.dragging = true;
        setDragData({ type: "movie", movieId: current.movieId, slotOffset: 0 });
      }

      current.x = moveEvent.clientX;
      current.y = moveEvent.clientY;
      setPointerDragPreview({ title: current.title, x: current.x, y: current.y });

      const cell = findDropCellAtPoint(moveEvent.clientX, moveEvent.clientY);
      if (cell) {
        handleDragOverCell(cell.roomId, cell.time, { type: "movie", movieId: current.movieId, slotOffset: 0 });
      } else {
        setDragOverCell(null);
      }
      scrollWhilePointerDragging(moveEvent);
      moveEvent.preventDefault();
    };

    const onPointerUp = (upEvent) => {
      const current = pointerDragRef.current;
      pointerDragRef.current = null;
      cleanup();
      setPointerDragPreview(null);
      setDragOverCell(null);

      if (!current) return;
      if (nativeDragActiveRef.current) {
        nativeDragActiveRef.current = false;
        return;
      }
      if (current.dragging) {
        const cell = findDropCellAtPoint(upEvent.clientX, upEvent.clientY);
        if (cell) {
          placeOnCell(cell.roomId, cell.time, { type: "movie", movieId: current.movieId, slotOffset: 0 });
        } else {
          setDragData(null);
        }
        return;
      }

      setDragData({ type: "movie", movieId: current.movieId, slotOffset: 0 });
      showToast(`Đã chọn "${current.title}". Bấm vào ô giờ trống để thêm suất chiếu.`, "info");
    };

    const onPointerCancel = () => {
      pointerDragRef.current = null;
      nativeDragActiveRef.current = false;
      cleanup();
      setPointerDragPreview(null);
      setDragOverCell(null);
      setDragData(null);
    };

    pointerCleanupRef.current = cleanup;
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel, { passive: false });
  };

  return (
    <div className="admin-page showtime-schedule-page admin-fade-in">
      <style>{`
        .showtime-add-btn { opacity: 0; transition: opacity .12s, transform .12s; }
        td[data-showtime-drop-cell="true"]:hover .showtime-add-btn { opacity: 1; }
        .showtime-add-btn:hover { transform: translate(-50%, -50%) scale(1.15); background: #0d6efd !important; color: #fff !important; }
      `}</style>
      {pointerDragPreview && (
        <div
          className="shadow-sm"
          style={{
            position: "fixed",
            left: pointerDragPreview.x + 14,
            top: pointerDragPreview.y + 14,
            zIndex: 9999,
            pointerEvents: "none",
            maxWidth: 220,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#0f172a",
            color: "#fff",
            border: "1px solid rgba(56, 189, 248, 0.55)",
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {pointerDragPreview.title}
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
        <div>
          <h2 className="h4 mb-0 fw-bold text-primary">Quản lý Suất chiếu (7h - 1h sáng)</h2>
          <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
            <p className="text-muted small mb-0">Ca đêm (00:00 - 01:00) tính vào ngày kinh doanh hôm trước.</p>
            <span className={`admin-realtime-pill ${hasUnsaved ? "is-paused" : realtimeSyncing ? "is-syncing" : ""}`}>
              {hasUnsaved
                ? "Tạm dừng real-time"
                : realtimeSyncing
                  ? "Đang đồng bộ"
                  : lastSyncedAt
                    ? `Đồng bộ ${formatSyncTime(lastSyncedAt)}`
                    : "Real-time sẵn sàng"}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          {hasUnsaved && (
            <Button variant="outline-secondary" size="sm" disabled={saving} onClick={() => { loadShowtimeData(); }}>
              Hủy thay đổi
            </Button>
          )}
          <Button variant={hasUnsaved ? "primary" : "outline-primary"} size="sm" disabled={saving || !hasUnsaved} onClick={handleSaveShowtimes}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <input type="date" className="form-control form-control-sm" style={{ width: "150px" }} value={globalDate} onChange={e => {
            const nextDate = e.target.value;
            setGlobalDate(nextDate);
            globalDateRef.current = nextDate;
            const nd = {}; state.rooms.forEach(r => nd[r.id] = nextDate);
            setRoomDates(nd);
            setPendingDeleteIds([]);
            setState(prev => ({
              ...prev,
              events: prev.events
                .filter(ev => ev.serverId)
                .map(ev => ({ ...ev, dirty: false }))
            }));
            setDragData(null);
            setDragOverCell(null);
            setPointerDragPreview(null);
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
          <span className="fw-bold text-muted small">Phim đang chiếu</span>
          <input type="text" className="form-control form-control-sm w-auto bg-light border-0" placeholder="Tìm phim..." value={movieSearchTerm} onChange={e => setMovieSearchTerm(e.target.value)} style={{ fontSize: "0.7rem" }} />
        </Card.Header>
        <Card.Body className="p-2">
          <div className="d-flex gap-3 overflow-auto pb-2 px-2">
            {draggableMovies.map(m => (
              <div
                key={m.id}
                draggable
                onDragStart={e => handleDragStart(e, "movie", { movieId: m.id })}
                onDragEnd={() => {
                  nativeDragActiveRef.current = false;
                  setDragOverCell(null);
                  setDragData(null);
                  setPointerDragPreview(null);
                }}
                onPointerDown={e => startMoviePointerDrag(e, m)}
                className={`p-2 border rounded text-center bg-white shadow-xs ${dragData?.type === "movie" && dragData.movieId === m.id ? "border-primary border-2" : ""}`}
                style={{ minWidth: "150px", cursor: "grab" }}
                title="Kéo vào lịch hoặc bấm chọn rồi bấm ô giờ"
              >
                <div className="fw-bold small text-truncate mb-1">{m.title}</div>
                <Badge bg="info" className="text-dark fw-normal" style={{ fontSize: "0.65rem" }}>{m.durationMin} phút</Badge>
              </div>
            ))}
            {draggableMovies.length === 0 && (
              <div className="text-muted small px-2 py-3">Không có phim đang chiếu phù hợp.</div>
            )}
          </div>
        </Card.Body>
      </Card>

      <div className="table-responsive showtime-table-scroll bg-white rounded-3 shadow-sm border" style={{ maxHeight: "650px" }}>
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
                  const bDate = roomDates[room.id] || globalDate;
                  const isPreviewActive = ["movie", "event"].includes(dragData?.type) && previewEvents?.roomId === room.id && previewEvents?.bDate === bDate;
                  const ev = isPreviewActive
                    ? previewEvents.events.find(e => e.startTime === time)
                    : state.events.find(e => e.roomId === room.id && e.businessDate === bDate && e.startTime === time);
                  const movie = ev ? movieMap[ev.movieId] : null;
                  const duration = movie?.durationMin || 120;
                  const isPreviewEv = ev?.isPreview;
                  const isPushedEv = isPreviewActive && ev && !isPreviewEv;
                  const isPast = ev && !isPreviewEv ? isPastShowtime(ev.businessDate, ev.startTime) : false;

                  return (
                    <td
                      key={time}
                      data-showtime-drop-cell="true"
                      data-room-id={room.id}
                      data-time={time}
                      className="p-0 position-relative"
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                      onDragEnter={() => dragData && handleDragOverCell(room.id, time, dragData)}
                      onDrop={(e) => { setDragOverCell(null); onDropCell(e, room.id, time); }}
                      style={{ height: "95px" }}
                    >
                      {!ev && !isPreviewActive && (
                        <button
                          type="button"
                          className="showtime-add-btn position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: "22px", height: "22px", borderRadius: "50%",
                            border: "1px solid #0d6efd", background: "var(--admin-bg-card)", color: "#0d6efd",
                            fontSize: "0.9rem", lineHeight: 1, cursor: "pointer", zIndex: 2, padding: 0,
                          }}
                          title="Thêm suất chiếu"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dragData?.type === "movie") {
                              placeOnCell(room.id, time, dragData);
                            } else {
                              setAddSlot({ roomId: room.id, time });
                              setAddSlotMovieId("");
                            }
                          }}
                        >
                          +
                        </button>
                      )}
                      {ev && (
                        <div
                          draggable={!isPast && !isPreviewEv}
                          onDragStart={e => !isPast && !isPreviewEv && handleDragStart(e, "event", { eventId: ev.id })}
                          onDragEnd={() => { setDragOverCell(null); setDragData(null); }}
                          onClick={() => { if (!isPreviewEv) { setDetailEvent(ev); setShowDetailModal(true); } }}
                          title={!isPast && !isPreviewEv ? "Kéo để dời suất chiếu, bấm để xem/sửa chi tiết" : undefined}
                          className={"position-absolute rounded-2 p-2 shadow-sm overflow-hidden " +
                            (isPreviewEv ? "bg-success text-white" :
                             isPushedEv ? "bg-warning" :
                             isPast ? "bg-secondary bg-opacity-25 border-secondary text-muted" :
                             (ev.dirty || !ev.serverId ? "bg-warning" : "bg-primary text-white"))
                          }
                          style={{
                            top: "6px", left: "2px", height: "83px", zIndex: 5,
                            cursor: isPreviewEv ? "default" : isPast ? "default" : "grab",
                            width: ((duration / SLOT_INTERVAL) * SLOT_WIDTH - 4) + "px",
                            borderWidth: "2px",
                            opacity: isPreviewEv ? 0.75 : isPast ? 0.7 : 1,
                            borderStyle: isPreviewEv ? "dashed" : "solid",
                            pointerEvents: isPreviewEv ? "none" : "auto"
                          }}
                        >
                          <div className="fw-bold text-truncate mb-1" style={{ fontSize: "0.75rem" }}>
                            {movie?.title || "Đang tải..."}
                            {isPast && !isPreviewEv && <span className="ms-1 small opacity-75">(Đã chiếu)</span>}
                          </div>

                          {!isPast && !isPreviewEv && ev.soldTicketsCount === 0 && (
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

                          <div className="small opacity-75" style={{ fontSize: "0.65rem" }}>{ev.startTime} - {calculateEndTime(ev.startTime, duration)}</div>
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
          <Modal.Title className="fw-bold text-primary"> Chi tiết Suất chiếu {detailEvent && isPastShowtime(detailEvent.businessDate, detailEvent.startTime) && "(Đã kết thúc)"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailEvent && (
            <div className="row g-3">
              {isPastShowtime(detailEvent.businessDate, detailEvent.startTime) && (
                <div className="col-12">
                  <div className="alert alert-info py-2 px-3 small border-0 mb-0">
                    Suất chiếu này đã diễn ra hoặc đang chiếu. Bạn chỉ có thể xem thông tin, không thể sửa đổi.
                  </div>
                </div>
              )}
              <div className="col-12 bg-light p-3 rounded-3 mb-2 border border-primary border-opacity-10">
                <h5 className="fw-bold text-dark mb-1">{movieMap[detailEvent.movieId]?.title}</h5>
                <Badge bg="primary">{movieMap[detailEvent.movieId]?.durationMin} phút</Badge>
              </div>
              <div className="col-6"><div className="small text-muted mb-1">Ngày (Kinh doanh)</div><div className="fw-bold">{formatDate(detailEvent.businessDate)}</div></div>
              <div className="col-6">
                <label className="form-label small text-muted mb-1">Giờ bắt đầu</label>
                {isPastShowtime(detailEvent.businessDate, detailEvent.startTime) ? (
                  <div className="fw-bold text-primary">{detailEvent.startTime} - {calculateEndTime(detailEvent.startTime, movieMap[detailEvent.movieId]?.durationMin)}</div>
                ) : (
                  <>
                    <select
                      className="form-select form-select-sm fw-bold border-primary border-opacity-25"
                      value={detailEvent.startTime}
                      disabled={detailEvent.soldTicketsCount > 0}
                      onChange={e => placeOnCell(detailEvent.roomId, e.target.value, { type: "event", eventId: detailEvent.id })}
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="small text-muted mt-1">Kết thúc dự kiến: {calculateEndTime(detailEvent.startTime, movieMap[detailEvent.movieId]?.durationMin)}</div>
                    {detailEvent.soldTicketsCount > 0 && (
                      <div className="small text-danger mt-1">Đã có vé bán, không thể đổi giờ.</div>
                    )}
                  </>
                )}
              </div>
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

      <Modal show={Boolean(addSlot)} onHide={() => setAddSlot(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">
            Thêm suất chiếu lúc {addSlot?.time}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addSlot && (
            <div className="row g-3">
              <div className="col-12 bg-light p-3 rounded-3 mb-1 border border-primary border-opacity-10 d-flex justify-content-between align-items-center">
                <div>
                  <div className="small text-muted mb-1">Giờ bắt đầu</div>
                  <select
                    className="form-select form-select-sm fw-bold border-primary border-opacity-25"
                    style={{ width: "110px" }}
                    value={addSlot.time}
                    onChange={e => setAddSlot(prev => ({ ...prev, time: e.target.value }))}
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="text-end">
                  <div className="small text-muted mb-1">Phòng / Ngày</div>
                  <div className="fw-bold">{state.rooms.find(r => r.id === addSlot.roomId)?.name}</div>
                  <div className="small text-muted">{formatDate(roomDates[addSlot.roomId] || globalDate)}</div>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Phim</label>
                <select
                  className="form-select form-select-sm fw-bold border-primary border-opacity-25"
                  value={addSlotMovieId}
                  onChange={e => setAddSlotMovieId(e.target.value)}
                >
                  <option value="">-- Chọn phim --</option>
                  {draggableMovies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.durationMin} phút)</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="primary"
            className="w-100 fw-bold py-2 rounded-2"
            disabled={!addSlotMovieId}
            onClick={() => {
              placeOnCell(addSlot.roomId, addSlot.time, { type: "movie", movieId: Number(addSlotMovieId) });
              setAddSlot(null);
            }}
          >
            Thêm suất chiếu
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastComponent />
    </div>
  );
}
