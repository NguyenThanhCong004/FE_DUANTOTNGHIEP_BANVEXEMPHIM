import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, Ticket, Utensils, CreditCard, User, Search, Plus, Minus, X, CheckCircle2, Banknote, RefreshCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { getAccessToken, getStoredStaff, getActiveShift } from '../../utils/authStorage';
import { apiUrl } from '../../utils/apiClient';
import { MOVIES, SHOWTIMES, CINEMAS, SEATS, COUNTER_ORDERS, SEAT_TYPES } from '../../constants/apiEndpoints';
import { checkNoSingleSeatOrphanInRows } from "../../utils/seatLayoutRules";
import { isCoupleTypeName, resolveSeatDisplayColor, resolveSeatTypeColor } from "../../utils/seatTypeColors";

// Grid constants
const ROWS = 15;
const COLS = 24;

const isPlacedSeat = (cell) =>
  cell && cell.type !== "Empty" && cell.type !== "OccupiedByDouble";

const emptyCell = (r, c) => ({
  rowIdx: r,
  colIdx: c,
  type: "Empty",
  label: "",
  isActive: false,
});

// Helper cho logic nhãn hàng giống Admin
const rowHasAnySeat = (grid, r) => {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    const cell = grid[i];
    if (cell && cell.type !== "Empty" && cell.type !== "OccupiedByDouble") return true;
  }
  return false;
};

const virtualRowLetterIndex = (grid, r) => {
  let above = 0;
  for (let r2 = 0; r2 < r; r2++) {
    if (rowHasAnySeat(grid, r2)) above++;
  }
  return above;
};

const rowLetterForGridRow = (grid, r) => {
  if (!rowHasAnySeat(grid, r)) return "";
  const i = virtualRowLetterIndex(grid, r);
  const SEAT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return SEAT_LETTERS[i] ?? "?";
};

// Xây dựng grid từ danh sách ghế
function buildSeatGrid(seats, seatTypesData = []) {
  if (!seats || seats.length === 0) return [];

  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid.push(emptyCell(r, c));
    }
  }

  // Hàm kiểm tra ghế đôi chuẩn admin
  const isCouple = (typeName) => {
    if (!typeName) return false;
    const st = seatTypesData.find(t => String(t.name).trim().toLowerCase() === String(typeName).trim().toLowerCase());
    if (st && st.coupleSeat !== undefined) return st.coupleSeat === true;
    return isCoupleTypeName(typeName);
  };

  for (const seat of seats) {
    const x = seat.x ?? 0;
    const y = seat.y ?? 0;
    
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      const idx = y * COLS + x;
      const seatType = String(seat.seatTypeName || "Thường").trim() || "Thường";

      grid[idx] = {
        rowIdx: y,
        colIdx: x,
        type: seatType,
        label: seat.number || "",
        isActive: seat.status !== "locked" && seat.status !== "maintenance",
        seatData: seat,
      };
      
      if (isCouple(seatType) && x + 1 < COLS) {
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

  // Tự động tính toán lại nhãn ghế A1, A2... để khớp với hiển thị Admin
  for (let r = 0; r < ROWS; r++) {
    const letter = rowLetterForGridRow(grid, r);
    if (!letter) continue;
    
    let num = 0;
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (isPlacedSeat(grid[idx])) {
        num++;
        // Gán nhãn đầy đủ như A1, A2
        grid[idx].label = `${letter}${num}`;
      }
    }
  }

  return grid;
}

function getSeatColor(cell, seatTypes = []) {
  if (!isPlacedSeat(cell)) return "transparent";
  if (!cell.isActive) return "#6c757d";
  
  // Ưu tiên màu gắn trực tiếp trên ghế, sau đó tra theo loại
  const explicitHex = cell.seatData?.seatTypeColor ?? cell.seatData?.seat_type_color;
  return resolveSeatDisplayColor(cell.type, seatTypes, explicitHex);
}

// Helper lấy nhãn ghế đầy đủ (A1, B2...) dựa trên tọa độ và grid hiện tại
const getFullSeatLabel = (seat, seats, seatTypes) => {
  if (!seat || !seats.length) return seat?.number || "";
  // Xây dựng grid tạm để tính toán nhãn hàng theo logic Admin
  const tempGrid = buildSeatGrid(seats, seatTypes);
  const x = seat.x ?? 0;
  const y = seat.y ?? 0;
  const idx = y * COLS + x;
  return tempGrid[idx]?.label || seat.number || "";
};

