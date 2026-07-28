import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { Badge, Button, Card, Form } from "react-bootstrap";



import { apiFetch } from "../../utils/apiClient";

import { ROOMS, SEATS, SEAT_TYPES } from "../../constants/apiEndpoints";

import AdminPanelPage from "../../components/admin/AdminPanelPage";

import { useAdminToast } from "../../components/admin/AdminToast";

import { getStoredStaff } from "../../utils/authStorage";

import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

import { isActiveStatus } from "../../utils/statusFormat";

import {
  contrastTextColorForHex,
  isCoupleTypeName,
  normalizeHex,
  normalizeSeatTypeKey,
  resolveSeatDisplayColor,
  resolveSeatTypeColor,
} from "../../utils/seatTypeColors";

// Biến module-level để lưu seatTypes có coupleSeat
let _seatTypesData = [];



/** Tên loại ghế trên ô = tên trên DB (`cell.type` gửi lại API nguyên văn). */

function apiSeatTypeNameToUi(name) {

  if (name == null || name === "") return "";

  return String(name).trim();

}



function uiSeatTypeToApi(type) {

  return type && String(type).trim() ? String(type).trim() : "";

}



/** Nhãn mới: A1, A2 (chữ hàng + số thứ tự trong hàng) → row = chữ, number = số. Hỗ trợ cũ 1A (số+chữ). */

function layoutLabelToRowNumber(label, gridRowIndex) {

  const s = String(label || "");

  const mNew = s.match(/^([A-Z]+)(\d+)$/i);

  if (mNew) return { row: mNew[1].toUpperCase(), number: mNew[2] };

  const mOld = s.match(/^(\d+)([A-Z])$/i);

  if (mOld) return { row: mOld[1], number: mOld[2].toUpperCase() };

  return { row: String(gridRowIndex + 1), number: s || String(gridRowIndex + 1) };

}



const ROWS = 15;

const COLS = 24;

const SEAT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";



const isPlacedSeat = (cell) =>

  cell && cell.type !== "Empty" && cell.type !== "OccupiedByDouble";



const rowHasAnySeat = (grid, r) => {

  for (let c = 0; c < COLS; c++) {

    const i = r * COLS + c;

    if (isPlacedSeat(grid[i])) return true;

  }

  return false;

};



/** Chữ hàng A,B,C…: đếm các hàng phía trên có ít nhất một ghế. */

function virtualRowLetterIndex(grid, r) {

  let above = 0;

  for (let r2 = 0; r2 < r; r2++) {

    if (rowHasAnySeat(grid, r2)) above++;

  }

  return above;

}



function rowLetterForGridRow(grid, r) {

  const i = virtualRowLetterIndex(grid, r);

  return SEAT_LETTERS[i] ?? "?";

}



const recomputeSeatLabels = (grid) => {

  const out = [...grid];

  for (let r = 0; r < ROWS; r++) {

    const letter = rowLetterForGridRow(out, r);

    let num = 0;

    for (let c = 0; c < COLS; c++) {

      const idx = r * COLS + c;

      const cell = out[idx];

      if (isPlacedSeat(cell)) {

        num++;

        out[idx] = { ...cell, label: `${letter}${num}` };

      }

    }

  }

  return out;

};



function indexOfSeatTypeInList(current, list) {

  if (!list || list.length === 0) return -1;

  const key = normalizeSeatTypeKey(current);

  if (key) {

    const j = list.findIndex((t) => normalizeSeatTypeKey(t) === key);

    if (j >= 0) return j;

  }

  return list.indexOf(current);

}



