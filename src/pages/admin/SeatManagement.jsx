import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Form } from "react-bootstrap";
import { Lock, LockOpen, Save } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { ROOMS, SEATS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

/** Tên loại ghế UI ↔ seed DB (`DatabaseSeedService`) */
const UI_TO_API_SEAT_TYPE = {
  Thường: "Ghế thường",
  VIP: "Ghế VIP",
  Đôi: "Ghế đôi Sweetbox",
};
const API_TO_UI_SEAT_TYPE = {
  "Ghế thường": "Thường",
  "Ghế VIP": "VIP",
  "Ghế đôi Sweetbox": "Đôi",
};

const ROWS = 15;
const COLS = 25;
const SEAT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const isPlacedSeat = (cell) =>
  cell && cell.type !== "Empty" && cell.type !== "OccupiedByDouble";

/** Tên ghế: số Y + chữ cái thứ tự trong hàng (vd: 1A, 1B, 2A). */
const makeSeatLabel = (y, seatLetterIndex) =>
  `${y}${SEAT_LETTERS[seatLetterIndex] ?? "?"}`;

const rowHasAnySeat = (grid, r) => {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    if (isPlacedSeat(grid[i])) return true;
  }
  return false;
};

/** Y ảo: hàng trên không có ghế thì hàng này vẫn 1A… */
const virtualRowY = (grid, r) => {
  let above = 0;
  for (let r2 = 0; r2 < r; r2++) {
    if (rowHasAnySeat(grid, r2)) above++;
  }
  return above + 1;
};

const recomputeSeatLabels = (grid) => {
  const out = [...grid];
  for (let r = 0; r < ROWS; r++) {
    const y = virtualRowY(out, r);
    let letterIdx = 0;
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const cell = out[idx];
      if (isPlacedSeat(cell)) {
        out[idx] = { ...cell, label: makeSeatLabel(y, letterIdx) };
        letterIdx++;
      }
    }
  }
  return out;
};

const TYPES = ["Thường", "VIP", "Đôi"];
const nextType = (t) => TYPES[(TYPES.indexOf(t) + 1) % TYPES.length];

const emptyCell = (r, c) => ({
  rowIdx: r,
  colIdx: c,
  type: "Empty",
  label: "",
  isActive: false,
});

const cloneGrid = (grid) => grid.map((cell) => ({ ...cell }));

const isEmptyCell = (cell) => cell?.type === "Empty";

/** Xóa ghế tại (r,c) (gồm ô ghép nếu Đôi). */
const clearSeatAt = (grid, r, c) => {
  const g = cloneGrid(grid);
  const idx = r * COLS + c;
  const cell = g[idx];
  if (!isPlacedSeat(cell)) return g;
  if (cell.type === "Đôi" && c + 1 < COLS) {
    const i2 = r * COLS + c + 1;
    g[i2] = { ...g[i2], ...emptyCell(r, c + 1) };
  }
  g[idx] = { ...g[idx], ...emptyCell(r, c) };
  return g;
};

/** Đặt ghế (copy type, isActive) tại (r,c). */
const placeSeatCopy = (grid, r, c, src) => {
  const g = cloneGrid(grid);
  const idx = r * COLS + c;
  g[idx] = {
    ...g[idx],
    type: src.type,
    isActive: src.isActive !== false,
    label: "",
  };
  if (src.type === "Đôi" && c + 1 < COLS) {
    const i2 = r * COLS + c + 1;
    g[i2] = { ...g[i2], type: "OccupiedByDouble", isActive: false, label: "" };
  }
  return g;
};

/**
 * Di chuyển ghế từ (fr,fc) → (tr,tc). Chỉ thả vào ô trống đủ chỗ (ghế đôi cần 2 ô liền).
 */