const Sales = () => {
  const token = getAccessToken();
  const staff = getStoredStaff();
  const activeShift = getActiveShift();
  const cinemaId = staff?.cinemaId;
  const searchInputRef = useRef(null);

  // --- States ---
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('showtimes');
  const [searchTerm, setSearchText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [timeLeft, setTimeLeft] = useState(0); // Đếm ngược giây

  // Giỏ hàng
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  // Countdown timer cho thanh toán QR
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && orderSuccess?.orderCode === 'PENDING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCancelPayment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, orderSuccess]);

  // Cảnh báo khi chuyển trang trong khi đang quét mã QR
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (orderSuccess?.paymentMethod === 'TRANSFER' && orderSuccess?.orderCode === 'PENDING') {
        e.preventDefault();
        e.returnValue = 'Đang chờ thanh toán chuyển khoản. Nếu rời trang, đơn hàng sẽ bị hủy. Bạn có chắc chắn muốn hủy?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [orderSuccess]);

  const handleCancelPayment = async () => {
    if (orderSuccess?.orderCode && paymentData?.orderCode) {
      try {
        await fetch(apiUrl(COUNTER_ORDERS.CANCEL(paymentData.orderCode)), {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) { console.error("Lỗi hủy đơn hàng:", err); }
    }
    handleNewOrder(); // Reset giao diện về trạng thái ban đầu
    showToast("Đã hủy đơn hàng thành công. Vé và ghế đã được giải phóng.", "warning");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Tự động focus ô tìm kiếm
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  // --- Fetching Data ---

  useEffect(() => {
    const fetchSeatTypes = async () => {
      try {
        const res = await fetch(apiUrl(SEAT_TYPES.LIST));
        const json = await res.json();
        if (json?.data) setSeatTypes(json.data);
      } catch (err) { console.error("Lỗi lấy loại ghế:", err); }
    };
    fetchSeatTypes();
  }, []);

  useEffect(() => {
    if (cinemaId) {
      const fetchMoviesShowingToday = async () => {
        try {
          const res = await fetch(apiUrl(SHOWTIMES.LIST) + `?cinemaId=${cinemaId}`);
          const json = await res.json();
          
          if (json?.data && json.data.length > 0) {
            const moviesMap = new Map();
            json.data.forEach(st => {
              const mId = st.movieId || st.movie_id || (st.movie && st.movie.id);
              if (mId && !moviesMap.has(mId)) {
                moviesMap.set(mId, {
                  id: mId,
                  title: st.movieTitle || st.movie_title || (st.movie && st.movie.title) || "Phim không tên",
                  duration: st.movieDuration || st.movie_duration || (st.movie && st.movie.duration) || 120,
                });
              }
            });
            
            const showingMovies = Array.from(moviesMap.values());
            if (showingMovies.length > 0) {
              setMovies(showingMovies);
              return;
            }
          }
          
          // Nếu không có suất chiếu nào hoặc không lấy được phim từ suất chiếu, lấy danh sách phim mặc định
          const resFallback = await fetch(apiUrl(MOVIES.LIST));
          const jsonFallback = await resFallback.json();
          if (jsonFallback?.data) setMovies(jsonFallback.data);
          
        } catch (err) { 
          console.error("Lỗi lấy danh sách phim:", err); 
          // Dự phòng lấy tất cả phim nếu có lỗi
          fetch(apiUrl(MOVIES.LIST))
            .then(r => r.json())
            .then(j => { if(j.data) setMovies(j.data); });
        }
      };
      fetchMoviesShowingToday();
    }
  }, [cinemaId]);

  useEffect(() => {
    if (selectedMovie?.id && cinemaId) {
      const fetchShowtimes = async () => {
        try {
          const res = await fetch(apiUrl(SHOWTIMES.LIST) + `?movieId=${selectedMovie.id}&cinemaId=${cinemaId}`);
          const json = await res.json();
          if (json?.data) setShowtimes(json.data);
          else setShowtimes([]);
        } catch (err) { 
          console.error("Lỗi lấy suất chiếu:", err); 
          setShowtimes([]);
        }
      };
      fetchShowtimes();
    } else {
      setShowtimes([]);
    }
  }, [selectedMovie?.id, cinemaId]);

  useEffect(() => {
    if (selectedShowtime?.id && selectedShowtime?.room_id) {
      const fetchSeatsAndBooked = async () => {
        try {
          const resSeats = await fetch(apiUrl(SEATS.BY_ROOM(selectedShowtime.room_id)));
          const jsonSeats = await resSeats.json();
          if (jsonSeats?.data) setSeats(jsonSeats.data);

          const resST = await fetch(apiUrl(SHOWTIMES.BY_ID(selectedShowtime.id)));
          const jsonST = await resST.json();
          if (jsonST?.data?.bookedSeatIds) setBookedSeatIds(jsonST.data.bookedSeatIds);
        } catch (err) { console.error("Lỗi lấy dữ liệu ghế:", err); }
      };
      fetchSeatsAndBooked();
      setSelectedSeats([]);
    }
  }, [selectedShowtime]);

  useEffect(() => {
    if (cinemaId) {
      const fetchProducts = async () => {
        try {
          const res = await fetch(apiUrl(CINEMAS.PRODUCT_MENU(cinemaId)));
          const json = await res.json();
          if (json?.data?.onSale) setProducts(json.data.onSale);
        } catch (err) { console.error("Lỗi lấy bắp nước:", err); }
      };
      fetchProducts();
    }
  }, [cinemaId]);

  // --- Handlers ---

  const handleSelectMovie = (movie) => {
    if (selectedMovie?.id === movie.id) {
      setActiveTab('showtimes');
      return;
    }
    setSelectedMovie(movie);
    setSelectedShowtime(null);
    setShowtimes([]);
    setActiveTab('showtimes');
  };

  const handleSelectShowtime = (st) => {
    setSelectedShowtime(st);
    setActiveTab('seats');
  };

  const sortedShowtimes = useMemo(() => {
    return [...showtimes].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [showtimes]);

  const toggleSeat = (seat) => {
    const id = Number(seat.seatId);
    if (bookedSeatIds.includes(id)) return;
    if (seat.status === 'maintenance' || seat.status === 'locked') return;
    
    const isSelected = selectedSeats.find(s => s.seatId === id);
    let nextSelected = [];
    
    if (isSelected) {
      nextSelected = selectedSeats.filter(s => s.seatId !== id);
    } else {
      if (selectedSeats.length >= 8) { 
        showToast("Chỉ được chọn tối đa 8 ghế cho mỗi lần bán.", "warning");
        return; 
      }
      nextSelected = [...selectedSeats, seat];
    }

    // Kiểm tra ghế trống lẻ
    const blockedIds = new Set([...bookedSeatIds, ...nextSelected.map(s => s.seatId)]);
    const check = checkNoSingleSeatOrphanInRows(seats, blockedIds);
    if (!check.ok) {
      showToast(check.message, "warning");
      return;
    }

    setSelectedSeats(nextSelected);
  };

  const updateProductQty = (product, delta) => {
    const existing = selectedProducts.find(p => p.productId === product.productId);
    if (existing) {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== product.productId));
      } else {
        setSelectedProducts(selectedProducts.map(p => p.productId === product.productId ? { ...p, quantity: newQty } : p));
      }
    } else if (delta > 0) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1, price: product.price, name: product.name }]);
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const generateTicketPreview = async (order, movie, showtime, seats, products) => {
    try {
      const now = new Date().toLocaleString('vi-VN');
      const htmlContent = `
        <div style="width: 320px; padding: 25px; font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; border: 2px solid #000; position: relative;">
          <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">FPOLY CINEMA</h1>
            <div style="font-size: 12px; margin-top: 5px;">${staff?.cinemaName || 'Hệ thống rạp chiếu phim'}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 10px; text-transform: uppercase; margin-bottom: 2px;">Phim / Movie</div>
            <h2 style="margin: 0; font-size: 20px; line-height: 1.2; font-family: sans-serif; font-weight: 900;">${movie?.title?.toUpperCase()}</h2>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Ngày / Date</div>
              <div style="font-size: 14px; font-weight: bold;">${new Date().toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Suất / Time</div>
              <div style="font-size: 14px; font-weight: bold;">${showtime?.time}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Phòng / Room</div>
              <div style="font-size: 14px; font-weight: bold;">${showtime?.room_name || showtime?.roomName}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Định dạng</div>
              <div style="font-size: 14px; font-weight: bold;">2D PHỤ ĐỀ</div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px;">Ghế / Seats</div>
            ${seats.map(s => `
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                <span>${getFullSeatLabel(s, seats, seatTypes)} (${s.seatTypeName || 'Ghế thường'})</span>
                <span style="font-weight: bold;">${((showtime?.price || 0) + (s.seatTypeSurcharge || 0)).toLocaleString()}đ</span>
              </div>
            `).join("")}
          </div>

          ${products.length > 0 ? `
            <div style="margin-bottom: 20px; border-top: 1px dashed #000; padding-top: 15px;">
              <div style="font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px;">Bắp & Nước / Food & Drinks</div>
              ${products.map(p => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                  <span>${p.name} x${p.quantity}</span>
                  <span style="font-weight: bold;">${(p.price * p.quantity).toLocaleString()}đ</span>
                </div>
              `).join("")}
            </div>
          ` : ""}

          <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: bold;">TỔNG CỘNG / TOTAL</span>
              <span style="font-size: 20px; font-weight: 900; font-family: sans-serif;">${order.finalAmount?.toLocaleString()}đ</span>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <div style="font-size: 30px; font-family: 'Libre Barcode 39', cursive; line-height: 1; margin-bottom: 5px;">|||| || | |||| | ||| ||</div>
            <div style="font-size: 10px; letter-spacing: 3px;">${order.orderCode}</div>
            <div style="font-size: 9px; margin-top: 15px; opacity: 0.7;">
              NV: ${staff?.fullName || 'Staff'} - ${now}<br/>
              Vui lòng giữ vé để soát lỗi. Chúc bạn xem phim vui vẻ!
            </div>
          </div>
          
          <div style="position: absolute; width: 20px; height: 20px; background: #0f172a; border-radius: 50%; left: -12px; top: 110px;"></div>
          <div style="position: absolute; width: 20px; height: 20px; background: #0f172a; border-radius: 50%; right: -12px; top: 110px;"></div>
        </div>
      `;
      const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
      await fetch(apiUrl("/api/v1/counter-orders/export-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64Html, fileName: `Ticket_${order.orderCode}.html` })
      });
      showToast("Đã in vé thành công.", "success");
    } catch (err) { console.error("Lỗi tạo vé preview:", err); }
  };

  const handleCheckout = () => {
    if (!selectedShowtime && selectedSeats.length === 0 && selectedProducts.length === 0) return;
    setShowConfirmModal(true);
  };

  const processCheckout = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setPaymentData(null);
    try {
      const body = {
        showtimeId: selectedShowtime?.id,
        seatIds: selectedSeats.map(s => s.seatId),
        products: selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity })),
        paymentMethod: paymentMethod,
        userId: null
      };
      const res = await fetch(apiUrl(COUNTER_ORDERS.CHECKOUT), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      const json = await res.json().catch(() => null);
      
      if (res.ok && json) {
        if (paymentMethod === 'TRANSFER' && json.data?.checkoutUrl) {
          setPaymentData(json.data);
          setTimeLeft(600); 
          setOrderSuccess({ 
            orderCode: "PENDING", 
            finalAmount: totalPrice, 
            paymentMethod: 'TRANSFER',
            checkoutUrl: json.data.checkoutUrl,
            qrCode: json.data.qrCode
          });
          showToast("Chờ khách hàng chuyển khoản...", "info");
        } else {
          setOrderSuccess(json.data);
          generateTicketPreview(json.data, selectedMovie, selectedShowtime, selectedSeats, selectedProducts);
          setSelectedSeats([]);
          setSelectedProducts([]);
          if (selectedShowtime?.id) {
            const resST = await fetch(apiUrl(SHOWTIMES.BY_ID(selectedShowtime.id)));
            const jsonST = await resST.json().catch(() => null);
            if (jsonST?.data?.bookedSeatIds) setBookedSeatIds(jsonST.data.bookedSeatIds);
          }
          showToast("Thanh toán thành công!", "success");
        }
      } else { 
        showToast(json?.message || "Thanh toán thất bại.", "error"); 
      }
    } catch (err) { 
      console.error("Lỗi checkout:", err); 
      showToast("Lỗi hệ thống trong quá trình thanh toán.", "error"); 
    } finally { setIsProcessing(false); }
  };

  // Polling tự động kiểm tra trạng thái thanh toán chuyển khoản
  useEffect(() => {
    let pollInterval;
    if (orderSuccess?.paymentMethod === 'TRANSFER' && orderSuccess?.orderCode === 'PENDING' && paymentData?.orderCode) {
      pollInterval = setInterval(async () => {
        try {
          // Gọi API kiểm tra trạng thái đơn hàng (GET)
          const res = await fetch(apiUrl(COUNTER_ORDERS.CHECK_STATUS(paymentData.orderCode)), {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
            const json = await res.json();
            // Nếu trạng thái đã là PAID (status 1)
            if (json.data?.status === 1) {
              clearInterval(pollInterval);
              
              // Đảm bảo orderCode có tiền tố POS- khi là chuyển khoản tại quầy
              const fullOrderCode = paymentData.orderCode.toString().startsWith("POS-") 
                ? paymentData.orderCode 
                : `POS-${paymentData.orderCode}`;
                
              // Xử lý thành công tự động
              generateTicketPreview(
                { ...orderSuccess, orderCode: fullOrderCode, finalAmount: orderSuccess.finalAmount }, 
                selectedMovie, selectedShowtime, selectedSeats, selectedProducts
              );
              showToast("Thanh toán chuyển khoản thành công!", "success");
              setOrderSuccess({ ...orderSuccess, orderCode: fullOrderCode, status: 'PAID' });
            }
          }
        } catch (err) {
          console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
        }
      }, 2000); // Kiểm tra mỗi 2 giây
    }
    return () => clearInterval(pollInterval);
  }, [orderSuccess, paymentData, token, selectedMovie, selectedShowtime, selectedSeats, selectedProducts]);

  const handleConfirmTransfer = async () => {
    if (orderSuccess && paymentData?.orderCode) {
      try {
        setIsProcessing(true);
        const res = await fetch(apiUrl(COUNTER_ORDERS.CONFIRM_PAID(paymentData.orderCode)), {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          generateTicketPreview(
            { ...orderSuccess, orderCode: paymentData.orderCode }, 
            selectedMovie, selectedShowtime, selectedSeats, selectedProducts
          );
          showToast("Đã xác nhận thanh toán chuyển khoản.", "success");
          handleNewOrder();
        } else {
          const json = await res.json();
          showToast(json.message || "Xác nhận thất bại.", "error");
        }
      } catch (err) {
        console.error("Lỗi xác nhận thanh toán:", err);
        showToast("Đã có lỗi xảy ra khi xác nhận thanh toán.", "error");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNewOrder = async (keepContext = false) => {
    setOrderSuccess(null);
    setPaymentData(null);
    setSelectedSeats([]);
    setSelectedProducts([]);
    
    if (keepContext && selectedShowtime) {
      // Làm mới danh sách ghế đã đặt cho suất chiếu hiện tại
      try {
        const resST = await fetch(apiUrl(SHOWTIMES.BY_ID(selectedShowtime.id)));
        const jsonST = await resST.json();
        if (jsonST?.data?.bookedSeatIds) setBookedSeatIds(jsonST.data.bookedSeatIds);
      } catch (err) { console.error("Lỗi làm mới ghế:", err); }
      
      setActiveTab('seats');
    } else {
      setSelectedMovie(null);
      setSelectedShowtime(null);
      setShowtimes([]);
      setSeats([]);
      setSearchText("");
      setActiveTab('showtimes');
    }
  };

  const totalPrice = useMemo(() => {
    let seatTotal = 0;
    if (selectedShowtime) {
      const basePrice = selectedShowtime.price || 0;
      seatTotal = selectedSeats.reduce((sum, s) => sum + basePrice + (s.seatTypeSurcharge || 0), 0);
    }
    const productTotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    return seatTotal + productTotal;
  }, [selectedSeats, selectedProducts, selectedShowtime]);

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderSeatMap = () => {
    if (!seats.length) return <div className="p-5 text-white-50 text-center w-100">Đang tải sơ đồ ghế...</div>;
    
    const seatGrid = buildSeatGrid(seats, seatTypes);
    const seatSize = 24; 
    const doubleSeatSize = 53; 
    const gapSize = 4; 
    const fontSize = 8; 
    const labelFontSize = 9;
    const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // Helper kiểm tra ghế đôi đồng bộ với buildSeatGrid
    const isDoubleSeat = (typeName) => {
      if (!typeName) return false;
      const st = seatTypes.find(t => String(t.name).trim().toLowerCase() === String(typeName).trim().toLowerCase());
      if (st && st.coupleSeat !== undefined) return st.coupleSeat === true;
      return isCoupleTypeName(typeName);
    };

    return (
      <div className="view-seats-internal w-100">
        <div className="seat-map-outer custom-scrollbar">
          <div style={{ width: 'fit-content', margin: '0 auto' }}>
            <div className="screen-indicator-mini">MÀN HÌNH</div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: `30px repeat(${COLS}, ${seatSize}px)`,
              gap: `${gapSize}px`,
              padding: '10px',
              minWidth: 'fit-content',
            }}>
              <div />
              {[...Array(COLS)].map((_, c) => (
                <div key={`col-${c}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${labelFontSize}px`, fontWeight: '800', color: '#64748b' }}>{c + 1}</div>
              ))}

              {[...Array(ROWS)].map((_, r) => (
                <React.Fragment key={`row-${r}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: '#38bdf8' }}>
                    {r + 1}
                  </div>
                  {[...Array(COLS)].map((_, c) => {
                    const idx = r * COLS + c;
                    const cell = seatGrid[idx];
                    
                    if (!cell || cell.type === "OccupiedByDouble") return null;
                    
                    const isPlaced = isPlacedSeat(cell);
                    if (!isPlaced) return <div key={`empty-${idx}`} style={{ width: seatSize, height: seatSize }} />;
                    
                    const seat = cell.seatData;
                    const id = Number(seat.seatId);
                    const isBooked = bookedSeatIds.includes(id);
                    const isSelected = !!selectedSeats.find(s => s.seatId === id);
                    const isDouble = isDoubleSeat(cell.type);
                    
                    let statusClass = "available";
                    if (isBooked) statusClass = "locked";
                    else if (isSelected) statusClass = "selected";
                    else if (!cell.isActive) statusClass = "locked";

                    const seatColor = getSeatColor(cell, seatTypes);

                    return (
                      <div 
                        key={`seat-${id}`} 
                        className={`seat-item ${statusClass}`} 
                        style={{
                          gridColumn: isDouble ? `span 2` : undefined,
                          width: isDouble ? `${doubleSeatSize}px` : `${seatSize}px`,
                          height: `${seatSize}px`,
                          backgroundColor: isSelected ? '#198754' : (isBooked ? '#6c757d' : seatColor),
                          opacity: isBooked ? 0.4 : 1,
                          fontSize: `${fontSize}px`,
                          zIndex: isSelected ? 10 : 1,
                          borderRadius: '4px',
                          border: isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.1)'
                        }}
                        onClick={() => toggleSeat(seat)} 
                        title={`${seat.seatTypeName}: ${seat.number}`}
                      >
                        <span className="seat-number-text">{cell.label}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="seat-legend mt-3 d-flex justify-content-center flex-wrap gap-3">
          {(seatTypes.length > 0 ? seatTypes : [{ name: "Thường" }, { name: "VIP" }, { name: "Đôi" }]).map((st) => {
            const fill = resolveSeatTypeColor(st.name, seatTypes);
            return (
              <div key={st.name} className="legend-item d-flex align-items-center gap-1">
                <span
                  className="rounded"
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    background: fill,
                    border: "1px solid rgba(0,0,0,0.2)",
                  }}
                />
                {st.name}
              </div>
            );
          })}
          <div className="legend-item"><span className="box selected"></span> Đang chọn</div>
          <div className="legend-item"><span className="box locked"></span> Đã đặt</div>
        </div>
      </div>
    );
  };

  return (
    <div className="pos-container">
      <aside className="pos-sidebar-left">
        <div className="pos-search">
          <div className="pos-search-box">
            <Search size={14} className="text-white-50" />
            <input ref={searchInputRef} type="text" placeholder="Tìm phim (F)..." value={searchTerm} onChange={(e) => setSearchText(e.target.value)} />
          </div>
        </div>
        <div className="pos-movie-list custom-scrollbar">
          {filteredMovies.map(movie => (
            <div key={`movie-${movie.id}`} className={`pos-movie-item ${selectedMovie?.id === movie.id ? 'active' : ''}`} onClick={() => handleSelectMovie(movie)}>
              <div className="pos-movie-info">
                <div className="title">{movie.title}</div>
                <div className="meta">{movie.duration} phút</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="pos-main-content" style={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="pos-stepper">
          <div className={`step-item ${activeTab === 'showtimes' ? 'active' : ''} completed`} onClick={() => setActiveTab('showtimes')}>
            <div className="step-circle"><Ticket size={14} /></div>
            <span className="step-text">Suất chiếu</span>
          </div>
          <div className={`step-line ${selectedShowtime ? 'active' : ''}`} />
          <div className={`step-item ${activeTab === 'seats' ? 'active' : ''} ${selectedShowtime ? 'completed' : 'disabled'}`} onClick={() => selectedShowtime && setActiveTab('seats')}>
            <div className="step-circle"><User size={14} /></div>
            <span className="step-text">Chọn Ghế</span>
          </div>
          <div className={`step-line ${selectedSeats.length > 0 ? 'active' : ''}`} />
          <div className={`step-item ${activeTab === 'food' ? 'active' : ''} ${selectedSeats.length > 0 ? 'completed' : 'disabled'}`} onClick={() => selectedSeats.length > 0 && setActiveTab('food')}>
            <div className="step-circle"><Utensils size={14} /></div>
            <span className="step-text">Bắp nước</span>
          </div>
        </header>

        <section className="pos-view-area custom-scrollbar" style={{ paddingTop: '30px' }}>
          {activeTab === 'showtimes' && (
            <div className="view-showtimes">
              <h3 className="section-title">{selectedMovie ? `Suất chiếu: ${selectedMovie.title}` : "Chọn phim bên trái"}</h3>
              <div className="pos-showtimes-grid">
                {sortedShowtimes.map(st => (
                  <button key={`st-${st.id}`} className={`st-btn ${selectedShowtime?.id === st.id ? 'active' : ''}`} onClick={() => handleSelectShowtime(st)}>
                    <div className="st-time-range">{st.time} - {st.endTime || '??:??'}</div>
                    <div className="st-room-name">{st.room_name || st.roomName || 'N/A'}</div>
                  </button>
                ))}
                {selectedMovie && showtimes.length === 0 && <p className="text-white-50">Không có suất chiếu hôm nay.</p>}
              </div>
            </div>
          )}
          {activeTab === 'seats' && (
            <div className="view-seats w-100">
              {renderSeatMap()}
            </div>
          )}
          {activeTab === 'food' && (
            <div className="view-food">
              <div className="food-grid">
                {products.map(p => (
                  <div key={`prod-${p.productId}`} className="food-card clickable" onClick={() => updateProductQty(p, 1)}>
                    <div className="food-info">
                      <div className="name">{p.name}</div>
                      <div className="price">{p.price?.toLocaleString()}đ</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <aside className="pos-cart-panel">
        <div className="cart-header"><ShoppingCart size={18} /> <span>Giỏ hàng</span></div>
        <div className="cart-content custom-scrollbar">
          {selectedSeats.length > 0 && (
            <div className="cart-section">
              <div className="cart-movie-title">{selectedMovie?.title}</div>
              <div className="cart-showtime-info">{selectedShowtime?.time} · {selectedShowtime?.room_name || selectedShowtime?.roomName}</div>
              
              {/* Nhóm ghế theo loại */}
              {Object.entries(
                selectedSeats.reduce((acc, s) => {
                  const type = s.seatTypeName || "Ghế thường";
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(s);
                  return acc;
                }, {})
              ).map(([typeName, groupSeats]) => (
                <div key={typeName} className="cart-item-group mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="item-name" style={{ fontSize: '12px', opacity: 0.8 }}>{typeName}</span>
                    <span className="item-price" style={{ fontSize: '12px' }}>
                      {groupSeats.reduce((sum, s) => sum + (selectedShowtime?.price || 0) + (s.seatTypeSurcharge || 0), 0).toLocaleString()}đ
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {groupSeats.map(gs => (
                      <div 
                        key={gs.seatId} 
                        className="seat-chip"
                        onClick={() => toggleSeat(gs)}
                        title="Nhấn để xóa ghế"
                      >
                        {getFullSeatLabel(gs, seats, seatTypes)}
                        <X size={10} className="ms-1 opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedProducts.length > 0 && (
            <div className="cart-section mt-3">
              <div className="section-label" style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Bắp nước</div>
              {selectedProducts.map(p => (
                <div key={`cart-prod-${p.productId}`} className="item-row food-item mb-2">
                  <div className="item-details" style={{ flex: 1 }}>
                    <div className="item-name" style={{ fontSize: '12.5px', marginBottom: '4px' }}>{p.name}</div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="qty-control-cart d-flex align-items-center">
                        <button className="qty-btn" onClick={() => updateProductQty(p, -1)}><Minus size={10}/></button>
                        <span className="qty-val">{p.quantity}</span>
                        <button className="qty-btn" onClick={() => updateProductQty(p, 1)}><Plus size={10}/></button>
                      </div>
                      <button className="cart-item-delete" onClick={() => removeProduct(p.productId)} title="Xóa món này"><X size={12}/></button>
                    </div>
                  </div>
                  <span className="item-price ms-2">{(p.price * p.quantity).toLocaleString()}đ</span>
                </div>
              ))}
            </div>
          )}
          {selectedSeats.length === 0 && selectedProducts.length === 0 && (
            <div className="cart-empty"><ShoppingCart size={32} strokeWidth={1} /><p>Giỏ hàng đang trống</p></div>
          )}
        </div>
        <div className="cart-footer">
          <div className="payment-method-selector mb-3">
            <div className="section-label">Hình thức thanh toán</div>
            <div className="d-flex gap-2">
              <button className={`method-btn ${paymentMethod === 'CASH' ? 'active' : ''}`} onClick={() => setPaymentMethod('CASH')}><Banknote size={14} /> Tiền mặt</button>
              <button className={`method-btn ${paymentMethod === 'TRANSFER' ? 'active' : ''}`} onClick={() => setPaymentMethod('TRANSFER')}><RefreshCcw size={14} /> C.Khoản</button>
            </div>
          </div>
          <div className="total-row"><span className="total-label">Tổng cộng</span><span className="total-price">{totalPrice.toLocaleString()}đ</span></div>
          <button className="checkout-btn" onClick={handleCheckout} disabled={totalPrice === 0 || isProcessing}>
            {isProcessing ? "ĐANG XỬ LÝ..." : <><CreditCard size={16} /> XÁC NHẬN</>}
          </button>
        </div>
      </aside>

      {showConfirmModal && (
        <div className="pos-overlay">
          <div className="success-modal" style={{ width: '450px', textAlign: 'left' }}>
            <h4 className="fw-bold mb-3 text-white d-flex align-items-center gap-2">
              <ShoppingCart size={24} className="text-primary" /> Xác nhận đơn hàng
            </h4>
            
            <div className="modal-details p-3 bg-light rounded mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div className="mb-3 border-bottom pb-2">
                <div className="text-dark small fw-bold text-uppercase opacity-50">Phim & Suất chiếu</div>
                <div className="text-dark fw-bold">{selectedMovie?.title}</div>
                <div className="text-primary small fw-bold">{selectedShowtime?.time} · {selectedShowtime?.room_name || selectedShowtime?.roomName}</div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="mb-3 border-bottom pb-2">
                  <div className="text-dark small fw-bold text-uppercase opacity-50">Ghế đã chọn</div>
                  <div className="text-dark fw-bold">
                    {selectedSeats.map(s => getFullSeatLabel(s, seats, seatTypes)).join(", ")} 
                    <span className="ms-2 text-muted small">({selectedSeats.length} ghế)</span>
                  </div>
                </div>
              )}

              {selectedProducts.length > 0 && (
                <div className="mb-3 border-bottom pb-2">
                  <div className="text-dark small fw-bold text-uppercase opacity-50">Bắp nước</div>
                  {selectedProducts.map(p => (
                    <div key={p.productId} className="d-flex justify-content-between text-dark small">
                      <span>{p.name} x{p.quantity}</span>
                      <span>{(p.price * p.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
                <div>
                  <div className="text-dark small fw-bold text-uppercase opacity-50">Hình thức thanh toán</div>
                  <div className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {paymentMethod === 'CASH' ? 'TIỀN MẶT' : 'CHUYỂN KHOẢN QR'}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-dark small fw-bold text-uppercase opacity-50">Tổng thanh toán</div>
                  <div className="text-danger h4 fw-black mb-0">{totalPrice.toLocaleString()}đ</div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-outline-light flex-1 py-2 fw-bold" onClick={() => setShowConfirmModal(false)}>QUAY LẠI</button>
              <button className="btn btn-primary flex-1 py-2 fw-bold" onClick={processCheckout}>XÁC NHẬN ĐƠN</button>
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="pos-overlay">
          <div className="success-modal">
            {orderSuccess.paymentMethod === 'TRANSFER' && orderSuccess.orderCode === 'PENDING' ? (
              <>
                <div className="qr-container mb-4">
                  <h5 className="fw-bold mb-3 text-white">Quét mã thanh toán</h5>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderSuccess.qrCode || "")}`} 
                    alt="PayOS QR" 
                    className="qr-image" 
                    style={{ width: '240px', height: '240px', borderRadius: '12px', background: '#fff', padding: '10px', objectFit: 'contain' }} 
                  />
                  <p className="mt-3 text-white-50 small px-4">Vui lòng yêu cầu khách quét mã QR để thanh toán <b>{orderSuccess.finalAmount?.toLocaleString()}đ</b></p>
                  <div className="mt-2 py-1 px-3 bg-danger-subtle text-danger rounded-pill d-inline-block small fw-bold">
                    Hết hạn sau: {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-light flex-1 py-2 fw-bold" onClick={handleCancelPayment}>HỦY BỎ</button>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="text-success mb-3" />
                <h4 className="fw-bold text-success">Thanh toán thành công!</h4>
                <div className="modal-details text-start mt-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between mb-1 text-dark"><span>Mã đơn:</span> <strong className="text-dark">{orderSuccess.orderCode}</strong></div>
                  <div className="d-flex justify-content-between mb-1 text-dark"><span>Tổng tiền:</span> <strong className="text-dark">{orderSuccess.finalAmount?.toLocaleString()}đ</strong></div>
                  <div className="d-flex justify-content-between text-dark"><span>Hình thức:</span> <span className="text-dark">{orderSuccess.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</span></div>
                </div>
                <div className="mt-4 text-info small mb-3">Đã in vé và lưu vào thư mục preview.</div>
                <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => handleNewOrder(true)}>ĐƠN MỚI</button>
              </>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`pos-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'warning' && <X size={18} />}
          {toast.type === 'error' && <X size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        .pos-toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 5000;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          font-weight: 600;
          font-size: 14px;
          animation: slideUp 0.3s ease-out;
        }
        .pos-toast.success { border-left: 4px solid #10b981; }
        .pos-toast.warning { border-left: 4px solid #f59e0b; }
        .pos-toast.error { border-left: 4px solid #ef4444; }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .pos-container { 
          display: grid; 
          grid-template-columns: 300px 1fr 320px; 
          height: calc(100dvh - 64px); 
          background: #0f172a; 
          overflow: hidden; 
          position: relative;
          margin: 0 !important;
          padding: 0 !important;
        }

        @media (max-height: 800px) {
          .pos-container { grid-template-columns: 240px 1fr 280px; }
          .pos-stepper { height: 44px; padding: 0 15px; }
          .step-circle { width: 24px; height: 24px; font-size: 10px; }
          .step-text { font-size: 10px; }
          .seat-map-outer { padding: 10px; }
          .screen-indicator-mini { margin-bottom: 12px; padding: 4px 40px; }
          .cart-header { padding: 10px; font-size: 13px; }
          .cart-footer { padding: 10px; }
          .total-price { font-size: 18px; }
          .checkout-btn { padding: 8px; font-size: 13px; }
        }

        @media (max-width: 1200px) {
          .pos-container { grid-template-columns: 180px 1fr 250px; }
        }
        
        /* Sidebar Left - Movies */
        .pos-sidebar-left { 
          background: #1e293b; 
          display: flex; 
          flex-direction: column; 
          border-right: 1px solid rgba(255,255,255,0.05); 
          z-index: 10;
          height: 100%;
          overflow: hidden;
        }
        .pos-search { 
          padding: 12px; 
          background: rgba(15, 23, 42, 0.4); 
          border-bottom: 1px solid rgba(255,255,255,0.05); 
        }
        .pos-search-box { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          background: #0f172a; 
          padding: 6px 10px; 
          border-radius: 8px; 
          border: 1px solid rgba(255,255,255,0.1); 
        }
        .pos-search-box input { 
          background: transparent; 
          border: none; 
          color: white; 
          font-size: 12px; 
          width: 100%; 
          outline: none; 
        }
        
        .pos-movie-list { flex: 1; overflow-y: auto; padding: 8px; }
        .pos-movie-item { 
          padding: 10px 12px; 
          cursor: pointer; 
          border-radius: 10px; 
          margin-bottom: 4px; 
          border: 1px solid transparent; 
          background: rgba(15, 23, 42, 0.2);
        }
        .pos-movie-item:hover { 
          background: rgba(255,255,255,0.05); 
          border-color: rgba(255,255,255,0.1);
        }
        .pos-movie-item.active { 
          background: linear-gradient(135deg, #0d6efd, #0b5ed7); 
          color: #fff; 
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
        .pos-movie-info .title { font-size: 12.5px; font-weight: 700; margin-bottom: 2px; line-height: 1.3; }
        .pos-movie-info .meta { font-size: 10px; opacity: 0.7; font-weight: 600; }

        /* Main Content Area */
        .pos-main-content { 
          display: flex; 
          flex-direction: column; 
          height: 100%; 
          overflow: hidden; 
          background: #0f172a;
        }
        
        /* Stepper Styling */
        .pos-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e293b;
          height: 52px; /* Chiều cao cố định giúp thanh tiến trình gọn gàng */
          padding: 0 30px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
          gap: 0;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0.4;
          padding: 0 12px;
          height: 100%; /* Đảm bảo item chiếm hết chiều cao để căn giữa chữ và icon */
        }
        .step-item.active { opacity: 1; }
        .step-item.completed { opacity: 1; }
        .step-item.disabled { cursor: not-allowed; opacity: 0.2; }
        
        .step-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #334155;
          color: #94a3b8;
          font-weight: 800;
          transition: all 0.3s ease;
        }
        .step-item.active .step-circle {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
        }
        .step-item.completed:not(.active) .step-circle {
          background: #38bdf8;
          color: #0f172a;
          border-color: #38bdf8;
        }
        
        .step-text {
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .step-item.active .step-text { color: #38bdf8; }
        .step-item.completed .step-text { color: #f1f5f9; }
        
        .step-line {
          flex: 0 0 40px;
          height: 2px;
          background: #334155;
          border-radius: 2px;
        }
        .step-line.active { background: #38bdf8; }

        .pos-view-area { 
          flex: 1; 
          overflow-y: auto; 
          padding: 0 16px 16px 16px; /* Bỏ padding top */
        }
        .section-title { 
          font-size: 14px; 
          font-weight: 800; 
          color: #f1f5f9; 
          margin: 16px 0; /* Đổi margin để tạo khoảng cách đều */
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .pos-showtimes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .st-btn { 
          background: #1e293b; 
          border: 1px solid rgba(255,255,255,0.05); 
          padding: 12px; 
          border-radius: 10px; 
          color: white; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          cursor: pointer; 
          transition: all 0.2s; 
        }
        .st-btn:hover { border-color: #38bdf8; background: #243147; transform: translateY(-2px); }
        .st-btn.active { 
          background: linear-gradient(135deg, #38bdf8, #2563eb); 
          color: white; 
          border-color: #38bdf8;
          box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
        }
        .st-time-range { font-size: 14px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        .st-room-name { font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.8; margin-top: 2px; }

        /* Seat Map Styling */
        .seat-map-outer { 
          width: 100%; 
          overflow: auto; 
          padding: 20px; 
          background: rgba(15, 23, 42, 0.6); 
          border-radius: 12px; 
          min-height: 400px;
          border: 1px solid rgba(255,255,255,0.03);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .screen-indicator-mini {
          background: linear-gradient(to bottom, rgba(56, 189, 248, 0.1), transparent); 
          padding: 6px 60px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #38bdf8;
          border-radius: 0 0 50% 50%;
          border-top: 3px solid #38bdf8;
          box-shadow: 0 -10px 20px rgba(56, 189, 248, 0.15);
          margin: 0 auto 24px;
          width: fit-content;
          text-align: center;
        }
        
        .box.available { background: #007bff; }
        .box.vip { background: #ffc107; }
        .box.double { background: #dc3545; }
        .box.selected { background: #198754; }
        .box.locked { background: #6c757d; opacity: 0.4; }
        
        .seat-item { 
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer;
        }
        .seat-item:hover:not(.locked) { 
          transform: scale(1.1); 
          z-index: 50; 
          box-shadow: 0 0 10px rgba(255,255,255,0.2); 
          border-color: white !important;
        }
        .seat-number-text { color: #ffffff; font-weight: 900; text-shadow: 0 1px 1px rgba(0,0,0,0.6); }

        /* Food Grid Styling */
        .food-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .food-card { 
          background: #1e293b; 
          border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.05); 
          transition: all 0.2s; 
          overflow: hidden;
        }
        .food-card:hover { border-color: #38bdf8; background: #243147; transform: translateY(-2px); }
        .food-info { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .food-info .name { font-size: 12.5px; font-weight: 700; color: #f1f5f9; min-height: 36px; line-height: 1.4; }
        .food-info .price { font-size: 14px; font-weight: 800; color: #38bdf8; }

        /* Cart Panel Right */
        .pos-cart-panel { 
          background: #1e293b; 
          display: flex; 
          flex-direction: column; 
          border-left: 1px solid rgba(255,255,255,0.05); 
          height: 100%; 
          overflow: hidden; 
          z-index: 10;
        }
        .cart-header { 
          padding: 14px 16px; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          font-weight: 800; 
          background: rgba(15, 23, 42, 0.4); 
          border-bottom: 1px solid rgba(255,255,255,0.05); 
          font-size: 14px; 
          flex-shrink: 0; 
        }
        .cart-content { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; }
        .cart-section { 
          padding-bottom: 12px; 
          border-bottom: 1px solid rgba(255,255,255,0.05); 
          margin-bottom: 12px;
        }
        .cart-movie-title { font-weight: 800; color: #f1f5f9; font-size: 13px; margin-bottom: 2px; text-transform: uppercase; }
        .cart-showtime-info { font-size: 11px; color: #38bdf8; font-weight: 700; }
        
        .item-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 8px; font-size: 12.5px; }
        .item-details { display: flex; flex-direction: column; gap: 2px; }
        .item-name { font-weight: 600; color: #cbd5e1; }
        .item-qty { font-size: 12px; color: #38bdf8; font-weight: 800; }
        .cart-item-delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        .cart-item-delete:hover {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }
        .item-price { font-weight: 800; color: #f1f5f9; }
        
        .cart-footer { 
          padding: 12px 16px; 
          background: rgba(15, 23, 42, 0.6); 
          border-top: 1px solid rgba(255,255,255,0.05); 
          flex-shrink: 0; 
        }
        .method-btn { 
          flex: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 6px; 
          padding: 6px; 
          background: #0f172a; 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 8px; 
          color: #94a3b8; 
          font-size: 11px; 
          font-weight: 700; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .method-btn.active { background: #1e293b; color: #38bdf8; border-color: #38bdf8; }
        .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .total-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
        .total-price { font-size: 20px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; }
        
        .checkout-btn { 
          width: 100%; 
          padding: 10px; 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: white; 
          border: none; 
          border-radius: 10px; 
          font-weight: 800; 
          font-size: 14px; 
          cursor: pointer; 
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
          transition: all 0.2s;
        }
        .checkout-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3); }
        .checkout-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .pos-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 3000; }
        .success-modal { 
          background: #1e293b; 
          padding: 30px; 
          border-radius: 20px; 
          width: 380px; 
          text-align: center; 
          border: 1px solid rgba(255,255,255,0.1); 
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; font-weight: 600; }
        .box { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

        .seat-chip {
          display: inline-flex;
          align-items: center;
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .seat-chip:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .qty-control-cart {
          display: flex;
          align-items: center;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        .qty-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 2px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .qty-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .qty-val {
          font-size: 11px;
          font-weight: 800;
          color: #38bdf8;
          min-width: 20px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default Sales;
