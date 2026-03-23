import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import Layout from "../../components/layout/Layout";
import { apiFetch } from "../../utils/apiClient";
import { SHOWTIMES, SEATS, TICKET_ORDERS, CINEMAS, SHOWTIME_SEAT_HOLDS } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";
import { checkNoSingleSeatOrphanInRows } from "../../utils/seatLayoutRules";

const HOLDER_STORAGE_KEY = "booking_seat_holder_id";

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
    surcharge: Number(s.seatTypeSurcharge ?? s.seat_type_surcharge ?? 0) || 0,
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

function isCoupleType(name) {
  const n = (name || "").toLowerCase();
  return n.includes("đôi") || n.includes("sweet") || n.includes("couple");
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
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [snackProducts, setSnackProducts] = useState([]);
  const [snackMenuError, setSnackMenuError] = useState(null);
  const [snackCart, setSnackCart] = useState({});
  const [peerHeldList, setPeerHeldList] = useState([]);

  const holderRef = useRef(null);
  if (!holderRef.current) {
    holderRef.current = getOrCreateSeatHolderId();
  }

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

  const seatRows = useMemo(() => buildSeatRows(seats), [seats]);

  const peerHeldSet = useMemo(() => {
    const s = new Set();
    for (const x of peerHeldList) {
      const n = Number(x);
      if (Number.isFinite(n)) s.add(n);
    }
    return s;
  }, [peerHeldList]);

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

  const seatPrice = (seat) => baseTicketPrice + (seat?.surcharge || 0);

  const toggleSeat = (seat) => {
    if (showEnded) return;
    const id = Number(seat.seatId);
    if (!Number.isFinite(id)) return;
    if (bookedSet.has(id)) return;
    if (peerHeldSet.has(id)) return;

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

  const grandTotal = seatPriceTotal + snackTotal;

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
    const couple = isCoupleType(seat.seatTypeName);
    if (isPeerHeld && !isSelected) {
      return {
        bg: "rgba(13, 110, 253, 0.22)",
        color: "rgba(200, 220, 255, 0.95)",
        border: "1px solid rgba(100, 160, 255, 0.5)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
      };
    }
    if (booked || showEnded) {
      return {
        bg: "rgba(108, 117, 125, 0.35)",
        color: "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "not-allowed",
        width: couple ? 72 : 36,
      };
    }
    if (isSelected) {
      return {
        bg: "var(--primary-gradient)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.2)",
        cursor: "pointer",
        width: couple ? 72 : 36,
      };
    }
    if (couple) {
      return {
        bg: "rgba(220, 53, 69, 0.12)",
        color: "#f8a0ad",
        border: "1px solid rgba(220, 53, 69, 0.35)",
        cursor: "pointer",
        width: 72,
      };
    }
    const isVip = (seat.seatTypeName || "").toLowerCase().includes("vip");
    if (isVip) {
      return {
        bg: "rgba(255, 193, 7, 0.1)",
        color: "#ffc107",
        border: "1px solid rgba(255, 193, 7, 0.35)",
        cursor: "pointer",
        width: 36,
      };
    }
    return {
      bg: "rgba(255, 255, 255, 0.06)",
      color: "rgba(255,255,255,0.65)",
      border: "1px solid rgba(255,255,255,0.12)",
      cursor: "pointer",
      width: 36,
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
      <div className="container my-5 pt-4">
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
            <div className="ms-auto text-end d-none d-md-block">
              <small className="text-white-50 d-block">Giá vé (ước tính)</small>
              <span className="text-danger fw-black">{baseTicketPrice.toLocaleString("vi-VN")} đ + phụ thu loại ghế</span>
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

              <div className="card p-4 border-0 shadow-lg bg-white bg-opacity-10 rounded-5 mb-4" style={{ backdropFilter: "blur(10px)" }}>
                <div className="text-center mb-4">
                  <div
                    className="mx-auto shadow-sm"
                    style={{ width: "85%", height: 12, background: "var(--secondary-gradient)", borderRadius: 100 }}
                  />
                  <small className="text-light opacity-50 fw-bold tracking-widest text-uppercase mt-2 d-block">Màn hình</small>
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-3 small text-white-50 mb-3">
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />{" "}
                    Thường
                  </span>
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(255,193,7,0.15)" }} />{" "}
                    VIP
                  </span>
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 22, height: 14, background: "rgba(220,53,69,0.15)" }} />{" "}
                    Đôi
                  </span>
                  <span>
                    <span className="d-inline-block rounded me-1 align-middle" style={{ width: 14, height: 14, background: "rgba(108,117,125,0.4)" }} />{" "}
                    Đã bán
                  </span>
                  <span>
                    <span
                      className="d-inline-block rounded me-1 align-middle"
                      style={{ width: 14, height: 14, background: "rgba(13,110,253,0.35)", border: "1px solid rgba(100,160,255,0.5)" }}
                    />{" "}
                    Đang có người chọn
                  </span>
                </div>

                {seats.length === 0 ? (
                  <p className="text-center text-white-50 small mb-0">Phòng chưa có sơ đồ ghế — vào admin để thiết lập ghế.</p>
                ) : (
                  <div className="seat-grid overflow-auto py-3 text-center">
                    <div style={{ minWidth: 520 }}>
                      {seatRows.map(({ row, seats: rowSeats }) => (
                        <div key={row} className="d-flex align-items-center justify-content-center mb-2">
                          <div className="fw-bold text-light opacity-50 me-2" style={{ width: 22 }}>
                            {row}
                          </div>
                          <div className="d-flex gap-2 flex-wrap justify-content-center">
                            {rowSeats.map((seat) => {
                              const id = Number(seat.seatId);
                              const isSelected = selectedSeatIds.includes(id);
                              const peerHeld = peerHeldSet.has(id);
                              const vis = getSeatVisual(seat, isSelected, peerHeld);
                              const booked = bookedSet.has(id);
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  title={
                                    peerHeld && !isSelected
                                      ? "Người khác đang chọn ghế này"
                                      : `${seat.seatTypeName || "Ghế"} — ${seatPrice(seat).toLocaleString("vi-VN")} đ`
                                  }
                                  disabled={booked || showEnded || (peerHeld && !isSelected)}
                                  onClick={() => toggleSeat(seat)}
                                  className="border-0 rounded-3 d-flex align-items-center justify-content-center fw-bold transition-all"
                                  style={{
                                    width: vis.width,
                                    minWidth: vis.width,
                                    height: 36,
                                    background: vis.bg,
                                    color: vis.color,
                                    border: vis.border,
                                    cursor: vis.cursor,
                                    transform: isSelected ? "scale(1.08) translateY(-2px)" : "none",
                                    opacity: booked || showEnded ? 0.85 : 1,
                                  }}
                                >
                                  {seat.number}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-4 border-0 shadow-lg bg-white bg-opacity-10 rounded-5" style={{ backdropFilter: "blur(10px)" }}>
                <h4 className="fw-black text-white mb-2 tracking-tighter text-uppercase">
                  <i className="fas fa-popcorn text-warning me-3" />
                  Bắp nước kèm vé
                </h4>
                {showtime?.cinemaName ? (
                  <p className="small text-white-50 mb-3">
                    Menu rạp <span className="text-warning fw-bold">{showtime.cinemaName}</span> — thanh toán chung PayOS với vé.
                  </p>
                ) : null}
                {snackMenuError ? <div className="alert alert-warning py-2 small border-0 mb-0">{snackMenuError}</div> : null}
                {!snackMenuError && snackProducts.length === 0 && showtime?.cinemaId ? (
                  <p className="small text-white-50 text-center py-3 mb-0">Rạp chưa có món đang bán.</p>
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
                            <div className="text-white fw-bold small text-truncate">{p.name}</div>
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
                            <span className="text-white fw-bold px-1" style={{ minWidth: 22, textAlign: "center" }}>
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
                className="card p-4 border-0 shadow-lg rounded-5 bg-white bg-opacity-10 sticky-top"
                style={{ top: 100, backdropFilter: "blur(20px)" }}
              >
                <h4 className="fw-black text-white mb-4 text-uppercase tracking-tighter border-bottom border-white border-opacity-10 pb-3">
                  Hóa đơn
                </h4>

                <div className="bg-white bg-opacity-5 p-3 rounded-4 mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light opacity-50 small fw-bold">PHIM</span>
                    <span className="text-white fw-bold text-end small">{showtime.movieTitle}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-light opacity-50 fw-bold">SUẤT</span>
                    <span className="text-white text-end">
                      {showtime.date} {showtime.time}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 border-top border-white border-opacity-5 pt-2">
                    <span className="text-light opacity-50 small fw-bold">GHẾ ({selectedSeatIds.length})</span>
                    <div className="text-end">
                      <div className="text-primary fw-bold small">{selectedLabels.length ? selectedLabels.join(", ") : "—"}</div>
                    </div>
                  </div>
                  {selectedSeatIds.map((id) => {
                    const s = seatById.get(id);
                    if (!s) return null;
                    return (
                      <div key={id} className="d-flex justify-content-between small mb-1">
                        <span className="text-white-50">
                          {s.row}
                          {s.number} ({s.seatTypeName || "Ghế"})
                        </span>
                        <span className="text-white fw-bold">{seatPrice(s).toLocaleString("vi-VN")} đ</span>
                      </div>
                    );
                  })}
                  {snackTotal > 0 ? (
                    <div className="d-flex justify-content-between small mb-1 mt-2 pt-2 border-top border-white border-opacity-10">
                      <span className="text-light opacity-50 fw-bold">BẮP NƯỚC</span>
                      <span className="text-white fw-bold">{snackTotal.toLocaleString("vi-VN")} đ</span>
                    </div>
                  ) : null}
                  <div className="d-flex justify-content-between align-items-center mt-3 border-top border-white border-opacity-10 pt-3">
                    <span className="text-light opacity-50 small fw-bold">TỔNG</span>
                    <h3 className="text-danger fw-black m-0">{grandTotal.toLocaleString("vi-VN")} đ</h3>
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