/** Kiểm tra ghế đôi dựa vào coupleSeat từ _seatTypesData (fallback về tên nếu chưa load) */
function isCoupleSeatByType(typeName) {
  if (!typeName) return false;
  // Fallback: nếu _seatTypesData chưa load, dùng tên
  if (!_seatTypesData || !Array.isArray(_seatTypesData) || _seatTypesData.length === 0) {
    return isCoupleTypeName(typeName);
  }
  const st = _seatTypesData.find((t) => t.name === typeName);
  // Ưu tiên coupleSeat từ API, nếu chưa có thì fallback theo tên
  if (st && st.coupleSeat !== undefined) {
    return st.coupleSeat === true;
  }
  return isCoupleTypeName(typeName);
}

/** Loại kế tiếp khi chuột phải: bỏ qua ghế đôi nếu không đủ điều kiện (cột lẻ, ô phải trống, sau ghế đơn trên hàng, không phía trên hàng có ghế đơn). */
function nextApplicableSeatType(current, list, grid, r, c) {

  if (!list || list.length === 0) return current;

  const start = indexOfSeatTypeInList(current, list);

  // Bắt đầu từ vị trí tiếp theo, không phải vị trí hiện tại
  const i0 = start < 0 ? 0 : start + 1;

  for (let i = 0; i < list.length; i++) {

    const idx = (i0 + i) % list.length;

    const cand = list[idx];

    if (!isCoupleSeatByType(cand)) return cand;

    if (canPlaceCoupleAt(grid, r, c)) return cand;

  }

  return current;
}



const emptyCell = (r, c) => ({

  rowIdx: r,

  colIdx: c,

  type: "Empty",

  label: "",

  isActive: false,

});



const cloneGrid = (grid) => grid.map((cell) => ({ ...cell }));



const isEmptyCell = (cell) => cell?.type === "Empty";



/** Cột lớn nhất (0-based) có ghế đơn trên hàng r; bỏ qua (excludeAnchor, excludeAnchor+1) khi đang thử đặt ghế đôi neo tại đó. */

function maxSingleSeatColInRow(grid, r, excludeCoupleAnchorCol) {

  const skip = new Set();

  if (excludeCoupleAnchorCol != null) {

    skip.add(excludeCoupleAnchorCol);

    if (excludeCoupleAnchorCol + 1 < COLS) skip.add(excludeCoupleAnchorCol + 1);

  }

  let mx = -1;

  for (let col = 0; col < COLS; col++) {

    if (skip.has(col)) continue;

    const cell = grid[r * COLS + col];

    if (!isPlacedSeat(cell)) continue;

    if (cell.type === "OccupiedByDouble") continue;

    if (isCoupleSeatByType(cell.type)) continue;

    mx = Math.max(mx, col);

  }

  return mx;

}



/** Hàng (0-based) cao nhất trên lưới có ít nhất một ghế đơn; bỏ qua hai ô neo ghế đôi đang thử (exR, exC1)(exR, exC2) nếu có. */

function minSingleSeatRowInGrid(grid, exR, exC1, exC2) {

  let minR = ROWS;

  for (let r = 0; r < ROWS; r++) {

    for (let col = 0; col < COLS; col++) {

      if (exR != null && r === exR && (col === exC1 || col === exC2)) continue;

      const cell = grid[r * COLS + col];

      if (!isPlacedSeat(cell)) continue;

      if (cell.type === "OccupiedByDouble") continue;

      if (isCoupleSeatByType(cell.type)) continue;

      minR = Math.min(minR, r);

    }

  }

  return minR >= ROWS ? -1 : minR;

}



/** Ghế đôi: cột nhãn lẻ (1,3,5…); ô phải trống; sau mọi ghế đơn trên cùng hàng; không nằm trên hàng có ghế đơn (theo lưới: chỉ số hàng nhỏ hơn). */

function canPlaceCoupleAt(grid, r, c) {

  if (c + 1 >= COLS) return false;

  if ((c + 1) % 2 !== 1) return false;

  const i2 = r * COLS + c + 1;

  if (!isEmptyCell(grid[i2])) return false;

  const maxSingle = maxSingleSeatColInRow(grid, r, c);

  if (maxSingle >= 0 && c <= maxSingle) return false;

  const minSr = minSingleSeatRowInGrid(grid, r, c, c + 1);

  if (minSr >= 0 && r < minSr) return false;

  return true;

}



