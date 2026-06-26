import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Modal, Spinner } from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import { apiFetch } from "../../utils/apiClient";
import { SHOWTIMES, SEATS, TICKET_ORDERS, CINEMAS, SHOWTIME_SEAT_HOLDS, SEAT_TYPES, ME } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";
import { checkNoSingleSeatOrphanInRows } from "../../utils/seatLayoutRules";
import {
  isCoupleTypeName,
  resolveSeatDisplayColor,
  resolveSeatTypeColor,
  contrastTextColorForHex,
} from "../../utils/seatTypeColors";
import { isDisplayableImageSrc } from "../../utils/mediaFiles";
import { formatVnd } from "../../utils/formatters";

const HOLDER_STORAGE_KEY = "booking_seat_holder_id";
const SEAT_HOLD_DURATION_MS = 5 * 60 * 1000;

// Biến module-level để lưu seatTypes có coupleSeat
let _seatTypesData = [];

// Hàm kiểm tra ghế đôi dựa vào coupleSeat từ API
function isCoupleSeatByType(typeName) {
  if (!typeName) return false;
  const st = _seatTypesData.find((t) => t.name === typeName);
  if (st && st.coupleSeat !== undefined) {
    return st.coupleSeat === true;
  }
  return isCoupleTypeName(typeName);
}

// Grid constants - giống như SeatManagement
const ROWS = 15;
const COLS = 24;
const SEAT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Grid functions - giống như SeatManagement
const isPlacedSeat = (cell) =>
  cell && cell.type !== "Empty" && cell.type !== "OccupiedByDouble";

const rowHasAnySeat = (grid, r) => {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    if (isPlacedSeat(grid[i])) return true;
  }
  return false;
};

// Chữ hàng A,B,C…: đếm các hàng phía trên có ít nhất một ghế
const virtualRowLetterIndex = (grid, r) => {
  let above = 0;
  for (let r2 = 0; r2 < r; r2++) {
    if (rowHasAnySeat(grid, r2)) above++;
  }
  return above;
};

const rowLetterForGridRow = (grid, r) => {
  const i = virtualRowLetterIndex(grid, r);
  return SEAT_LETTERS[i] ?? "?";
};

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

const emptyCell = (r, c) => ({
  rowIdx: r,
  colIdx: c,
  type: "Empty",
  label: "",
  isActive: false,
});

// Xây dựng grid từ danh sách ghế
function buildSeatGrid(seats) {
  // Khởi tạo grid rỗng
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid.push(emptyCell(r, c));
    }
  }

  // Đặt ghế vào grid dựa trên tọa độ x, y
  for (const seat of seats) {
    const x = seat.x || 0;
    const y = seat.y || 0;
    
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      const idx = y * COLS + x;
      
      const seatType = String(seat.seatTypeName || "Chưa có loại").trim() || "Chưa có loại";

      // Đặt ghế vào grid (type = tên loại trên DB để khớp màu chú thích / API)
      grid[idx] = {
        rowIdx: y,
        colIdx: x,
        type: seatType,
        label: seat.number || "",
        isActive: seat.status !== "locked" && seat.status !== "maintenance",
        seatData: seat, // Lưu data gốc để sử dụng trong booking
      };
      
      // Nếu là ghế đôi, đánh dấu ô tiếp theo là OccupiedByDouble
      if (isCoupleSeatByType(seatType) && x + 1 < COLS) {
        grid[idx + 1] = {
          rowIdx: y,
          colIdx: x + 1,
          type: "OccupiedByDouble",
          label: "",
          isActive: false,
        };
      }
    }
  }

  return grid;
}

function getSeatColor(cell, seatTypes = []) {
  if (!isPlacedSeat(cell)) return "#e9ecef";
  if (!cell.isActive) return "#6c757d";
  const raw = cell.seatData?.seatTypeColor ?? cell.seatData?.seat_type_color;
  return resolveSeatDisplayColor(cell.type, seatTypes, raw);
}

// Function để lấy danh sách tên loại ghế từ API
const getSeatTypeOptions = (seatTypes) => {
  return Array.isArray(seatTypes) ? seatTypes.map((st) => st.name).filter(Boolean) : [];
};