const applyMoveSeat = (grid, fr, fc, tr, tc) => {
  const src = grid[fr * COLS + fc];
  if (!isPlacedSeat(src)) return grid;
  if (fr === tr && fc === tc) return grid;

  const work = clearSeatAt(grid, fr, fc);

  if (src.type === "Đôi") {
    if (tc + 1 >= COLS) return grid;
    const a = work[tr * COLS + tc];
    const b = work[tr * COLS + tc + 1];
    if (!isEmptyCell(a) || !isEmptyCell(b)) return grid;
  } else {
    const t = work[tr * COLS + tc];
    if (!isEmptyCell(t)) return grid;
  }

  return placeSeatCopy(work, tr, tc, src);
};

export default function SeatManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const staffSession = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const effectiveCinemaId = staffSession?.cinemaId ?? selectedCinemaId ?? null;

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(location.state?.roomId || location.state?.roomInfo?.id || "");
  const [seats, setSeats] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const suppressClickRef = useRef(false);

  // Clear selection when room changes
  useEffect(() => {
    setSelectedIndices(new Set());
  }, [selectedRoomId]);

  const handleMouseDown = (idx) => {
    if (isLocked) return;
    // If clicking a seat that is already part of a selection, we might be starting a move drag
    // So we only start brush selection if not dragging or if clicking empty/new seat
    setIsSelecting(true);
    setSelectedIndices(new Set([idx]));
  };

  const handleMouseEnterSelection = (idx) => {
    if (isSelecting) {
      setSelectedIndices(prev => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    }
  };

  const handleMouseUpGlobal = useCallback(() => {
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
  }, [handleMouseUpGlobal]);

  const handleBulkAction = (action) => {
    if (selectedIndices.size === 0) return;
    
    setSeats(prev => {
      const next = [...prev];
      selectedIndices.forEach(idx => {
        const cell = next[idx];
        if (!cell || cell.type === "OccupiedByDouble") return;

        switch (action) {
          case "SET_NORMAL":
            if (cell.type === "Đôi") clearSeatAtInPlace(next, cell.rowIdx, cell.colIdx);
            next[idx] = { ...next[idx], type: "Thường", isActive: true };
            break;
          case "SET_VIP":
            if (cell.type === "Đôi") clearSeatAtInPlace(next, cell.rowIdx, cell.colIdx);
            next[idx] = { ...next[idx], type: "VIP", isActive: true };
            break;
          case "SET_DOUBLE":
            if (cell.type === "Đôi") break;
            // Check if can place double
            if (cell.colIdx + 1 < COLS) {
              const nextIdx = cell.rowIdx * COLS + cell.colIdx + 1;
              if (isEmptyCell(next[nextIdx]) || selectedIndices.has(nextIdx)) {
                next[idx] = { ...cell, type: "Đôi", isActive: true };
                next[nextIdx] = { rowIdx: cell.rowIdx, colIdx: cell.colIdx + 1, type: "OccupiedByDouble", isActive: false, label: "" };
              }
            }
            break;
          case "TOGGLE_ACTIVE":
            if (isPlacedSeat(cell)) {
              next[idx] = { ...cell, isActive: !cell.isActive };
            }
            break;
          case "DELETE":
            if (cell.type === "Đôi") {
              const nIdx = cell.rowIdx * COLS + cell.colIdx + 1;
              next[nIdx] = emptyCell(cell.rowIdx, cell.colIdx + 1);
            }
            next[idx] = emptyCell(cell.rowIdx, cell.colIdx);
            break;
          default: break;
        }
      });
      return recomputeSeatLabels(next);
    });
    // Don't clear selection immediately so user can see result, but maybe it's better to clear
  };

  const clearSeatAtInPlace = (grid, r, c) => {
    const idx = r * COLS + c;
    const cell = grid[idx];
    if (cell.type === "Đôi" && c + 1 < COLS) {
      const i2 = r * COLS + c + 1;
      grid[i2] = emptyCell(r, c + 1);
    }
    grid[idx] = emptyCell(r, c);
  };

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(selectedRoomId)) || location.state?.roomInfo,
    [rooms, selectedRoomId, location.state?.roomInfo]
  );

  const buildGridFromSeats = useCallback((seatList) => {
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid.push({
          rowIdx: r,
          colIdx: c,
          type: "Empty",
          label: "",
          isActive: false,
        });
      }
    }
    const list = (seatList || []).slice().sort((a, b) => a.rowIdx - b.rowIdx || a.colIdx - b.colIdx);
    list.forEach((s) => {
      const idx = s.rowIdx * COLS + s.colIdx;
      if (idx >= 0 && idx < grid.length) {
        const active = s.isActive !== false;
        grid[idx] = { ...grid[idx], type: s.type, label: "", isActive: active };
        if (s.type === "Đôi" && s.colIdx + 1 < COLS) {
          const nextIdx = s.rowIdx * COLS + s.colIdx + 1;
          grid[nextIdx] = { ...grid[nextIdx], type: "OccupiedByDouble", isActive: false, label: "" };
        }
      }
    });
    return recomputeSeatLabels(grid);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = effectiveCinemaId != null ? `?cinemaId=${effectiveCinemaId}` : "";
        const res = await apiFetch(`${ROOMS.LIST}${q}`);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setRooms(arr.map((r) => ({ id: r.id, name: r.name })));
      } catch {
        if (mounted) setRooms([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [effectiveCinemaId]);

  const seatGrid = selectedRoomId ? seats : buildGridFromSeats([]);

  useEffect(() => {
    if (!selectedRoomId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(SEATS.BY_ROOM(selectedRoomId));
        const json = await res.json().catch(() => null);
        const list = Array.isArray(json?.data) ? json.data : [];
        const seatList = list.map((s) => ({
          rowIdx: s.y,
          colIdx: s.x,
          type: API_TO_UI_SEAT_TYPE[s.seatTypeName] || "Thường",
          isActive: true,
        }));
        if (mounted) setSeats(buildGridFromSeats(seatList));
      } catch {
        if (mounted) setSeats(buildGridFromSeats([]));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedRoomId, buildGridFromSeats]);

  const getSeatLabelPreview = useCallback((grid, r, c) => {
    const y = virtualRowY(grid, r);
    let letterIdx = 0;
    for (let col = 0; col < c; col++) {
      const i = r * COLS + col;
      if (isPlacedSeat(grid[i])) letterIdx++;
    }
    return makeSeatLabel(y, letterIdx);
  }, []);

  const handleDragStart = (e, rowIdx, colIdx) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    const cell = seats[rowIdx * COLS + colIdx];
    if (!isPlacedSeat(cell)) {
      e.preventDefault();
      return;
    }
    const payload = JSON.stringify({ r: rowIdx, c: colIdx });
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDragOverKey(null);
  };

  const handleDragOverCell = (e, rowIdx, colIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(`${rowIdx}-${colIdx}`);
  };

  const handleDropOnCell = (e, tr, tc) => {
    e.preventDefault();
    setDragOverKey(null);
    if (isLocked) return;
    let from;
    try {
      from = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    } catch {
      return;
    }
    if (from.r === undefined || from.c === undefined) return;
    if (from.r === tr && from.c === tc) return;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 200);

    setSeats((prev) => {
      const next = applyMoveSeat(prev, from.r, from.c, tr, tc);
      if (next === prev) {
        return prev;
      }
      return recomputeSeatLabels(next);
    });
  };

  const handleCellClick = (rowIdx, colIdx) => {
    if (suppressClickRef.current) return;
    if (isLocked) return;
    const idx = rowIdx * COLS + colIdx;
    const cell = seats[idx];
    if (!cell) return;
    if (cell.type === "OccupiedByDouble") return;

    const next = [...seats];
    if (isPlacedSeat(cell)) {
      if (cell.isActive) {
        next[idx] = { ...cell, isActive: false };
      } else {
        next[idx] = { ...cell, isActive: true };
      }
    } else {
      const label = getSeatLabelPreview(seats, rowIdx, colIdx);
      next[idx] = { ...cell, type: "Thường", label, isActive: true };
    }
    setSeats(recomputeSeatLabels(next));
  };

  const handleContextMenu = (e, rowIdx, colIdx) => {
    e.preventDefault();
    if (isLocked) return;
    const idx = rowIdx * COLS + colIdx;
    const cell = seats[idx];
    if (!cell || !cell.isActive || cell.type === "OccupiedByDouble") return;

    const nextTypeVal = nextType(cell.type);
    const next = [...seats];

    if (cell.type === "Đôi") {
      const nextCol = colIdx + 1;
      if (nextCol < COLS) {
        const nextIdx = rowIdx * COLS + nextCol;
        next[nextIdx] = { ...next[nextIdx], type: "Empty", isActive: false, label: "" };
      }
    }

    if (nextTypeVal === "Đôi") {
      const nextCol = colIdx + 1;
      if (nextCol >= COLS) return;
      const nextIdx = rowIdx * COLS + nextCol;
      if (!isEmptyCell(next[nextIdx])) return;
      next[idx] = { ...cell, type: "Đôi", label: cell.label, isActive: true };
      next[nextIdx] = { ...next[nextIdx], type: "OccupiedByDouble", isActive: false, label: "" };
    } else {
      next[idx] = { ...cell, type: nextTypeVal, label: cell.label, isActive: true };
    }
    setSeats(recomputeSeatLabels(next));
  };

  const handleSave = async () => {
    if (!selectedRoomId) {
      alert("Chọn phòng trước khi lưu.");
      return;
    }
    const items = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const cell = seats[idx];
        if (cell?.type === "OccupiedByDouble") continue;
        if (isPlacedSeat(cell)) {
          items.push({
            x: c,
            y: r,
            row: String(r + 1),
            number: cell.label || "",
            seatTypeName: UI_TO_API_SEAT_TYPE[cell.type] || "Ghế thường",
          });
        }
      }
    }
    try {
      const res = await apiFetch(SEATS.LAYOUT, {
        method: "PUT",
        body: JSON.stringify({
          roomId: Number(selectedRoomId),
          seats: items,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Lưu sơ đồ ghế thất bại");
        return;
      }
      alert("Đã lưu sơ đồ ghế.");
      navigate(`${prefix}/rooms`);
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const getSeatColor = useCallback(
    (cell, r, c) => {
      let main = cell;
      if (cell?.type === "OccupiedByDouble" && c > 0) {
        main = seatGrid[r * COLS + (c - 1)];
      }
      if (!isPlacedSeat(main)) return "#e9ecef";
      if (!main.isActive) return "#adb5bd";
      switch (main.type) {
        case "Thường": return "#0d6efd";
        case "VIP": return "#ffc107";
        case "Đôi": return "#dc3545";
        default: return "#e9ecef";
      }
    },
    [seatGrid]
  );

  return (
    <AdminPanelPage
      icon="grid-3x3"
      title="Sơ đồ ghế phòng"
      description={
        <>
          <p className="lead mb-2">
            {selectedRoom?.name ? (
              <>
                Đang chỉnh: <strong>{selectedRoom.name}</strong>
              </>
            ) : (
              "Chọn phòng để thiết kế lưới ghế."
            )}
          </p>
          <p className="mb-0 small" style={{ opacity: 0.92 }}>
            Tên ghế: số hàng (Y) + chữ (vd 1A, 2B). Kéo ghế thả vào ô trống (ghế đôi cần 2 ô liền). Click ô trống tạo ghế; click ghế bật/tắt. Chuột phải đổi loại (khi bật).
          </p>
        </>
      }
      headerRight={
        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-end">
          <Form.Select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ minWidth: 200, borderRadius: 10 }}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Form.Select>
          <Button
            variant={isLocked ? "warning" : "outline-light"}
            className="border-0"
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? "Mở khóa" : "Khóa form"}
          >
            {isLocked ? <Lock size={18} /> : <LockOpen size={18} />}
          </Button>
          <button type="button" className="admin-btn" style={{ background: "white", color: "#6366f1" }} onClick={() => navigate(`${prefix}/rooms`)}>
            Hủy
          </button>
          <Button variant="light" className="fw-semibold text-primary" disabled={!selectedRoom || isLocked} onClick={handleSave}>
            <Save size={16} className="me-1" /> Lưu sơ đồ
          </Button>
        </div>
      }
      className="seat-management"
    >
      <style>{`
        .seat-grid-container {
          display: grid;
          grid-template-columns: 36px repeat(${COLS}, 1fr);
          gap: 6px;
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          max-width: 100%;
          overflow-x: auto;
        }
        .row-label {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #6c757d;
          font-size: 0.85rem;
        }
        .col-label {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #6c757d;
          font-size: 0.75rem;
        }
        .seat-box {
          aspect-ratio: 1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .seat-box.placeholder {
          color: transparent;
          border: 1px dashed #dee2e6;
          background: #f8f9fa;
        }
        .seat-box.placeholder:hover { background: #e9ecef; }
        .seat-box.placed { cursor: pointer; color: #fff; }
        .seat-box.seat-off {
          color: #fff;
          border: 2px dashed rgba(0,0,0,0.2);
        }
        .seat-box.active { cursor: pointer; }
        .seat-box.type-doi { grid-column: span 2; aspect-ratio: auto; height: 100%; }
        .seat-box.drag-over {
          outline: 3px solid #198754;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.35);
        }
        .seat-box[draggable="true"] { cursor: grab; }
        .seat-box[draggable="true"]:active { cursor: grabbing; }
        .seat-box.brush-selected {
          outline: 3px solid #ffc107;
          outline-offset: 1px;
          z-index: 10;
          box-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
        }
        .screen-bar {
          height: 6px;
          background: #343a40;
          width: 40%;
          margin: 0 auto 24px;
          border-radius: 0 0 12px 12px;
        }
        .screen-bar::after {
          content: 'MÀN HÌNH';
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          letter-spacing: 8px;
          color: #adb5bd;
          font-weight: 700;
        }
      `}</style>

      {!selectedRoom ? (
        <Card className="border-0 shadow-sm p-5 text-center" style={{ borderRadius: 16 }}>
          <p className="text-muted mb-0">Vui lòng chọn phòng chiếu để thiết kế sơ đồ ghế.</p>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-sm p-3 mb-3" style={{ borderRadius: 12 }}>
            <div className="d-flex flex-wrap gap-4 align-items-center">
              <span className="fw-bold">Lưới: {ROWS} x {COLS}</span>
              <Badge bg="dark">{seatGrid.filter((s) => isPlacedSeat(s)).length} ghế đặt</Badge>
              <Badge bg="success">{seatGrid.filter((s) => isPlacedSeat(s) && s.isActive).length} đang bật</Badge>
              <Badge bg="secondary">{seatGrid.filter((s) => isPlacedSeat(s) && !s.isActive).length} đang tắt</Badge>
              <Badge bg="primary">{seatGrid.filter((s) => isPlacedSeat(s) && s.isActive && s.type === "Thường").length} Thường</Badge>
              <Badge bg="warning" text="dark">{seatGrid.filter((s) => isPlacedSeat(s) && s.isActive && s.type === "VIP").length} VIP</Badge>
              <Badge bg="danger">{seatGrid.filter((s) => isPlacedSeat(s) && s.isActive && s.type === "Đôi").length} Đôi</Badge>
              {isLocked && <Badge bg="warning">Form đã khóa</Badge>}
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4" style={{ borderRadius: 16, position: "relative" }}>
            <div className="screen-bar" style={{ position: "relative" }} />
            <div className="seat-grid-container">
              <div />
              {Array.from({ length: COLS }).map((_, c) => (
                <div key={`col_${c}`} className="col-label">{c + 1}</div>
              ))}
              {Array.from({ length: ROWS }).map((_, r) => (
                <React.Fragment key={r}>
                  <div className="row-label">{r + 1}</div>
                  {Array.from({ length: COLS }).map((_, c) => {
                    const idx = r * COLS + c;
                    const cell = seatGrid[idx] || { type: "Empty", isActive: false, label: "" };
                    if (cell.type === "OccupiedByDouble") return null;
                    const placed = isPlacedSeat(cell);
                    const showActive = placed && cell.isActive;
                    const canDrag = placed && !isLocked;
                    const isDropTarget = dragOverKey === `${r}-${c}`;
                    return (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        draggable={canDrag}
                        className={`seat-box ${placed ? "placed" : "placeholder"} ${showActive ? "active" : ""} ${placed && !cell.isActive ? "seat-off" : ""} ${cell.type === "Đôi" ? "type-doi" : ""} ${isDropTarget ? "drag-over" : ""} ${selectedIndices.has(idx) ? "brush-selected" : ""}`}
                        style={{
                          backgroundColor: getSeatColor(cell, r, c),
                          gridColumn: cell.type === "Đôi" ? "span 2" : undefined,
                          opacity: placed && !cell.isActive ? 0.85 : 1,
                        }}
                        onClick={() => handleCellClick(r, c)}
                        onContextMenu={(e) => handleContextMenu(e, r, c)}
                        onMouseDown={() => handleMouseDown(idx)}
                        onMouseEnter={() => handleMouseEnterSelection(idx)}
                        onDragStart={(e) => handleDragStart(e, r, c)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverCell(e, r, c)}
                        onDrop={(e) => handleDropOnCell(e, r, c)}
                      >
                        {placed ? cell.label : ""}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Bulk Actions Floating Toolbar */}
            {selectedIndices.size >= 1 && (
              <div className="bulk-actions-toolbar shadow-lg d-flex align-items-center gap-2 p-3 bg-dark rounded-pill" style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                <span className="text-white fw-bold me-2 ps-2">{selectedIndices.size} ghế đang chọn</span>
                <Button variant="primary" size="sm" className="rounded-pill" onClick={() => handleBulkAction("SET_NORMAL")}>Thường</Button>
                <Button variant="warning" size="sm" className="rounded-pill" onClick={() => handleBulkAction("SET_VIP")}>VIP</Button>
                <Button variant="danger" size="sm" className="rounded-pill" onClick={() => handleBulkAction("SET_DOUBLE")}>Đôi</Button>
                <div className="vr bg-white mx-1" style={{ height: '20px' }}></div>
                <Button variant="outline-light" size="sm" className="rounded-pill" onClick={() => handleBulkAction("TOGGLE_ACTIVE")}>Bật/Tắt</Button>
                <Button variant="danger" size="sm" className="rounded-pill" onClick={() => handleBulkAction("DELETE")}>Xóa</Button>
                <Button variant="secondary" size="sm" className="rounded-pill ms-2" onClick={() => setSelectedIndices(new Set())}>Hủy</Button>
              </div>
            )}

            <div className="d-flex justify-content-center gap-4 mt-4">
              <div className="d-flex align-items-center gap-2 small fw-bold">
                <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: "#0d6efd" }} /> Thường
              </div>
              <div className="d-flex align-items-center gap-2 small fw-bold">
                <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: "#ffc107" }} /> VIP
              </div>
              <div className="d-flex align-items-center gap-2 small fw-bold">
                <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: "#dc3545" }} /> Đôi
              </div>
              <div className="d-flex align-items-center gap-2 small fw-bold text-muted">
                <div style={{ width: 14, height: 14, borderRadius: 4, border: "1px dashed #ccc", backgroundColor: "#f8f9fa" }} /> Ô trống
              </div>
              <div className="d-flex align-items-center gap-2 small fw-bold text-muted">
                <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: "#adb5bd" }} /> Tắt trạng thái
              </div>
              <div className="d-flex align-items-center gap-2 small fw-bold text-success">
                <span className="border border-success border-2 rounded" style={{ width: 14, height: 14 }} /> Kéo → thả ô trống
              </div>
            </div>
          </Card>
        </>
      )}
    </AdminPanelPage>
  );
}
