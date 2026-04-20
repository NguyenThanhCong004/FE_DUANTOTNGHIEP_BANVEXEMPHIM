import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
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

const HOLDER_STORAGE_KEY = "booking_seat_holder_id";

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

const emptyCell = (r, c) => ({
  rowIdx: r,
  colIdx: c,
  type: "Empty",
  label: "",
  isActive: false,
});

const isEmptyCell = (cell) => cell?.type === "Empty";

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
      
      const seatType = String(seat.seatTypeName || "Thường").trim() || "Thường";

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
  if (!seatTypes || seatTypes.length === 0) {
    return ["Thường", "VIP", "Đôi"];
  }
  return seatTypes.map((st) => st.name).filter(Boolean);
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

function buildSeatRows(seats) {
  const byRow = new Map();
  for (const s of seats) {
    const r = s.row || "?";
    if (!byRow.has(r)) byRow.set(r, []);
    byRow.get(r).push(s);
  }
  const rowKeys = [...byRow.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return rowKeys.map((row) => ({
    row,
    seats: byRow.get(row).sort((a, b) => (a.x || 0) - (b.x || 0) || a.number.localeCompare(b.number, undefined, { numeric: true })),
  }));
}

function normalizeSnackProduct(o) {
  const id = o.productId ?? o.product_id;
  return {
    productId: id != null ? Number(id) : null,
    name: o.name ?? "—",
    price: Number(o.price ?? 0) || 0,
    categoryName: o.categoryName ?? o.category_name ?? "",
    image: typeof o.image === "string" ? o.image : "",
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

  const bookedSet = useMemo(() => {
    const ids = showtime?.bookedSeatIds || [];
    return new Set(ids.map((x) => Number(x)).filter((n) => Number.isFinite(n)));
  }, [showtime]);

  const baseTicketPrice = showtime?.price ?? 0;
  const vatRate = showtime?.vatRate ?? 10; // Default 10% VAT
  const showEnded = showtime?.status === "Đã chiếu";

  const seatById = useMemo(() => {
    const m = new Map();
    for (const s of seats) {
      if (s.seatId != null) m.set(Number(s.seatId), s);
    }
    return m;
  }, [seats]);

  const seatRows = useMemo(() => buildSeatRows(seats), [seats]);
  
  const seatGrid = useMemo(() => buildSeatGrid(seats), [seats, seatTypes]);

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
  const gapSize = Math.round(4 * zoomLevel);
  const paddingSize = Math.round(20 * zoomLevel);
  const fontSize = Math.round(10 * zoomLevel);
  const labelFontSize = Math.round(11 * zoomLevel);

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
        console.log("Loading seat types from API...");
        const res = await apiFetch(SEAT_TYPES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const seatTypesData = Array.isArray(list) ? list : [];
        console.log("Seat types loaded:", seatTypesData);
        if (seatTypesData.length > 0) {
          // Lưu vào biến module-level với coupleSeat
          _seatTypesData = seatTypesData.map(st => ({
            name: st.name,
            coupleSeat: st.coupleSeat ?? st.couple_seat ?? isCoupleTypeName(st.name)
          }));
          console.log("_seatTypesData loaded:", _seatTypesData);
          setSeatTypes(seatTypesData);
        } else {
          console.log("No data in API response, using fallback");
          setSeatTypes([
            { id: 1, name: "Thường", price: 0, color: "#007bff" },
            { id: 2, name: "VIP", price: 0, color: "#ffc107" },
            { id: 3, name: "Ghế đôi Sweetbox", price: 0, color: "#dc3545" }
          ]);
        }
      } catch (err) {
        console.error("Failed to load seat types:", err);
        setSeatTypes([
          { id: 1, name: "Thường", price: 0, color: "#007bff" },
          { id: 2, name: "VIP", price: 0, color: "#ffc107" },
          { id: 3, name: "Ghế đôi Sweetbox", price: 0, color: "#dc3545" }
        ]);
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
            setSnackProducts(onSale.map(normalizeSnackProduct).filter((p) => p.productId != null));
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

  /** Gia hạn giữ ghế (~45s) khi đang chọn */
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

    const nextSelected = selectedSeatIds.includes(id) ? selectedSeatIds.filter((x) => x !== id) : [...selectedSeatIds, id];
    const blocked = new Set([...bookedSet, ...peerHeldSet, ...nextSelected]);
    const check = checkNoSingleSeatOrphanInRows(seats, blocked);
    if (!check.ok) {
      setPayError(check.message);
      return;
    }
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

  // Voucher
  const selectedVoucher = useMemo(() => userVouchers.find(v => v.userVoucherId === selectedVoucherId), [userVouchers, selectedVoucherId]);

  const computedSubtotalFallback = seatPriceTotal + snackTotal;
  const voucherDiscount = quote?.voucherDiscount != null
    ? Number(quote.voucherDiscount || 0)
    : 0;
  const grandTotal = quote?.finalAmount != null
    ? Number(quote.finalAmount || 0)
    : (computedSubtotalFallback - voucherDiscount);

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
    
    const loadVouchers = async () => {
      setVoucherLoading(true);
      try {
        const res = await apiFetch(ME.VOUCHERS);
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          // Filter only unused vouchers (status === 1)
          const available = json.data.filter(v => v.status === 1);
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
        color: "#000", // Chữ đen
        border: "1px solid rgba(40, 167, 69, 0.9)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
        bg: "#7b1fa2",
        color: "#fff",
        border: "2px solid rgba(233, 30, 140, 0.95)",
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

  const selectedLabels = selectedSeatIds.map((id) => {
    const s = seatById.get(id);
    return s ? `${s.row}${s.number}` : id;
  });

  const movieLink = showtime?.movieId ? `/movie/${showtime.movieId}` : "/movies";

  const handleCheckoutPayOS = async () => {
    if (selectedSeatIds.length === 0 || showEnded) return;
    setPayError(null);
    if (!getAccessToken()) {
      navigate("/login", { state: { from: `/booking/${showtimeId}` } });
      return;
    }
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
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                    onWheel={handleWheel}
                  >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `${Math.round(40 * zoomLevel)}px repeat(${COLS}, ${seatSize}px)`,
                        gap: `${gapSize}px`,
                        padding: `${paddingSize}px`,
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        position: 'relative',
                        minWidth: 'fit-content'
                      }}>
                        <div style={{
                          gridColumn: '1 / -1',
                          height: `${Math.round(60 * zoomLevel)}px`,
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                          borderRadius: '100% 100% 0 0',
                          marginBottom: `${gapSize * 5}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: `${Math.round(14 * zoomLevel)}px`
                        }}>
                          MÀN HÌNH
                        </div>
                        <div />
                        {Array.from({ length: COLS }).map((_, c) => (
                          <div key={`col_${c}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${labelFontSize}px`,
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: '500'
                          }}>{c + 1}</div>
                        ))}
                        {Array.from({ length: ROWS }).map((_, r) => (
                          <React.Fragment key={r}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: `${labelFontSize}px`,
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontWeight: '500'
                            }}>{r + 1}</div>
                            {Array.from({ length: COLS }).map((_, c) => {
                              const idx = r * COLS + c;
                              const cell = seatGrid[idx] || { type: "Empty", isActive: false, label: "" };
                              
                              // Bỏ qua ô bị chiếm bởi ghế đôi
                              if (cell.type === "OccupiedByDouble") return null;
                              const placed = isPlacedSeat(cell);
                              const showActive = placed && cell.isActive;
                              
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
                                      backgroundColor: isSelected ? vis.bg : seatFill,
                                      color: placed ? (isSelected ? vis.color : contrastTextColorForHex(seatFill)) : "transparent",
                                      gridColumn: isCouple ? "span 2" : undefined,
                                      opacity: placed && !cell.isActive ? 0.85 : 1,
                                      border: vis.border,
                                      cursor: vis.cursor,
                                      transform: isSelected ? `scale(${1.15})` : "none",
                                      boxShadow: isSelected
                                        ? "0 6px 20px rgba(233, 30, 140, 0.55)"
                                        : (peerHeld && !isSelected ? "0 0 0 2px rgba(255, 224, 130, 0.6), 0 4px 10px rgba(255, 152, 0, 0.45)" : "none")
                                    }}
                                  >
                                    {cell.label}
                                  </button>
                                );
                              }
                              
                              // Nếu là placeholder (đường đi)
                              return (
                                <div
                                  key={idx}
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
                                    border: "1px dashed rgba(255,255,255,0.2)",
                                    background: "transparent",
                                    cursor: "default",
                                    color: "transparent",
                                    gridColumn: isCouple ? "span 2" : undefined,
                                  }}
                                >
                                  {placed ? cell.label : ""}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
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
                      return (
                        <div
                          key={p.productId}
                          className="d-flex align-items-center gap-2 p-2 rounded-3"
                          style={{ background: "rgba(0,0,0,0.2)" }}
                        >
                          <div className="flex-grow-1 min-width-0">
                            <div className="fw-bold small text-truncate" style={{ color: '#fff' }}>{p.name}</div>
                            <div className="text-danger fw-bold small">{p.price.toLocaleString("vi-VN")} đ</div>
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
                className="card p-4 border-0 shadow-lg rounded-5 sticky-top"
                style={{ top: 100, backdropFilter: "blur(20px)", background: 'rgba(20, 22, 50, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <h4 className="fw-black mb-4 text-uppercase tracking-tighter border-bottom border-white border-opacity-10 pb-3" style={{ color: '#fff' }}>
                  Hóa đơn
                </h4>

                <div className="p-3 rounded-4 mb-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold" style={{ color: '#fff' }}>PHIM</span>
                    <span className="fw-bold text-end small" style={{ color: '#fff' }}>{showtime.movieTitle}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="small fw-bold" style={{ color: '#fff' }}>SUẤT</span>
                    <span className="text-end" style={{ color: '#fff' }}>
                      {showtime.date} {showtime.time}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 border-top border-white border-opacity-5 pt-2">
                    <span className="small fw-bold" style={{ color: '#fff' }}>GHẾ ({selectedSeatIds.length})</span>
                    <div className="text-end">
                      <div className="fw-bold small" style={{ color: '#fff' }}>{selectedLabels.length ? selectedLabels.join(", ") : "—"}</div>
                    </div>
                  </div>
                  {selectedSeatIds.map((id) => {
                    const s = seatById.get(id);
                    if (!s) return null;
                    const ql = quoteLineBySeatId.get(Number(id));
                    const originalPrice = ql?.originalPrice != null ? Number(ql.originalPrice) : null;
                    const promoDiscount = ql?.promotionDiscount != null ? Number(ql.promotionDiscount) : 0;
                    const memberDiscount = ql?.membershipDiscount != null ? Number(ql.membershipDiscount) : 0;
                    const finalSeatPrice = ql?.finalPrice != null ? Number(ql.finalPrice) : seatPrice(s);
                    return (
                      <div key={id} className="small mb-2">
                        <div className="d-flex justify-content-between">
                          <span style={{ color: '#fff' }}>
                            {s.row}{s.number} ({s.seatTypeName || "Ghế"})
                          </span>
                          <span className="fw-bold" style={{ color: '#fff' }}>
                            {finalSeatPrice.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        {originalPrice != null && originalPrice > finalSeatPrice ? (
                          <div className="d-flex justify-content-between" style={{ fontSize: 12 }}>
                            <span style={{ color: "rgba(255,255,255,0.55)" }}>Giá gốc</span>
                            <span style={{ color: "rgba(255,255,255,0.6)", textDecoration: "line-through" }}>
                              {originalPrice.toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                        ) : null}
                        {promoDiscount > 0 ? (
                          <div className="d-flex justify-content-between text-success" style={{ fontSize: 12 }}>
                            <span>Giảm khuyến mãi phim</span>
                            <span>-{promoDiscount.toLocaleString("vi-VN")} đ</span>
                          </div>
                        ) : null}
                        {memberDiscount > 0 ? (
                          <div className="d-flex justify-content-between text-success" style={{ fontSize: 12 }}>
                            <span>Giảm hạng thành viên</span>
                            <span>-{memberDiscount.toLocaleString("vi-VN")} đ</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {quote?.membershipDiscountPercent > 0 ? (
                    <div className="small text-success mt-2">
                      Giảm hạng thành viên ({quote.rankName || "Hội viên"}): -{Number(quote.membershipDiscountPercent || 0)}%
                    </div>
                  ) : null}
                  {quote?.ticketLines?.some(l => Number(l.promotionDiscount || 0) > 0) ? (
                    <div className="small text-success">
                      Có áp dụng khuyến mãi phim
                    </div>
                  ) : null}
                  {snackTotal > 0 ? (
                    <div className="d-flex justify-content-between small mb-1 mt-2 pt-2 border-top border-white border-opacity-10">
                      <span className="fw-bold" style={{ color: '#fff' }}>BẮP NƯỚC</span>
                      <span className="fw-bold" style={{ color: '#fff' }}>{snackTotal.toLocaleString("vi-VN")} đ</span>
                    </div>
                  ) : null}

                  {/* Voucher Selection */}
                  <div className="mt-3 pt-2 border-top border-white border-opacity-10">
                    <div className="small fw-bold mb-2" style={{ color: '#fff' }}>
                      <i className="fas fa-ticket-alt me-1 text-success" /> MÃ GIẢM GIÁ
                    </div>
                    {getAccessToken() ? (
                      voucherLoading ? (
                        <div className="small text-muted">Đang tải voucher...</div>
                      ) : userVouchers.length === 0 ? (
                        <div className="small text-muted">Bạn chưa có voucher nào</div>
                      ) : (
                        <select
                          className="form-select form-select-sm mb-2"
                          value={selectedVoucherId || ""}
                          onChange={(e) => setSelectedVoucherId(e.target.value ? Number(e.target.value) : null)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="">-- Chọn voucher --</option>
                          {userVouchers.map((v) => (
                            <option key={v.userVoucherId} value={v.userVoucherId}>
                              {v.voucher?.code} — {v.voucher?.discountType === 'PERCENT' || v.voucher?.discountType === '%' 
                                ? `Giảm ${v.voucher?.value}%` 
                                : `Giảm ${v.voucher?.value?.toLocaleString('vi-VN')}đ`}
                              {v.voucher?.minOrderValue > 0 && ` (Đơn tối thiểu ${v.voucher.minOrderValue.toLocaleString('vi-VN')}đ)`}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="small text-muted">
                        <Link to="/login" state={{ from: `/booking/${showtimeId}` }} style={{ color: '#fff' }}>
                          Đăng nhập để sử dụng voucher
                        </Link>
                      </div>
                    )}
                    {selectedVoucher && voucherDiscount > 0 && (
                      <div className="d-flex justify-content-between small mb-1 text-success">
                        <span>Giảm giá ({selectedVoucher.voucher?.code})</span>
                        <span className="fw-bold">-{Number(voucherDiscount).toLocaleString("vi-VN")} đ</span>
                      </div>
                    )}
                    {selectedVoucher && voucherDiscount === 0 && (
                      <div className="small text-warning">
                        Đơn hàng chưa đạt giá trị tối thiểu {selectedVoucher.voucher?.minOrderValue?.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3 border-top border-white border-opacity-10 pt-3">
                    <span className="small fw-bold" style={{ color: '#fff' }}>TỔNG THANH TOÁN</span>
                    <h3 className="text-danger fw-black m-0">
                      {quoteLoading ? "…" : `${Number(grandTotal || 0).toLocaleString("vi-VN")} đ`}
                    </h3>
                  </div>
                </div>

                {payError ? <div className="alert alert-warning small py-2 mb-3 border-0">{payError}</div> : null}
                <button
                  type="button"
                  disabled={selectedSeatIds.length === 0 || showEnded || paying}
                  className={`btn btn-gradient w-100 rounded-pill py-3 fw-bold shadow-lg ${selectedSeatIds.length === 0 || showEnded ? "disabled opacity-50" : ""}`}
                  onClick={handleCheckoutPayOS}
                >
                  {paying ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      ĐANG TẠO LINK…
                    </>
                  ) : (
                    <>
                      THANH TOÁN PAYOS <i className="fas fa-magic ms-2" />
                    </>
                  )}
                </button>
                <p className="small text-white-50 text-center mt-2 mb-0">
                  Đăng nhập khách hàng. Vé + bắp nước (nếu có) cùng một giao dịch PayOS; webhook kích hoạt vé &amp; đơn đồ ăn.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default Booking;