/** Kiểm tra toàn bộ lưới: ghế đôi sau ghế đơn trên cùng hàng; không có ghế đôi phía trên hàng có ghế đơn. */

function validateCoupleAfterSinglesLayout(grid) {

  const globalMinSingleRow = minSingleSeatRowInGrid(grid, null, null, null);

  for (let r = 0; r < ROWS; r++) {

    for (let c = 0; c < COLS; c++) {

      const cell = grid[r * COLS + c];

      if (!isPlacedSeat(cell) || !isCoupleSeatByType(cell.type)) continue;

      if (globalMinSingleRow >= 0 && r < globalMinSingleRow) {

        return {

          ok: false,

          message: `Hàng ${r + 1}: ghế đôi không được đặt phía trên (gần màn hình hơn) hàng có ghế đơn — kéo ghế đôi xuống dưới hàng ghế đơn cao nhất.`,

        };

      }

      const maxS = maxSingleSeatColInRow(grid, r, null);

      if (maxS < 0) continue;

      if (c <= maxS) {

        return {

          ok: false,

          message: `Hàng ${r + 1}: ghế đôi không được đặt trước ghế đơn — kéo ghế đôi sang phải sau tất cả ghế đơn trên hàng.`,

        };

      }

    }

  }

  return { ok: true };

}

function validateEvenSeatCountByRow(grid) {

  for (let r = 0; r < ROWS; r++) {

    let count = 0;

    for (let c = 0; c < COLS; c++) {

      const cell = grid[r * COLS + c];

      if (!isPlacedSeat(cell)) continue;

      count += isCoupleSeatByType(cell.type) ? 2 : 1;

    }

    if (count > 0 && count % 2 !== 0) {

      const rowLabel = rowLetterForGridRow(grid, r);

      return {

        ok: false,

        message: `Hàng ${rowLabel || r + 1} đang có ${count} ghế. Sơ đồ chỉ được lưu khi mỗi hàng có số ghế chẵn.`,

      };

    }

  }

  return { ok: true };

}



/** Xóa ghế tại (r,c) (gồm ô ghép nếu Đôi). */