function getOrCreateSeatHolderId() {
  try {
    let h = sessionStorage.getItem(HOLDER_STORAGE_KEY);
    if (!h || h.length < 8) {
      h = globalThis.crypto?.randomUUID?.() ?? `h-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(HOLDER_STORAGE_KEY, h);
    }
    return h;
  } catch {
    return `h-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function normalizeShowtime(st) {
  if (!st) return null;
  return {
    id: st.id ?? st.showtimeId,
    date: st.date,
    time: st.time,
    movieId: st.movie_id ?? st.movieId,
    movieTitle: st.movie_title ?? st.movieTitle ?? "—",
    roomId: st.room_id ?? st.roomId,
    roomName: st.room_name ?? st.roomName ?? "—",
    cinemaId: st.cinema_id ?? st.cinemaId ?? null,
    cinemaName: st.cinema_name ?? st.cinemaName ?? "",
    basePrice: st.base_price != null ? Number(st.base_price) : null,
    price: st.price != null ? Number(st.price) : 0,
    vatRate: st.vat_rate != null ? Number(st.vat_rate) : (st.vatRate != null ? Number(st.vatRate) : 10), // Default 10% VAT
    status: st.status,
    bookedSeatIds: Array.isArray(st.bookedSeatIds) ? st.bookedSeatIds : Array.isArray(st.booked_seat_ids) ? st.booked_seat_ids : [],
  };
}

function normalizeSeat(s) {
  return {
    seatId: s.seatId ?? s.seat_id,
    row: s.row != null ? String(s.row) : "",
    number: s.number != null ? String(s.number) : "",
    x: s.x != null ? Number(s.x) : 0,
    y: s.y != null ? Number(s.y) : 0,
    seatTypeName: s.seatTypeName ?? s.seat_type_name ?? "",
    seatTypeColor: s.seatTypeColor ?? s.seat_type_color ?? "",
    surcharge: Number(s.seatTypeSurcharge ?? s.seat_type_surcharge ?? 0) || 0,
    status: s.status ?? "available", // available, locked, maintenance
  };
}

function normalizeSnackProduct(o) {
  const id = o.productId ?? o.product_id;
  return {
    productId: id != null ? Number(id) : null,
    name: o.name ?? "—",
    description: typeof o.description === "string" ? o.description.trim() : "",
    price: Number(o.price ?? 0) || 0,
    categoryName: o.categoryName ?? o.category_name ?? "",
    image: typeof o.image === "string" ? o.image.trim() : "",
    isActive: o.isActive !== false,
  };
}

const Booking = () => {
  const { id: showtimeIdParam } = useParams();
  const showtimeId = Number(showtimeIdParam);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]); // Thêm state cho seat types
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [seatSelectionError, setSeatSelectionError] = useState(null);
  const [snackProducts, setSnackProducts] = useState([]);
  const [snackMenuError, setSnackMenuError] = useState(null);
  const [snackCart, setSnackCart] = useState({});
  const [peerHeldList, setPeerHeldList] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom level: 0.5 to 2

  // Voucher states
  const [userVouchers, setUserVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const holderRef = useRef(null);
  if (!holderRef.current) {
    holderRef.current = getOrCreateSeatHolderId();
  }
  const selectedSeatIdsRef = useRef([]);

  const bookedSet = useMemo(() => {
    const ids = showtime?.bookedSeatIds || [];
    return new Set(ids.map((x) => Number(x)).filter((n) => Number.isFinite(n)));
  }, [showtime]);

  const baseTicketPrice = showtime?.price ?? 0;
  const showEnded = showtime?.status === "Đã chiếu";

  const seatById = useMemo(() => {
    const m = new Map();
    for (const s of seats) {
      if (s.seatId != null) m.set(Number(s.seatId), s);
    }
    return m;
  }, [seats]);

  const seatGrid = useMemo(() => recomputeSeatLabels(buildSeatGrid(seats)), [seats]);

  // Tính toán số hàng và cột thực tế có ghế để thu gọn grid
  const gridBounds = useMemo(() => {
    let minRow = ROWS, maxRow = 0, minCol = COLS, maxCol = 0;
    for (let i = 0; i < seatGrid.length; i++) {
      const cell = seatGrid[i];
      if (isPlacedSeat(cell) || cell?.type === "OccupiedByDouble") {
        if (cell.rowIdx < minRow) minRow = cell.rowIdx;
        if (cell.rowIdx > maxRow) maxRow = cell.rowIdx;
        if (cell.colIdx < minCol) minCol = cell.colIdx;
        if (cell.colIdx > maxCol) maxCol = cell.colIdx;
      }
    }
    // Nếu không có ghế nào, dùng mặc định
    if (minRow > maxRow) minRow = 0, maxRow = ROWS - 1;
    if (minCol > maxCol) minCol = 0, maxCol = COLS - 1;
    return { minRow, maxRow, minCol, maxCol };
  }, [seatGrid]);

  const actualRows = gridBounds.maxRow - gridBounds.minRow + 1;
  const actualCols = gridBounds.maxCol - gridBounds.minCol + 1;

  // Auto-zoom to fit when room loads (prevents sparse layout for small rooms)
  useEffect(() => {
    if (actualCols <= 0 || actualRows <= 0) return;
    // Estimate available area: ~700px wide, ~480px tall for the seat grid
    const colZoom = 660 / Math.max(1, actualCols * 36 - 4);
    const rowZoom = 460 / Math.max(1, actualRows * 36 - 4);
    const autoZoom = Math.min(colZoom, rowZoom, 2);
    setZoomLevel(Math.max(0.6, parseFloat(autoZoom.toFixed(2))));
  }, [actualCols, actualRows]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Calculate dynamic sizes based on zoom
  const seatSize = Math.round(32 * zoomLevel);
  const doubleSeatSize = Math.round(68 * zoomLevel);
  const gapSize = Math.max(3, Math.round(3 * zoomLevel));
  const paddingSize = Math.round(14 * zoomLevel);
  const fontSize = Math.round(10 * zoomLevel);

  const peerHeldSet = useMemo(() => {
    const s = new Set();
    for (const x of peerHeldList) {
      const n = Number(x);
      if (Number.isFinite(n)) s.add(n);
    }
    return s;
  }, [peerHeldList]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Load seat types from API
  useEffect(() => {
    const loadSeatTypes = async () => {
      try {
        const res = await apiFetch(SEAT_TYPES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const seatTypesData = Array.isArray(list) ? list : [];
        _seatTypesData = seatTypesData.map(st => ({
          name: st.name,
          coupleSeat: st.coupleSeat ?? st.couple_seat ?? isCoupleTypeName(st.name)
        }));
        setSeatTypes(seatTypesData);
      } catch (err) {
        console.error("Failed to load seat types:", err);
        _seatTypesData = [];
        setSeatTypes([]);
      }
    };

    loadSeatTypes();
    
    // Add refresh interval to get latest seat types
    const interval = setInterval(loadSeatTypes, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    if (!Number.isFinite(showtimeId) || showtimeId <= 0) {
      setError("Mã suất chiếu không hợp lệ");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setShowtime(null);
    setSeats([]);
    setSelectedSeatIds([]);
    setSnackProducts([]);
    setSnackMenuError(null);
    setSnackCart({});
    try {
      const stRes = await apiFetch(SHOWTIMES.BY_ID(showtimeId));
      const stBody = await stRes.json().catch(() => null);
      if (!stRes.ok) {
        setError(stBody?.message || "Không tìm thấy suất chiếu");
        return;
      }
      const st = normalizeShowtime(stBody?.data);
      setShowtime(st);
      const roomId = st?.roomId;
      if (roomId == null) {
        setError("Suất chiếu chưa gắn phòng — không tải được sơ đồ ghế");
        return;
      }
      const seatRes = await apiFetch(`${SEATS.BY_ROOM(roomId)}`);
      const seatBody = await seatRes.json().catch(() => null);
      if (!seatRes.ok) {
        setError(seatBody?.message || "Không tải được danh sách ghế");
        return;
      }
      const raw = Array.isArray(seatBody?.data) ? seatBody.data : [];
      setSeats(raw.map(normalizeSeat).filter((s) => s.seatId != null));

      const cid = st?.cinemaId;
      if (cid != null) {
        try {
          const mRes = await apiFetch(CINEMAS.PRODUCT_MENU(cid));
          const mBody = await mRes.json().catch(() => null);
          if (mRes.ok && mBody?.data) {
            const onSale = Array.isArray(mBody.data.onSale) ? mBody.data.onSale : [];
            setSnackProducts(onSale.map(normalizeSnackProduct).filter((p) => p.productId != null && p.isActive));
          } else {
            setSnackMenuError(mBody?.message || "Không tải được menu bắp nước");
          }
        } catch {
          setSnackMenuError("Không tải được menu bắp nước");
        }
      }
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Ghế người khác đang giữ tạm — poll định kỳ */
  useEffect(() => {
    if (loading || !showtime || showEnded || !Number.isFinite(showtimeId)) return;
    const holderId = holderRef.current;
    let cancelled = false;
    const fetchPeer = async () => {
      try {
        const res = await apiFetch(SHOWTIME_SEAT_HOLDS.PEER(showtimeId, holderId));
        const body = await res.json().catch(() => null);
        if (cancelled || !res.ok || !Array.isArray(body?.data)) return;
        setPeerHeldList(body.data);
      } catch {
        /* ignore */
      }
    };
    fetchPeer();
    const iv = setInterval(fetchPeer, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [loading, showtime, showEnded, showtimeId]);

  /** Cập nhật danh sách ghế đang giữ tạm khi lựa chọn thay đổi. */
  useEffect(() => {
    if (!Number.isFinite(showtimeId) || showEnded) return;
    const holderId = holderRef.current;
    const handle = setTimeout(() => {
      apiFetch(SHOWTIME_SEAT_HOLDS.REFRESH, {
        method: "POST",
        body: JSON.stringify({
          showtimeId,
          holderId,
          seatIds: selectedSeatIds,
        }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(handle);
  }, [showtimeId, selectedSeatIds, showEnded]);

  /** Hết 5 phút giữ ghế của chính tab hiện tại — tự nhả ghế và bỏ chọn. */
  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;

    if (!Number.isFinite(showtimeId) || showEnded || selectedSeatIds.length === 0) {
      return undefined;
    }

    const handle = setTimeout(() => {
      const holderId = holderRef.current;
      const heldSeatIds = selectedSeatIdsRef.current;

      if (holderId && Number.isFinite(showtimeId) && heldSeatIds.length > 0) {
        apiFetch(SHOWTIME_SEAT_HOLDS.REFRESH, {
          method: "POST",
          body: JSON.stringify({ showtimeId, holderId, seatIds: [] }),
        }).catch(() => {});
      }

      setSelectedSeatIds([]);
      setQuote(null);
      setPayError("Ghế đã hết thời gian giữ 5 phút. Vui lòng chọn lại ghế.");
      setSeatSelectionError(null);
    }, SEAT_HOLD_DURATION_MS);

    return () => clearTimeout(handle);
  }, [showtimeId, selectedSeatIds, showEnded]);

  /** Rời trang / đổi suất — bỏ giữ ghế */
  useEffect(() => {
    return () => {
      const holderId = holderRef.current;
      if (!holderId || !Number.isFinite(showtimeId)) return;
      apiFetch(SHOWTIME_SEAT_HOLDS.REFRESH, {
        method: "POST",
        body: JSON.stringify({ showtimeId, holderId, seatIds: [] }),
      }).catch(() => {});
    };
  }, [showtimeId]);

  // Tính giá ghế: basePrice + surcharge (không VAT), ghế đôi x2
  const seatPrice = (seat) => {
    const basePrice = baseTicketPrice + (seat?.surcharge || 0);
    const multiplier = isCoupleSeatByType(seat?.seatTypeName) ? 2 : 1;
    return Math.round(basePrice * multiplier);
  };

  const toggleSeat = (seat) => {
    if (showEnded) return;
    const id = Number(seat.seatId);
    if (!Number.isFinite(id)) return;
    if (bookedSet.has(id)) return;
    if (peerHeldSet.has(id)) return;
    if (seat.status === "locked" || seat.status === "maintenance") return; // Không cho chọn ghế bị khóa/bảo trì

    const alreadySelected = selectedSeatIds.includes(id);
    const nextSelected = alreadySelected ? selectedSeatIds.filter((x) => x !== id) : [...selectedSeatIds, id];
    if (alreadySelected) {
      setSeatSelectionError(null);
      setPayError(null);
      setSelectedSeatIds(nextSelected);
      return;
    }
    const blocked = new Set([...bookedSet, ...peerHeldSet, ...nextSelected]);
    const check = checkNoSingleSeatOrphanInRows(seats, blocked);
    if (!check.ok) {
      setSeatSelectionError(check.message);
      return;
    }
    setSeatSelectionError(null);
    setPayError(null);
    setSelectedSeatIds(nextSelected);
  };

  const seatPriceTotal = selectedSeatIds.reduce((sum, id) => {
    const s = seatById.get(id);
    return sum + (s ? seatPrice(s) : 0);
  }, 0);

  const snackTotal = useMemo(() => {
    let t = 0;
    for (const p of snackProducts) {
      const q = snackCart[p.productId] || 0;
      if (q) t += p.price * q;
    }
    return t;
  }, [snackProducts, snackCart]);

  const selectedSnackLines = useMemo(() => (
    snackProducts
      .map((p) => {
        const quantity = Number(snackCart[p.productId] || 0);
        if (quantity <= 0) return null;
        return {
          ...p,
          quantity,
          lineTotal: p.price * quantity,
        };
      })
      .filter(Boolean)
  ), [snackProducts, snackCart]);

  // Voucher
  const selectedVoucher = useMemo(() => userVouchers.find(v => v.userVoucherId === selectedVoucherId), [userVouchers, selectedVoucherId]);

  const computedSubtotalFallback = seatPriceTotal + snackTotal;
  const voucherDiscount = quote?.voucherDiscount != null
    ? Number(quote.voucherDiscount || 0)
    : 0;
  const grandTotal = quote?.finalAmount != null
    ? Number(quote.finalAmount || 0)
    : (computedSubtotalFallback - voucherDiscount);
  const payableAmount = Math.max(0, Math.round(Number(grandTotal || 0)));
  const isFreeCheckout = payableAmount <= 0;
  const ticketSummaryTotal = quote?.ticketTotal != null
    ? Number(quote.ticketTotal || 0)
    : seatPriceTotal;
  const snackSummaryTotal = quote?.snackTotal != null
    ? Number(quote.snackTotal || 0)
    : snackTotal;
  const summarySubtotal = ticketSummaryTotal + snackSummaryTotal;

  const quoteLineBySeatId = useMemo(() => {
    const m = new Map();
    const lines = Array.isArray(quote?.ticketLines) ? quote.ticketLines : [];
    for (const l of lines) {
      const sid = Number(l.seatId);
      if (Number.isFinite(sid)) m.set(sid, l);
    }
    return m;
  }, [quote]);

  // Quote (pricing) - only when logged in
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setQuote(null);
      return;
    }
    if (!Number.isFinite(showtimeId) || showtimeId <= 0) return;
    if (showEnded) return;
    if (!selectedSeatIds.length && !Object.keys(snackCart || {}).length && !selectedVoucherId) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const snacks = Object.entries(snackCart)
          .map(([k, q]) => ({ productId: Number(k), quantity: q }))
          .filter((x) => Number.isFinite(x.productId) && x.quantity > 0);

        const res = await apiFetch(TICKET_ORDERS.QUOTE, {
          method: "POST",
          body: JSON.stringify({
            showtimeId,
            seatIds: selectedSeatIds,
            snacks: snacks.length ? snacks : undefined,
            userVoucherId: selectedVoucherId || undefined,
          }),
        });
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && body?.data) {
          setQuote(body.data);
        } else {
          setQuote(null);
        }
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [showtimeId, showEnded, selectedSeatIds, snackCart, selectedVoucherId]);

  // Load user vouchers when logged in
  useEffect(() => {
    if (!getAccessToken()) return;

    const isVoucherUsable = (row) => {
      if (row?.status !== 1) return false;
      const voucher = row.voucher || {};
      const voucherStatus = Number(voucher.status ?? 1);
      if (voucherStatus === 0 || voucherStatus === 3) return false;
      const now = new Date();
      const start = voucher.startDate ? new Date(`${String(voucher.startDate).slice(0, 10)}T00:00:00`) : null;
      const end = voucher.endDate ? new Date(`${String(voucher.endDate).slice(0, 10)}T23:59:59`) : null;
      if (start && start > now) return false;
      if (end && end < now) return false;
      return true;
    };
    
    const loadVouchers = async () => {
      setVoucherLoading(true);
      try {
        const res = await apiFetch(ME.VOUCHERS);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          // Chỉ hiện voucher chưa dùng và còn hiệu lực.
          const available = json.data.filter(isVoucherUsable);
          setUserVouchers(available);
        }
      } catch (err) {
        console.error('Failed to load vouchers:', err);
      } finally {
        setVoucherLoading(false);
      }
    };
    
    loadVouchers();
  }, []);

  const addSnack = (productId) => {
    setSnackCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  };
  const removeSnack = (productId) => {
    setSnackCart((c) => {
      const next = { ...c };
      if (!next[productId]) return c;
      next[productId] -= 1;
      if (next[productId] <= 0) delete next[productId];
      return next;
    });
  };

  const getSeatVisual = (seat, isSelected, isPeerHeld) => {
    const id = Number(seat.seatId);
    const booked = bookedSet.has(id);
    const couple = isCoupleSeatByType(seat.seatTypeName);
    
    // Ưu tiên trạng thái từ database
    if (seat.status === "locked") {
      return {
        bg: "rgba(108, 117, 125, 0.8)", // Xám đậm - bị khóa
        color: "#000", // Chữ đen
        border: "1px solid rgba(108, 117, 125, 0.9)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      };
    }
    
    if (seat.status === "maintenance") {
      return {
        bg: "rgba(220, 53, 69, 0.8)", // Đỏ đậm - đang bảo trì
        color: "#000", // Chữ đen
        border: "1px solid rgba(220, 53, 69, 0.9)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      };
    }
    
    if (booked || showEnded) {
      return {
        bg: "rgba(40, 167, 69, 0.8)", // Xanh lá - đã bán
        color: "#fff", // Chữ trắng cho rõ
        border: "1px solid rgba(40, 167, 69, 0.9)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none", // Ngăn mọi sự kiện chuột
      };
    }
    
    if (isPeerHeld && !isSelected) {
      return {
        bg: "#ff9800", // Cam đậm - đang có người chọn
        color: "#111", // Chữ tối để tương phản nền cam
        border: "2px solid #ffe082",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      };
    }
    
    if (isSelected) {
      return {
        bg: "rgba(203, 213, 225, 0.92)",
        color: "#111827",
        border: "1px solid rgba(226, 232, 240, 0.95)",
        cursor: "pointer",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      };
    }
    
    // Default available state
    return {
      bg: "rgba(13, 110, 253, 0.85)", // Xanh dương - có sẵn
      color: "#000", // Chữ đen
      border: "1px solid rgba(13, 110, 253, 1)",
      cursor: "pointer",
      width: couple ? 72 : 36,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };
  };

  const selectedSeatSummaries = selectedSeatIds
    .map((id) => {
      const seat = seatById.get(id);
      if (!seat) return null;
      const quoteLine = quoteLineBySeatId.get(Number(id));
      const originalPrice = quoteLine?.originalPrice != null ? Number(quoteLine.originalPrice) : null;
      const promotionDiscount = quoteLine?.promotionDiscount != null ? Number(quoteLine.promotionDiscount) : 0;
      const membershipDiscount = quoteLine?.membershipDiscount != null ? Number(quoteLine.membershipDiscount) : 0;
      const finalPrice = quoteLine?.finalPrice != null ? Number(quoteLine.finalPrice) : seatPrice(seat);
      const displayPrice = originalPrice != null ? originalPrice : seatPrice(seat);
      return {
        id,
        label: `${seat.row}${seat.number}`,
        typeName: seat.seatTypeName || "Ghế",
        originalPrice,
        promotionDiscount,
        membershipDiscount,
        displayPrice,
        finalPrice,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.label).localeCompare(String(b.label), "vi-VN", { numeric: true, sensitivity: "base" }));

  const selectedSeatTypeGroups = Array.from(
    selectedSeatSummaries.reduce((groups, seat) => {
      const key = seat.typeName || "Ghế";
      const current = groups.get(key) || { typeName: key, count: 0, total: 0 };
      current.count += 1;
      current.total += seat.displayPrice;
      groups.set(key, current);
      return groups;
    }, new Map()).values()
  );

  const seatOriginalTotal = selectedSeatSummaries.reduce((sum, seat) => {
    const beforeDiscount = seat.originalPrice != null
      ? seat.originalPrice
      : seat.finalPrice + seat.promotionDiscount + seat.membershipDiscount;
    return sum + beforeDiscount;
  }, 0);
  const moviePromotionTotal = selectedSeatSummaries.reduce((sum, seat) => sum + seat.promotionDiscount, 0);
  const membershipDiscountTotal = selectedSeatSummaries.reduce((sum, seat) => sum + seat.membershipDiscount, 0);
  const hasTicketPromotion = moviePromotionTotal > 0;
  const hasMembershipDiscount = membershipDiscountTotal > 0;

  const movieLink = showtime?.movieId ? `/movie/${showtime.movieId}` : "/movies";

  const handleOpenPaymentConfirm = () => {
    if (selectedSeatIds.length === 0 || showEnded) return;
    setPayError(null);
    if (!getAccessToken()) {
      navigate("/login", { state: { from: `/booking/${showtimeId}` } });
      return;
    }
    if (quoteLoading) {
      setPayError("Hệ thống đang tính lại giá, vui lòng chờ một chút.");
      return;
    }
    setShowPaymentConfirm(true);
  };

  const handleCheckoutPayOS = async () => {
    if (selectedSeatIds.length === 0 || showEnded) return;
    setPayError(null);
    if (!getAccessToken()) {
      navigate("/login", { state: { from: `/booking/${showtimeId}` } });
      return;
    }
    setShowPaymentConfirm(false);
    setPaying(true);
    const origin = window.location.origin;
    try {
      const snacks = Object.entries(snackCart)
        .map(([k, q]) => ({ productId: Number(k), quantity: q }))
        .filter((x) => Number.isFinite(x.productId) && x.quantity > 0);

      const res = await apiFetch(TICKET_ORDERS.CHECKOUT, {
        method: "POST",
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
          snacks: snacks.length ? snacks : undefined,
          clientHoldId: holderRef.current || undefined,
          returnUrl: `${origin}/payment/success`,
          cancelUrl: `${origin}/payment/cancel`,
          userVoucherId: selectedVoucherId || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) {
        navigate("/login", { state: { from: `/booking/${showtimeId}` } });
        return;
      }
      if (res.status === 403) {
        setPayError(body?.message || "Chỉ tài khoản khách hàng được thanh toán vé online. Hãy đăng xuất tài khoản nhân viên.");
        return;
      }
      if (res.status === 409) {
        setPayError(body?.message || "Ghế đang được người khác chọn hoặc đã bán — chọn ghế khác.");
        return;
      }
      if (!res.ok) {
        setPayError(body?.message || "Không tạo được link thanh toán");
        return;
      }
      if (Number(body?.data?.amountVnd ?? payableAmount) <= 0) {
        try {
          sessionStorage.removeItem("payos_pending_order_code");
          sessionStorage.removeItem("payos_pending_kind");
        } catch {
          /* ignore */
        }
        const orderId = body?.data?.orderOnlineId;
        const orderCode = body?.data?.payosOrderCode;
        const query = new URLSearchParams({ free: "1" });
        if (orderId != null) query.set("orderId", String(orderId));
        if (orderCode != null) query.set("orderCode", String(orderCode));
        navigate(`/payment/success?${query.toString()}`, { replace: true });
        return;
      }
      const checkoutUrl = body?.data?.payos?.checkoutUrl;
      if (!checkoutUrl) {
        setPayError("Máy chủ không trả về link PayOS (checkoutUrl).");
        return;
      }
      const payosOrderCode = body?.data?.payosOrderCode;
      if (payosOrderCode != null) {
        try {
          sessionStorage.setItem("payos_pending_order_code", String(payosOrderCode));
          sessionStorage.setItem("payos_pending_kind", "ticket");
        } catch {
          /* ignore */
        }
      }
      window.location.assign(checkoutUrl);
    } catch {
      setPayError("Không kết nối được máy chủ.");
    } finally {
      setPaying(false);
    }
  };

  if (!Number.isFinite(showtimeId) || showtimeId <= 0) {
    return (
      <Layout>
        <div className="container my-5 pt-4 text-center text-white">
          <p className="fw-bold">Suất chiếu không hợp lệ.</p>
          <Link to="/movies" className="btn btn-outline-light rounded-pill">
            Về danh sách phim
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-5" style={{
        background: `radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
          #0f102a`,
        minHeight: '100vh',
        padding: '40px 20px'
      }}>
        <div
          className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white bg-opacity-10"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="d-flex align-items-center flex-wrap gap-3">
            <Link
              to={movieLink}
              className="btn btn-outline-light border-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 45, height: 45 }}
            >
              <i className="fas fa-arrow-left text-white" />
            </Link>
            <div className="flex-grow-1">
              <h5 className="fw-black m-0 text-white text-uppercase tracking-tighter">{showtime?.movieTitle || "Đang tải…"}</h5>
              <div className="d-flex flex-wrap gap-3 mt-1 small">
                <span className="text-light opacity-75 fw-bold">
                  <i className="fas fa-calendar-day me-1" />
                  {showtime?.date || "—"} · {showtime?.time || "—"}
                </span>
                <span className="text-light opacity-75 fw-bold">
                  <i className="fas fa-door-open me-1" />
                  {showtime?.roomName || "—"}
                </span>
                {showtime?.status ? (
                  <span className={`fw-bold ${showEnded ? "text-secondary" : "text-warning"}`}>• {showtime.status}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 small opacity-75 mb-0">Đang tải suất chiếu &amp; sơ đồ ghế…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="alert alert-warning border-0 shadow-sm">
            {error}
            <div className="mt-2">
              <Link to={movieLink} className="btn btn-sm btn-dark">
                Quay lại
              </Link>
              <button type="button" className="btn btn-sm btn-outline-dark ms-2" onClick={loadData}>
                Thử lại
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !error && showtime ? (
          <div className="row g-4">
            <div className="col-lg-8">
              {showEnded ? (
                <div className="alert alert-secondary border-0 small mb-3">Suất này đã kết thúc — không thể chọn ghế.</div>
              ) : null}

              <div className="card p-4 border-0 shadow-lg rounded-5 mb-4" style={{ backdropFilter: "blur(10px)", background: 'rgba(20, 22, 50, 0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-center mb-4">
                  <div
                    className="mx-auto shadow-sm"
                    style={{ width: "85%", height: 12, background: "var(--secondary-gradient)", borderRadius: 100 }}
                  />
                  <small className="text-light opacity-50 fw-bold tracking-widest text-uppercase mt-2 d-block">Màn hình</small>
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-3 small text-white-50 mb-3">
                  {getSeatTypeOptions(seatTypes).map((typeName) => {
                    const seatColor = resolveSeatTypeColor(typeName, seatTypes);
                    return (
                      <span key={typeName}>
                        <span
                          className="d-inline-block rounded me-1 align-middle"
                          style={{
                            width: 14,
                            height: 14,
                            background: seatColor,
                            border: "1px solid rgba(255,255,255,0.35)",
                          }}
                        />{" "}
                        {typeName}
                      </span>
                    );
                  })}
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(40, 167, 69, 0.8)", border: "1px solid rgba(40, 167, 69, 0.9)" }} />{" "}
                    Đã bán
                  </span>
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(203, 213, 225, 0.92)", border: "1px solid rgba(226, 232, 240, 0.95)" }} />{" "}
                    Đã chọn
                  </span>
                  <span>
                    <span
                      className="d-inline-block rounded me-1 align-middle"
                      style={{ width: 14, height: 14, background: "#ff9800", border: "2px solid #ffe082" }}
                    />{" "}
                    Đang có người chọn
                  </span>
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(108, 117, 125, 0.8)", border: "1px solid rgba(108, 117, 125, 0.9)" }} />{" "}
                    Khóa/Bảo trì
                  </span>
                </div>

                {seats.length === 0 ? (
                  <p className="text-center text-white-50 small mb-0">Phòng chưa có sơ đồ ghế — vào admin để thiết lập ghế.</p>
                ) : (
                  <>
                    {/* Zoom Controls */}
                    <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                        title="Thu nhỏ"
                      >
                        <i className="fas fa-search-minus"></i>
                      </button>
                      <span className="text-white small fw-bold px-2">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 2}
                        title="Phóng to"
                      >
                        <i className="fas fa-search-plus"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleZoomReset}
                        title="Reset zoom"
                      >
                        <i className="fas fa-compress"></i>
                      </button>
                      <span className="text-white-50 small ms-3">
                        <i className="fas fa-info-circle"></i> Ctrl + Scroll để zoom
                      </span>
                    </div>

                    {/* Scrollable container for zoomed grid */}
                    <div style={{
                      overflow: 'auto',
                      maxHeight: '600px',
                      padding: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                    onWheel={handleWheel}
                  >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `${Math.round(40 * zoomLevel)}px repeat(${actualCols}, ${seatSize}px)`,
                        gridTemplateRows: `${Math.round(60 * zoomLevel)}px repeat(${actualRows}, ${seatSize}px)`,
                        gap: `${gapSize}px`,
                        padding: `${paddingSize}px`,
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        position: 'relative',
                        width: 'max-content',
                        minWidth: 'fit-content',
                        margin: '0 auto',
                        alignItems: 'center',
                        justifyItems: 'center'
                      }}>
                        <div style={{
                          gridColumn: '1 / -1',
                          height: `${Math.round(60 * zoomLevel)}px`,
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                          borderRadius: '100% 100% 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: `${Math.round(14 * zoomLevel)}px`
                        }}>
                          MÀN HÌNH
                        </div>
                        {/* Ẩn column labels */}
                        {/* <div />
                        {Array.from({ length: actualCols }).map((_, c) => (
                          <div key={`col_${c}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${labelFontSize}px`,
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: '500'
                          }}>{c + 1}</div>
                        ))} */}
                        {Array.from({ length: actualRows }).map((_, r) => {
                          const actualRow = gridBounds.minRow + r;
                          const rowLabel = rowHasAnySeat(seatGrid, actualRow) ? rowLetterForGridRow(seatGrid, actualRow) : "";
                          return (
                          <React.Fragment key={r}>
                            <div
                              style={{
                                width: `${Math.round(28 * zoomLevel)}px`,
                                height: `${seatSize}px`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.64)",
                                fontSize: `${Math.round(11 * zoomLevel)}px`,
                                fontWeight: 800,
                              }}
                            >
                              {rowLabel}
                            </div>
                            {Array.from({ length: actualCols }).map((_, c) => {
                              const actualCol = gridBounds.minCol + c;
                              const idx = actualRow * COLS + actualCol;
                              const cell = seatGrid[idx] || { type: "Empty", isActive: false, label: "" };
                              
                              // Bỏ qua ô bị chiếm bởi ghế đôi
                              if (cell.type === "OccupiedByDouble") return null;
                              const placed = isPlacedSeat(cell);
                              
                              // Kiểm tra xem có phải ghế đôi không
                              const isCouple = isCoupleSeatByType(cell.type);
                              
                              // Nếu là ghế thực tế, lấy data từ seatData
                              if (placed && cell.seatData) {
                                const seat = cell.seatData;
                                const id = Number(seat.seatId);
                                const isSelected = selectedSeatIds.includes(id);
                                const peerHeld = peerHeldSet.has(id);
                                const vis = getSeatVisual(seat, isSelected, peerHeld);
                                const booked = bookedSet.has(id);
                                const seatFill = getSeatColor(cell, seatTypes);

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    title={
                                      seat.status === "locked"
                                        ? "Ghế bị khóa - không thể đặt"
                                        : seat.status === "maintenance"
                                        ? "Ghế đang bảo trì - không thể đặt"
                                        : peerHeld && !isSelected
                                        ? "Người khác đang chọn ghế này"
                                        : `${seat.seatTypeName || "Ghế"}`
                                    }
                                    disabled={booked || showEnded || (peerHeld && !isSelected) || seat.status === "locked" || seat.status === "maintenance"}
                                    onClick={() => toggleSeat(seat)}
                                    style={{
                                      width: isCouple ? `${doubleSeatSize}px` : `${seatSize}px`,
                                      height: `${seatSize}px`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: `${fontSize}px`,
                                      fontWeight: "bold",
                                      borderRadius: `${Math.round(6 * zoomLevel)}px`,
                                      transition: "all 0.2s",
                                      backgroundColor: (booked || isSelected || peerHeld) ? vis.bg : seatFill,
                                      color: (booked || isSelected || peerHeld) ? vis.color : contrastTextColorForHex(seatFill),
                                      gridColumn: isCouple ? "span 2" : undefined,
                                      opacity: (booked || !cell.isActive) ? 0.8 : 1,
                                      border: vis.border,
                                      cursor: vis.cursor,
                                      pointerEvents: vis.pointerEvents,
                                      boxShadow: isSelected
                                        ? "none"
                                        : (peerHeld && !isSelected ? "0 0 0 2px rgba(255, 224, 130, 0.6), 0 4px 10px rgba(255, 152, 0, 0.45)" : "none")
                                    }}
                                  >
                                    {cell.label}
                                  </button>
                                );
                              }
                              
                              // Nếu là ô trống, render nhưng ẩn đi (visibility: hidden) để giữ cấu trúc grid
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    width: isCouple ? `${doubleSeatSize}px` : `${seatSize}px`,
                                    height: `${seatSize}px`,
                                    visibility: "hidden",
                                    gridColumn: isCouple ? "span 2" : undefined,
                                  }}
                                />
                              );
                            })}
                          </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                    {seatSelectionError ? (
                      <div className="alert alert-warning border-0 small mt-3 mb-0 d-flex align-items-start gap-2">
                        <i className="fas fa-exclamation-triangle mt-1" />
                        <span>{seatSelectionError}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="card p-4 border-0 shadow-lg rounded-5" style={{ backdropFilter: "blur(10px)", background: 'rgba(20, 22, 50, 0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 className="fw-black mb-2 tracking-tighter text-uppercase" style={{ color: '#fff' }}>
                  <i className="fas fa-popcorn text-warning me-3" />
                  Bắp nước kèm vé
                </h4>
                {showtime?.cinemaName ? (
                  <p className="small mb-3" style={{ color: '#fff' }}>
                    Menu rạp <span className="text-warning fw-bold">{showtime.cinemaName}</span> — thanh toán chung PayOS với vé.
                  </p>
                ) : null}
                {snackMenuError ? <div className="alert alert-warning py-2 small border-0 mb-0">{snackMenuError}</div> : null}
                {!snackMenuError && snackProducts.length === 0 && showtime?.cinemaId ? (
                  <p className="small text-center py-3 mb-0" style={{ color: '#fff' }}>Rạp chưa có món đang bán.</p>
                ) : null}
                {!snackMenuError && snackProducts.length > 0 ? (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                    {snackProducts.map((p) => {
                      const q = snackCart[p.productId] || 0;
                      const imageSrc = isDisplayableImageSrc(p.image) ? p.image : "";
                      return (
                        <div
                          key={p.productId}
                          className="d-flex align-items-center gap-3 p-2 rounded-3"
                          style={{ background: "rgba(0,0,0,0.2)" }}
                        >
                          <div
                            className="flex-shrink-0 overflow-hidden"
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 12,
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              position: "relative",
                            }}
                          >
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={p.name}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : null}
                            <div
                              style={{
                                display: imageSrc ? "none" : "flex",
                                width: "100%",
                                height: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.58)",
                                fontSize: 22,
                              }}
                            >
                              <i className="fas fa-utensils" />
                            </div>
                          </div>
                          <div className="flex-grow-1 min-width-0">
                            <div className="fw-bold small text-truncate" style={{ color: '#fff' }}>{p.name}</div>
                            <div
                              className="small"
                              title={p.description || "Chưa có mô tả"}
                              style={{
                                color: "rgba(255,255,255,0.62)",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {p.description || "Chưa có mô tả"}
                            </div>
                            <div className="text-danger fw-bold small">{formatVnd(p.price)}</div>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-light"
                              disabled={q <= 0}
                              onClick={() => removeSnack(p.productId)}
                            >
                              −
                            </button>
                            <span className="fw-bold px-1" style={{ minWidth: 22, textAlign: "center", color: '#fff' }}>
                              {q}
                            </span>
                            <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => addSnack(p.productId)}>
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-lg-4">
              <div
                className="card p-4 border-0 shadow-lg rounded-4 sticky-top"
                style={{
                  top: 100,
                  backdropFilter: "blur(20px)",
                  background: "linear-gradient(180deg, rgba(22,24,44,0.96), rgba(13,15,28,0.96))",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                  <div>
                    <div className="small text-uppercase fw-bold mb-1" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 0 }}>
                      Hóa đơn
                    </div>
                    <h4 className="fw-black m-0" style={{ color: "#fff" }}>
                      Tóm tắt đặt vé
                    </h4>
                  </div>
                  <span
                    className="badge rounded-pill px-3 py-2"
                    style={{ background: "rgba(255,193,7,0.16)", color: "#ffd166", border: "1px solid rgba(255,193,7,0.28)" }}
                  >
                    {selectedSeatIds.length} ghế
                  </span>
                </div>

                <div className="d-flex flex-column gap-3 mb-4">
                  <section className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="small fw-bold text-uppercase mb-1" style={{ color: "rgba(255,255,255,0.58)", letterSpacing: 0 }}>
                      Phim
                    </div>
                    <div className="fw-bold lh-sm" style={{ color: "#fff" }}>
                      {showtime.movieTitle}
                    </div>
                    <div className="row g-2 mt-3">
                      <div className="col-6">
                        <div className="small" style={{ color: "rgba(255,255,255,0.52)" }}>Ngày</div>
                        <div className="fw-bold small" style={{ color: "#fff" }}>{showtime.date}</div>
                      </div>
                      <div className="col-6">
                        <div className="small" style={{ color: "rgba(255,255,255,0.52)" }}>Giờ</div>
                        <div className="fw-bold small" style={{ color: "#fff" }}>{showtime.time}</div>
                      </div>
                      <div className="col-6">
                        <div className="small" style={{ color: "rgba(255,255,255,0.52)" }}>Phòng</div>
                        <div className="fw-bold small text-truncate" style={{ color: "#fff" }}>{showtime.roomName || "—"}</div>
                      </div>
                      <div className="col-6">
                        <div className="small" style={{ color: "rgba(255,255,255,0.52)" }}>Rạp</div>
                        <div className="fw-bold small text-truncate" style={{ color: "#fff" }}>{showtime.cinemaName || "—"}</div>
                      </div>
                    </div>
                  </section>

                  <section className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                      <div className="fw-bold" style={{ color: "#fff" }}>
                        Ghế đã chọn
                      </div>
                      <span className="small fw-bold" style={{ color: selectedSeatIds.length ? "#9fe6b8" : "rgba(255,255,255,0.5)" }}>
                        {selectedSeatIds.length ? `${selectedSeatIds.length} vé` : "Chưa chọn"}
                      </span>
                    </div>

                    {selectedSeatSummaries.length ? (
                      <div>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedSeatSummaries.map((seat) => (
                            <span
                              key={seat.id}
                              className="badge rounded-pill px-3 py-2"
                              title={`${seat.typeName} - ${formatVnd(seat.displayPrice)}`}
                              style={{
                                background: "rgba(13,110,253,0.16)",
                                color: "#d8e9ff",
                                border: "1px solid rgba(13,110,253,0.22)",
                              }}
                            >
                              {seat.label}
                            </span>
                          ))}
                        </div>
                        <div className="d-flex flex-column gap-1 mt-3">
                          {selectedSeatTypeGroups.map((group) => (
                            <div key={group.typeName} className="d-flex justify-content-between small">
                              <span style={{ color: "rgba(255,255,255,0.72)" }}>
                                {group.typeName} x{group.count}
                              </span>
                              <span className="fw-bold" style={{ color: "#fff" }}>
                                {formatVnd(group.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="small rounded-3 p-3 text-center" style={{ color: "rgba(255,255,255,0.58)", background: "rgba(0,0,0,0.22)" }}>
                        Chọn ghế trên sơ đồ để xem giá vé.
                      </div>
                    )}

                    {selectedSeatSummaries.length ? (
                      <div className="mt-3 pt-3 border-top border-white border-opacity-10">
                        <div className="d-flex justify-content-between small mb-2" style={{ color: "rgba(255,255,255,0.68)" }}>
                          <span>Giá ghế</span>
                          <span className="fw-bold">{formatVnd(seatOriginalTotal || ticketSummaryTotal)}</span>
                        </div>
                        {hasTicketPromotion ? (
                          <div className="d-flex justify-content-between small mb-2" style={{ color: "#8ee6a8" }}>
                            <span>Khuyến mãi phim</span>
                            <span className="fw-bold">-{formatVnd(moviePromotionTotal)}</span>
                          </div>
                        ) : null}
                        {hasMembershipDiscount ? (
                          <div className="d-flex justify-content-between small mb-2" style={{ color: "#8ee6a8" }}>
                            <span>{quote?.rankName || "Ưu đãi thành viên"}</span>
                            <span className="fw-bold">-{formatVnd(membershipDiscountTotal)}</span>
                          </div>
                        ) : null}
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-white border-opacity-10">
                          <span className="small fw-bold" style={{ color: "#fff" }}>Tổng ghế</span>
                          <span className="fw-black" style={{ color: "#fff" }}>{formatVnd(ticketSummaryTotal)}</span>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {selectedSnackLines.length ? (
                    <section className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="fw-bold" style={{ color: "#fff" }}>Bắp nước</div>
                        <div className="fw-bold small" style={{ color: "#fff" }}>{formatVnd(snackSummaryTotal)}</div>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {selectedSnackLines.map((item) => (
                          <div key={item.productId} className="d-flex justify-content-between gap-2 small">
                            <span className="text-truncate" style={{ color: "rgba(255,255,255,0.78)" }}>
                              {item.name} x{item.quantity}
                            </span>
                            <span className="fw-bold flex-shrink-0" style={{ color: "#fff" }}>
                              {formatVnd(item.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <div className="fw-bold" style={{ color: "#fff" }}>
                        <i className="fas fa-ticket-alt me-2 text-success" /> Voucher
                      </div>
                      {selectedVoucher && voucherDiscount > 0 ? (
                        <span className="small fw-bold" style={{ color: "#9fe6b8" }}>
                          -{formatVnd(voucherDiscount)}
                        </span>
                      ) : null}
                    </div>
                    {getAccessToken() ? (
                      voucherLoading ? (
                        <div className="small" style={{ color: "rgba(255,255,255,0.55)" }}>Đang tải voucher...</div>
                      ) : userVouchers.length === 0 ? (
                        <div className="small" style={{ color: "rgba(255,255,255,0.55)" }}>Bạn chưa có voucher khả dụng</div>
                      ) : (
                        <select
                          className="form-select form-select-sm"
                          value={selectedVoucherId || ""}
                          onChange={(e) => setSelectedVoucherId(e.target.value ? Number(e.target.value) : null)}
                          style={{ fontSize: "0.85rem" }}
                        >
                          <option value="">Không dùng voucher</option>
                          {userVouchers.map((v) => (
                            <option key={v.userVoucherId} value={v.userVoucherId}>
                              {v.voucher?.code || "Voucher"} - {String(v.voucher?.discountType || "PERCENT").toUpperCase() !== "FIXED"
                                ? `Giảm ${v.voucher?.value}%`
                                : `Giảm ${formatVnd(v.voucher?.value)}`}
                              {v.voucher?.minOrderValue > 0 && `, đơn từ ${formatVnd(v.voucher.minOrderValue)}`}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="small">
                        <Link to="/login" state={{ from: `/booking/${showtimeId}` }} style={{ color: "#ffd166" }}>
                          Đăng nhập để dùng voucher
                        </Link>
                      </div>
                    )}
                    {selectedVoucher && voucherDiscount === 0 ? (
                      <div className="small mt-2" style={{ color: "#ffd166" }}>
                        Voucher cần đơn từ {formatVnd(selectedVoucher.voucher?.minOrderValue)}
                      </div>
                    ) : null}
                  </section>

                  <section className="p-3 rounded-4" style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="d-flex justify-content-between small mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <span>Tạm tính sau giảm ghế</span>
                      <span className="fw-bold">{formatVnd(summarySubtotal)}</span>
                    </div>
                    {voucherDiscount > 0 ? (
                      <div className="d-flex justify-content-between small mb-2" style={{ color: "#8ee6a8" }}>
                        <span>Giảm voucher</span>
                        <span className="fw-bold">-{formatVnd(voucherDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="d-flex justify-content-between align-items-end gap-3 pt-3 border-top border-white border-opacity-10">
                      <span className="small fw-bold text-uppercase" style={{ color: "rgba(255,255,255,0.72)", letterSpacing: 0 }}>
                        Cần thanh toán
                      </span>
                      <h3 className="fw-black m-0 text-end" style={{ color: "#ff4d6d" }}>
                        {quoteLoading ? "Đang tính..." : formatVnd(grandTotal)}
                      </h3>
                    </div>
                  </section>
                </div>

                {payError ? <div className="alert alert-warning small py-2 mb-3 border-0">{payError}</div> : null}
                <button
                  type="button"
                  disabled={selectedSeatIds.length === 0 || showEnded || paying || quoteLoading}
                  className={`btn btn-gradient w-100 rounded-pill py-3 fw-bold shadow-lg ${selectedSeatIds.length === 0 || showEnded ? "disabled opacity-50" : ""}`}
                  onClick={handleOpenPaymentConfirm}
                >
                  {paying ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {isFreeCheckout ? "Đang hoàn tất..." : "Đang tạo link..."}
                    </>
                  ) : quoteLoading ? (
                    "Đang tính lại giá..."
                  ) : showEnded ? (
                    "Suất chiếu đã kết thúc"
                  ) : selectedSeatIds.length === 0 ? (
                    "Chọn ghế để tiếp tục"
                  ) : isFreeCheckout ? (
                    <>
                      Xác nhận đặt vé 0đ <i className="fas fa-check-circle ms-2" />
                    </>
                  ) : (
                    <>
                      Thanh toán PayOS <i className="fas fa-qrcode ms-2" />
                    </>
                  )}
                </button>
                <p className="small text-white-50 text-center mt-2 mb-0">
                  Vé và bắp nước được thanh toán chung trong một giao dịch.
                </p>

                <Modal
                  show={showPaymentConfirm}
                  onHide={() => !paying && setShowPaymentConfirm(false)}
                  centered
                  contentClassName="border-0 rounded-4 overflow-hidden"
                >
                  <Modal.Header closeButton style={{ background: "#12133a", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <Modal.Title className="fw-bold">
                      Xác nhận đặt vé
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body style={{ background: "#12133a", color: "rgba(255,255,255,0.82)" }}>
                    <div className="d-flex flex-column gap-3">
                      <div className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="small text-white-50 mb-1">Phim</div>
                        <div className="fw-bold text-white">{showtime?.movieTitle || "Suất chiếu đã chọn"}</div>
                        <div className="small mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>
                          {showtime?.cinemaName ? `${showtime.cinemaName} • ` : ""}
                          {showtime?.roomName ? `${showtime.roomName} • ` : ""}
                          {showtime?.startTime ? new Date(showtime.startTime).toLocaleString("vi-VN") : ""}
                        </div>
                      </div>

                      <div className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="d-flex justify-content-between gap-3 small mb-2">
                          <span>Ghế</span>
                          <strong className="text-white">{selectedSeatSummaries.map((s) => s.label).join(", ")}</strong>
                        </div>
                        <div className="d-flex justify-content-between gap-3 small mb-2">
                          <span>Tổng vé + bắp nước</span>
                          <strong className="text-white">{formatVnd(summarySubtotal)}</strong>
                        </div>
                        {selectedVoucher ? (
                          <div className="d-flex justify-content-between gap-3 small mb-2" style={{ color: "#8ee6a8" }}>
                            <span>Voucher {selectedVoucher.voucher?.code ? `(${selectedVoucher.voucher.code})` : ""}</span>
                            <strong>-{formatVnd(voucherDiscount)}</strong>
                          </div>
                        ) : null}
                        <div className="d-flex justify-content-between align-items-end gap-3 pt-3 border-top border-white border-opacity-10">
                          <span className="fw-bold text-white">Cần thanh toán</span>
                          <h4 className="m-0 fw-black" style={{ color: isFreeCheckout ? "#8ee6a8" : "#ff4d6d" }}>
                            {formatVnd(payableAmount)}
                          </h4>
                        </div>
                      </div>

                      {isFreeCheckout ? (
                        <div className="small rounded-3 p-3" style={{ background: "rgba(142,230,168,0.1)", color: "#9fe6b8", border: "1px solid rgba(142,230,168,0.22)" }}>
                          Tổng tiền còn 0đ nên hệ thống sẽ hoàn tất đặt vé ngay, không chuyển sang PayOS.
                        </div>
                      ) : (
                        <div className="small rounded-3 p-3" style={{ background: "rgba(255,209,102,0.1)", color: "#ffd166", border: "1px solid rgba(255,209,102,0.22)" }}>
                          Sau khi xác nhận, bạn sẽ được chuyển sang PayOS để thanh toán.
                        </div>
                      )}
                    </div>
                  </Modal.Body>
                  <Modal.Footer style={{ background: "#12133a", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <Button variant="link" className="text-white-50 text-decoration-none fw-bold" disabled={paying} onClick={() => setShowPaymentConfirm(false)}>
                      Kiểm tra lại
                    </Button>
                    <Button className="btn-gradient rounded-pill px-4 fw-bold border-0" disabled={paying} onClick={handleCheckoutPayOS}>
                      {paying ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Đang xử lý...
                        </>
                      ) : isFreeCheckout ? (
                        "Hoàn tất đặt vé"
                      ) : (
                        "Xác nhận thanh toán"
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default Booking;