const clearSeatAt = (grid, r, c) => {

  const g = cloneGrid(grid);

  const idx = r * COLS + c;

  const cell = g[idx];

  if (!isPlacedSeat(cell)) return g;

  if (isCoupleSeatByType(cell.type) && c + 1 < COLS) {

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

    typeColor: src.typeColor,

  };

  if (isCoupleSeatByType(src.type) && c + 1 < COLS) {

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



  if (isCoupleSeatByType(src.type)) {

    if (tc + 1 >= COLS) return grid;

    if (!canPlaceCoupleAt(work, tr, tc)) return grid;

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

  const { showToast, ToastComponent } = useAdminToast();

  const [saving, setSaving] = useState(false);

  const [seatTypeNames, setSeatTypeNames] = useState([]);

  const [seatTypesForColor, setSeatTypesForColor] = useState([]);

  const [dragOverKey, setDragOverKey] = useState(null);

  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const [isSelecting, setIsSelecting] = useState(false);

  const suppressClickRef = useRef(false);



  // Clear selection when room changes

  useEffect(() => {

    setSelectedIndices(new Set());

  }, [selectedRoomId]);



  useEffect(() => {

    let mounted = true;

    (async () => {

      try {

        const res = await apiFetch(SEAT_TYPES.LIST);

        const json = await res.json().catch(() => null);

        const arr = Array.isArray(json?.data) ? json.data : [];

        const names = arr.map((x) => x.name).filter(Boolean);

        if (mounted && names.length > 0) setSeatTypeNames(names);

        if (mounted) {

          const seatTypesWithCouple = arr.map((x) => ({ 
            name: x.name, 
            color: x.color,
            coupleSeat: x.coupleSeat ?? x.couple_seat ?? isCoupleTypeName(x.name) 
          })).filter((x) => x.name);
          
          // Lưu vào biến module-level để các hàm helper dùng
          _seatTypesData = seatTypesWithCouple;
          
          setSeatTypesForColor(seatTypesWithCouple);

        }

      } catch {

        /* giữ mặc định */

      }

    })();

    return () => {

      mounted = false;

    };

  }, []);



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



  const handleBulkAction = (action, payload) => {
    if (selectedIndices.size === 0) return;

    setSeats(prev => {
      const next = [...prev];
      selectedIndices.forEach(idx => {
        const cell = next[idx];
        if (!cell || cell.type === "OccupiedByDouble") return;

        switch (action) {
          case "SET_TYPE": {
            const typeName = payload;
            if (!typeName) break;

            const isDouble = isCoupleSeatByType(typeName);

            if (isDouble) {
              // Logic đặt ghế đôi
              if (cell.colIdx + 1 >= COLS) break;
              if (!canPlaceCoupleAt(next, cell.rowIdx, cell.colIdx)) break;
              const nextIdx = cell.rowIdx * COLS + cell.colIdx + 1;
              if (!isEmptyCell(next[nextIdx])) break;

              // Nếu đang là ghế đơn hoặc đôi cũ, cần dọn dẹp
              if (isCoupleSeatByType(cell.type)) clearSeatAtInPlace(next, cell.rowIdx, cell.colIdx);

              next[idx] = { ...cell, type: typeName, isActive: true, typeColor: undefined };
              next[nextIdx] = {
                rowIdx: cell.rowIdx,
                colIdx: cell.colIdx + 1,
                type: "OccupiedByDouble",
                isActive: false,
                label: "",
              };
            } else {
              // Logic đặt ghế đơn
              if (isCoupleSeatByType(cell.type)) clearSeatAtInPlace(next, cell.rowIdx, cell.colIdx);
              next[idx] = { ...next[idx], type: typeName, isActive: true, typeColor: undefined };
            }
            break;
          }
          case "TOGGLE_ACTIVE":
            if (isPlacedSeat(cell)) {
              next[idx] = { ...cell, isActive: !cell.isActive };
            }
            break;
          case "DELETE":
            if (isCoupleSeatByType(cell.type)) {
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
  };

  const clearSeatAtInPlace = (grid, r, c) => {
    const idx = r * COLS + c;
    const cell = grid[idx];
    if (isCoupleSeatByType(cell.type) && c + 1 < COLS) {
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

        const typeColor = normalizeHex(s.typeColor) || undefined;

        grid[idx] = { ...grid[idx], type: s.type, label: "", isActive: active, typeColor };

        if (isCoupleSeatByType(s.type) && s.colIdx + 1 < COLS) {

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

        setRooms(arr.filter((r) => isActiveStatus(r.status)).map((r) => ({ id: r.id, name: r.name })));

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

          type: apiSeatTypeNameToUi(s.seatTypeName),

          isActive: true,

          typeColor: normalizeHex(s.seatTypeColor ?? s.seat_type_color) || undefined,

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

    const letter = rowLetterForGridRow(grid, r);

    let n = 0;

    for (let col = 0; col < c; col++) {

      const i = r * COLS + col;

      if (isPlacedSeat(grid[i])) n++;

    }

    return `${letter}${n + 1}`;

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

      const defaultT =

        seatTypeNames.find((t) => !isCoupleSeatByType(t) && !/vip/i.test(String(t))) ||

        seatTypeNames.find((t) => !isCoupleSeatByType(t)) ||

        seatTypeNames[0];

      if (!defaultT) {

        showToast("Vui lòng tạo loại ghế trước khi thiết kế sơ đồ.", "warning");

        return;

      }

      next[idx] = { ...cell, type: defaultT, label, isActive: true, typeColor: undefined };

    }

    setSeats(recomputeSeatLabels(next));

  };



  const handleContextMenu = (e, rowIdx, colIdx) => {

    e.preventDefault();

    if (isLocked) return;

    const idx = rowIdx * COLS + colIdx;

    const cell = seats[idx];

    if (!cell || cell.type === "OccupiedByDouble") return;



    const next = [...seats];



    if (isCoupleSeatByType(cell.type)) {

      const nextCol = colIdx + 1;

      if (nextCol < COLS) {

        const nextIdx = rowIdx * COLS + nextCol;

        next[nextIdx] = { ...next[nextIdx], type: "Empty", isActive: false, label: "" };

      }

    }



    const nextTypeVal = nextApplicableSeatType(cell.type, seatTypeNames, next, rowIdx, colIdx);

    if (isCoupleSeatByType(nextTypeVal)) {

      if (!canPlaceCoupleAt(next, rowIdx, colIdx)) return;

      const nextCol = colIdx + 1;

      if (nextCol >= COLS) return;

      const nextIdx = rowIdx * COLS + nextCol;

      if (!isEmptyCell(next[nextIdx])) return;

      next[idx] = { ...cell, type: nextTypeVal, label: cell.label, isActive: true, typeColor: undefined };

      next[nextIdx] = { ...next[nextIdx], type: "OccupiedByDouble", isActive: false, label: "" };

    } else {

      next[idx] = { ...cell, type: nextTypeVal, label: cell.label, isActive: true, typeColor: undefined };

    }

    setSeats(recomputeSeatLabels(next));

  };



  const handleSave = async () => {

    if (!selectedRoomId) {

      alert("Chọn phòng trước khi lưu.");

      return;

    }

    const layoutCheck = validateCoupleAfterSinglesLayout(seats);

    if (!layoutCheck.ok) {

      showToast(layoutCheck.message, "danger");

      return;

    }

    const evenSeatCountCheck = validateEvenSeatCountByRow(seats);

    if (!evenSeatCountCheck.ok) {

      showToast(evenSeatCountCheck.message, "danger");

      return;

    }

    const items = [];

    for (let r = 0; r < ROWS; r++) {

      for (let c = 0; c < COLS; c++) {

        const idx = r * COLS + c;

        const cell = seats[idx];

        if (cell?.type === "OccupiedByDouble") continue;

        if (isPlacedSeat(cell)) {

          const { row: rowStr, number: numStr } = layoutLabelToRowNumber(cell.label, r);

          items.push({

            x: c,

            y: r,

            row: rowStr,

            number: numStr,

            seatTypeName: uiSeatTypeToApi(cell.type),

          });

        }

      }

    }

    setSaving(true);

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

        showToast(json?.message || "Lưu sơ đồ ghế thất bại", "danger");

        return;

      }

      const resReload = await apiFetch(SEATS.BY_ROOM(selectedRoomId));

      const jsonReload = await resReload.json().catch(() => null);

      const list = Array.isArray(jsonReload?.data) ? jsonReload.data : [];

      const seatList = list.map((s) => ({

        rowIdx: s.y,

        colIdx: s.x,

        type: apiSeatTypeNameToUi(s.seatTypeName),

        isActive: true,

        typeColor: normalizeHex(s.seatTypeColor ?? s.seat_type_color) || undefined,

      }));

      setSeats(buildGridFromSeats(seatList));

      showToast(json?.message || `Đã lưu ${items.length} ghế lên máy chủ.`);

    } catch {

      showToast("Không thể kết nối server", "danger");

    } finally {

      setSaving(false);

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

      if (isPlacedSeat(main))

        return resolveSeatDisplayColor(main.type, seatTypesForColor, main.typeColor);

      return "#e9ecef";

    },

    [seatGrid, seatTypesForColor]

  );



  return (

    <AdminPanelPage

      icon="grid-3x3"

      title="Sơ đồ ghế phòng"

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

            {isLocked ? "Mở khóa" : "Khóa"}

          </Button>

          <Button variant="light" className="fw-semibold text-primary" disabled={!selectedRoomId || isLocked || saving} onClick={handleSave}> {saving ? "Đang lưu…" : "Lưu sơ đồ"}

          </Button>

          <button
            type="button"
            className="admin-btn text-nowrap"
            style={{ background: "white", color: "#4f46e5" }}
            onClick={() => navigate(`${prefix}/rooms`)}
          >
            Danh sách phòng
          </button>

        </div>

      }

      className="seat-management"

    >

      <div className="seat-management-page-wrap">

      <ToastComponent />

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

        .bulk-actions-toolbar {
          box-shadow: 0 10px 30px rgba(0,0,0,0.25) !important;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 90vw;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .bulk-actions-toolbar::-webkit-scrollbar { display: none; }
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

              {seatTypeNames.map((name) => {

                const n = seatGrid.filter((s) => isPlacedSeat(s) && s.isActive && s.type === name).length;

                const fill = resolveSeatTypeColor(name, seatTypesForColor);

                return (

                  <Badge

                    key={name}

                    className="border-0"

                    style={{ backgroundColor: fill, color: contrastTextColorForHex(fill) }}

                  >

                    {n} {name}

                  </Badge>

                );

              })}

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

                    const seatBg = getSeatColor(cell, r, c);

                    return (

                      <div

                        key={idx}

                        role="button"

                        tabIndex={0}

                        draggable={canDrag}

                        className={`seat-box ${placed ? "placed" : "placeholder"} ${showActive ? "active" : ""} ${placed && !cell.isActive ? "seat-off" : ""} ${isCoupleSeatByType(cell.type) ? "type-doi" : ""} ${isDropTarget ? "drag-over" : ""} ${selectedIndices.has(idx) ? "brush-selected" : ""}`}

                        style={{

                          backgroundColor: seatBg,

                          color:

                            !placed

                              ? undefined

                              : showActive

                                ? contrastTextColorForHex(seatBg)

                                : "#fff",

                          gridColumn: isCoupleSeatByType(cell.type) ? "span 2" : undefined,

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

                <span className="text-white fw-bold me-2 ps-3 text-nowrap">{selectedIndices.size} ghế đang chọn</span>

                <div className="d-flex gap-2 pe-2 border-end border-secondary me-2">
                  {seatTypeNames.map(name => {
                    const fill = resolveSeatTypeColor(name, seatTypesForColor);
                    return (
                      <Button
                        key={name}
                        size="sm"
                        className="rounded-pill border-0 text-nowrap"
                        style={{
                          backgroundColor: fill,
                          color: contrastTextColorForHex(fill),
                        }}
                        onClick={() => handleBulkAction("SET_TYPE", name)}
                      >
                        {name}
                      </Button>
                    );
                  })}
                </div>

                <div className="d-flex gap-2">
                  <Button variant="outline-light" size="sm" className="rounded-pill text-nowrap" onClick={() => handleBulkAction("TOGGLE_ACTIVE")}>Bật/Tắt</Button>
                  <Button variant="danger" size="sm" className="rounded-pill text-nowrap" onClick={() => handleBulkAction("DELETE")}>Xóa</Button>
                  <Button variant="secondary" size="sm" className="rounded-pill text-nowrap ms-2 pe-3" onClick={() => setSelectedIndices(new Set())}>Hủy</Button>
                </div>

              </div>

            )}



            <div className="d-flex justify-content-center flex-wrap gap-3 mt-4">

              {seatTypeNames.map((name) => (

                <div key={name} className="d-flex align-items-center gap-2 small fw-bold">

                  <div

                    style={{

                      width: 14,

                      height: 14,

                      borderRadius: 4,

                      backgroundColor: resolveSeatTypeColor(name, seatTypesForColor),

                    }}

                  />

                  {name}

                </div>

              ))}

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

      </div>

    </AdminPanelPage>

  );

}

