import React, { useState, useEffect, useCallback } from 'react';
import { Banknote, Ticket, Utensils, Clock, TrendingUp, Calendar as CalendarIcon, ChevronRight, X, User as UserIcon, Search, CreditCard, Banknote as CashIcon, Printer, CheckCircle2 } from 'lucide-react';
import { getAccessToken, getStoredStaff } from '../../utils/authStorage';
import { apiUrl, withQuery } from '../../utils/apiClient';
import { STAFF_DASHBOARD } from '../../constants/apiEndpoints';
import InvoiceSummaryCard from '../../components/common/InvoiceSummaryCard';
import { formatDate, formatTime } from '../../utils/formatters';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalProductsSold: 0,
    shiftName: "Đang tải...",
    cinemaName: "Đang tải..."
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productBreakdown, setProductBreakdown] = useState(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState(null);
  const [isReprinting, setIsReprinting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  const staff = getStoredStaff();
  const token = getAccessToken();

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const generateTicketPreview = async (order) => {
    if (!order || !order.tickets || order.tickets.length === 0) return;
    setIsReprinting(true);
    try {
      const now = new Date().toLocaleString('vi-VN');
      const movieInfo = order.tickets[0]; // Lấy thông tin phim từ vé đầu tiên
      const showtimeValue = movieInfo.showtime || movieInfo.showtimeStart || movieInfo.startTime;
      
      const htmlContent = `
        <div style="width: 320px; padding: 25px; font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; border: 2px solid #000; position: relative;">
          <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">FPOLY CINEMA</h1>
            <div style="font-size: 12px; margin-top: 5px;">${staff?.cinemaName || 'Hệ thống rạp chiếu phim'}</div>
            <div style="font-size: 10px; margin-top: 5px; font-weight: bold; border: 1px solid #000; display: inline-block; padding: 2px 10px;">VÉ IN LẠI / RE-PRINT</div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 10px; text-transform: uppercase; margin-bottom: 2px;">Phim / Movie</div>
            <h2 style="margin: 0; font-size: 20px; line-height: 1.2; font-family: sans-serif; font-weight: 900;">${movieInfo.movieTitle?.toUpperCase()}</h2>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Ngày / Date</div>
              <div style="font-size: 14px; font-weight: bold;">${formatDate(showtimeValue)}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Suất / Time</div>
              <div style="font-size: 14px; font-weight: bold;">${formatTime(showtimeValue)}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Phòng / Room</div>
              <div style="font-size: 14px; font-weight: bold;">${movieInfo.roomName || ''}</div>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; color: #666;">Định dạng</div>
              <div style="font-size: 14px; font-weight: bold;">2D PHỤ ĐỀ</div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px;">Ghế / Seats</div>
            ${order.tickets.map(t => `
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                <span>${t.seatNumber} (${t.seatTypeName || 'Chưa có loại'})</span>
                <span style="font-weight: bold;">${(t.price || 0).toLocaleString()}đ</span>
              </div>
            `).join("")}
          </div>

          ${order.foods && order.foods.length > 0 ? `
            <div style="margin-bottom: 20px; border-top: 1px dashed #000; padding-top: 15px;">
              <div style="font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px;">Bắp & Nước / Food & Drinks</div>
              ${order.foods.map(f => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                  <span>${f.productName} x${f.quantity}</span>
                  <span style="font-weight: bold;">${(f.price * f.quantity).toLocaleString()}đ</span>
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
              (VÉ IN LẠI - TRỊ GIÁ KHÔNG ĐỔI)<br/>
              Chúc bạn xem phim vui vẻ!
            </div>
          </div>
          
          <div style="position: absolute; width: 20px; height: 20px; background: #0f172a; border-radius: 50%; left: -12px; top: 110px;"></div>
          <div style="position: absolute; width: 20px; height: 20px; background: #0f172a; border-radius: 50%; right: -12px; top: 110px;"></div>
        </div>
      `;
      const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
      const exportRes = await fetch(apiUrl("/api/v1/counter-orders/export-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ pdfBase64: base64Html, fileName: `Reprint_Ticket_${order.orderCode}.html` })
      });
      if (!exportRes.ok) throw new Error(`Reprint ticket failed: ${exportRes.status}`);
      showToast("Đã in lại vé thành công. Vui lòng kiểm tra thư mục preview.", "success");
    } catch (err) { 
      console.error("Lỗi in lại vé:", err); 
      showToast("In lại vé thất bại.", "error");
    } finally {
      setIsReprinting(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Lấy ngày YYYY-MM-DD
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Truyền thêm date để BE tính theo ngày nếu hỗ trợ, nếu không BE vẫn trả về theo logic ca làm việc
      const resStats = await fetch(apiUrl(STAFF_DASHBOARD.STATS) + `?date=${today}`, { headers });
      const jsonStats = await resStats.json();
      if (jsonStats?.data) setStats(jsonStats.data);

      const resOrders = await fetch(apiUrl(withQuery(STAFF_DASHBOARD.RECENT_ORDERS, { search: searchQuery })), { headers });
      const jsonOrders = await resOrders.json();
      if (jsonOrders?.data) setRecentOrders(jsonOrders.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu dashboard:", err);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchOrderDetail = async (orderCode) => {
    if (!orderCode) return;
    try {
      const res = await fetch(apiUrl(STAFF_DASHBOARD.ORDER_DETAIL(orderCode)), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.data) {
        setSelectedOrder(json.data);
      } else {
        showToast("Không tìm thấy hóa đơn mã: " + orderCode, "warning");
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết hóa đơn:", err);
      showToast("Lỗi hệ thống khi tìm hóa đơn.", "error");
    }
  };

  const fetchProductBreakdown = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(apiUrl(STAFF_DASHBOARD.PRODUCTS_BREAKDOWN) + `?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.data) setProductBreakdown(json.data);
    } catch (err) {
      console.error("Lỗi lấy thống kê sản phẩm:", err);
    }
  };

  const fetchRevenueBreakdown = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(apiUrl(STAFF_DASHBOARD.REVENUE_BREAKDOWN) + `?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.data) setRevenueBreakdown(json.data);
    } catch (err) {
      console.error("Lỗi lấy thống kê doanh thu:", err);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      fetchOrderDetail(searchQuery.trim().toUpperCase());
    }
  };

  const StatCard = ({ title, value, icon, color, subValue, onClick, clickable }) => (
    <div className={`stat-card ${clickable ? 'clickable' : ''}`} onClick={onClick}>
      <div className={`icon-box ${color}`}>
        {React.createElement(icon, { size: 24 })}
      </div>
      <div className="stat-info">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subValue && <div className="stat-sub">{subValue}</div>}
      </div>
      {clickable && <ChevronRight size={16} className="ms-auto text-white-50" />}
    </div>
  );

  return (
    <div className="pos-container dashboard-container-full">
      <section className="dashboard-main-scroll custom-scrollbar">
        <div className="stats-grid">
          <StatCard 
            title="Doanh thu hôm nay" 
            value={`${stats.totalRevenue?.toLocaleString()}đ`} 
            icon={Banknote} 
            color="blue"
            subValue="Tổng thu nhập tất cả ca làm"
            clickable={true}
            onClick={fetchRevenueBreakdown}
          />
          <StatCard 
            title="Vé bán hôm nay" 
            value={stats.totalTicketsSold} 
            icon={Ticket} 
            color="purple"
            subValue="Số lượng vé in thành công"
          />
          <StatCard 
            title="Sản phẩm hôm nay" 
            value={stats.totalProductsSold} 
            icon={Utensils} 
            color="orange"
            subValue="Chi tiết bắp nước đã bán"
            clickable={true}
            onClick={fetchProductBreakdown}
          />
        </div>

        <div className="dashboard-content-grid mt-4">
          <div className="main-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h3>Hoạt động gần đây</h3>
              </div>
              <div className="dashboard-search-box">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Tìm mã đơn (Enter)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                />
              </div>
            </div>
            
            <div className="recent-orders-list">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <div key={order.orderOnlineId} className="order-item" onClick={() => fetchOrderDetail(order.orderCode)}>
                    <div className="order-main">
                      <div className="order-code">{order.orderCode}</div>
                      <div className="order-time">
                        {formatTime(order.createdAt)}
                        {" - "}
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="order-meta">
                      <div className="order-method">{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</div>
                      <div className="order-amount">{order.finalAmount?.toLocaleString()}đ</div>
                    </div>
                    <ChevronRight size={16} className="text-white-50" />
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <CalendarIcon size={48} strokeWidth={1} />
                  <p>Bạn chưa thực hiện giao dịch nào.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="side-card">
            <h3>Thông tin ca trực</h3>
            <div className="dashboard-info-list">
              <div className="dashboard-info-item">
                <span>Ngày làm việc</span>
                <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
              </div>
              <div className="dashboard-info-item">
                <span>Rạp làm việc</span>
                <strong>{stats.cinemaName || staff?.cinemaName || 'N/A'}</strong>
              </div>
              <div className="dashboard-info-item">
                <span>Vai trò</span>
                <strong>Nhân viên bán vé</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedOrder && (
        <div className="pos-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="d-flex align-items-center gap-3">
                <h3>Chi tiết hóa đơn</h3>
                {selectedOrder.tickets?.length > 0 && (
                  <button 
                    className="reprint-btn" 
                    onClick={() => generateTicketPreview(selectedOrder)}
                    disabled={isReprinting}
                  >
                    {isReprinting ? <Clock size={14} className="spin" /> : <Printer size={14} />}
                    {isReprinting ? "Đang xử lý..." : "IN LẠI VÉ"}
                  </button>
                )}
              </div>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            <div className="modal-body custom-scrollbar">
              <InvoiceSummaryCard order={selectedOrder} />
            </div>
          </div>
        </div>
      )}

      {productBreakdown && (
        <div className="pos-overlay" onClick={() => setProductBreakdown(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết sản phẩm đã bán</h3>
              <button className="close-btn" onClick={() => setProductBreakdown(null)}><X size={20} /></button>
            </div>
            <div className="modal-body custom-scrollbar">
              <p className="text-white-50 mb-4 small">Thống kê số lượng tất cả sản phẩm bắp nước bạn đã bán được trong ca hiện tại.</p>
              <div className="breakdown-list">
                {productBreakdown.length > 0 ? (
                  productBreakdown.map((item, i) => (
                    <div key={i} className="breakdown-item">
                      <div className="item-name">{item.productName}</div>
                      <div className="item-qty-badge">x{item.totalQuantity}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state"><Utensils size={40} strokeWidth={1} /><p>Chưa có sản phẩm nào.</p></div>
                )}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => setProductBreakdown(null)}>ĐÓNG</button></div>
          </div>
        </div>
      )}

      {revenueBreakdown && (
        <div className="pos-overlay" onClick={() => setRevenueBreakdown(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết doanh thu</h3>
              <button className="close-btn" onClick={() => setRevenueBreakdown(null)}><X size={20} /></button>
            </div>
            <div className="modal-body custom-scrollbar">
              <p className="text-white-50 mb-4 small">Phân bổ doanh thu theo hình thức thanh toán để bạn dễ dàng đối soát tiền mặt.</p>
              <div className="breakdown-list">
                {revenueBreakdown.map((item, i) => (
                  <div key={i} className="breakdown-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`icon-box sm ${item.method === 'CASH' ? 'orange' : 'blue'}`}>
                        {item.method === 'CASH' ? <CashIcon size={18} /> : <CreditCard size={18} />}
                      </div>
                      <div className="item-name">{item.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản / Online'}</div>
                    </div>
                    <div className="item-amount-text">{item.total?.toLocaleString()}đ</div>
                  </div>
                ))}
                {revenueBreakdown.length === 0 && <p className="text-center text-white-50 py-4">Chưa có doanh thu.</p>}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => setRevenueBreakdown(null)}>ĐÓNG</button></div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`dashboard-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'warning' && <X size={18} />}
          {toast.type === 'error' && <X size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        .dashboard-toast {
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
        .dashboard-toast.success { border-left: 4px solid #10b981; }
        .dashboard-toast.warning { border-left: 4px solid #f59e0b; }
        .dashboard-toast.error { border-left: 4px solid #ef4444; }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .dashboard-container-full { background: #0f172a; height: 100%; color: white; display: flex; flex-direction: column; overflow: hidden; }
        .dashboard-main-scroll { flex: 1; overflow-y: auto; padding: 24px; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        /* Layout matching Sales page */
        .pos-container { 
          display: grid; 
          grid-template-columns: 1fr; 
          height: 100vh; 
          background: #0f172a; 
          overflow: hidden;
        }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .stat-card { background: #1e293b; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 15px; position: relative; }
        .stat-card.clickable { cursor: pointer; transition: all 0.2s; }
        .stat-card.clickable:hover { transform: translateY(-5px); border-color: #38bdf8; background: #243147; }
        
        .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-box.sm { width: 36px; height: 36px; border-radius: 8px; }
        .icon-box.blue { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
        .icon-box.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .icon-box.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 13px; color: #94a3b8; font-weight: 600; }
        .stat-value { font-size: 24px; font-weight: 800; color: #f1f5f9; }
        .stat-sub { font-size: 11px; color: #64748b; }

        .dashboard-content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; min-height: 0; }
        .main-card { background: #1e293b; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; overflow: hidden; }
        .side-card { background: #1e293b; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); height: fit-content; }
        
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; flex-shrink: 0; }
        .card-header h3 { margin: 0; font-size: 17px; font-weight: 700; }
        
        .dashboard-search-box { display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.5); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); width: 200px; color: #64748b; }
        .dashboard-search-box input { background: transparent; border: none; color: white; font-size: 12px; outline: none; width: 100%; }
        .dashboard-search-box:focus-within { border-color: #38bdf8; color: #38bdf8; }

        .recent-orders-list { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          max-height: 450px; 
          overflow-y: auto; 
          padding-right: 8px;
        }
        .recent-orders-list::-webkit-scrollbar { width: 4px; }
        .recent-orders-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .order-item { background: rgba(15, 23, 42, 0.3); padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 15px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
        .order-item:hover { background: rgba(56, 189, 248, 0.05); border-color: rgba(56, 189, 248, 0.2); }
        .order-main { flex: 1; }
        .order-code { font-weight: 700; font-size: 14px; color: #f1f5f9; }
        .order-time { font-size: 12px; color: #64748b; margin-top: 2px; }
        .order-meta { text-align: right; }
        .order-method { font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: 700; }
        .order-amount { font-weight: 800; font-size: 15px; color: #f1f5f9; margin-top: 2px; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: #475569; gap: 15px; text-align: center; }
        
        .side-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .dashboard-info-list { display: flex; flex-direction: column; gap: 16px; }
        .dashboard-info-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dashboard-info-item span { color: #94a3b8; font-size: 14px; }
        .dashboard-info-item strong { color: #f1f5f9; font-size: 14px; }

        .pos-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px; }
        .detail-modal { background: #1e293b; border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; }
        .close-btn { background: transparent; border: none; color: #64748b; cursor: pointer; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        
        .modal-body { flex: 1; overflow-y: auto; padding: 24px; }
        .order-summary-box { background: rgba(15, 23, 42, 0.4); padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #94a3b8; }
        .summary-row strong { color: #f1f5f9; }
        .badge-method { background: #38bdf8; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
        
        .detail-section { margin-bottom: 24px; }
        .detail-section .section-title { font-size: 14px; font-weight: 800; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-item { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: grid; grid-template-areas: "name price" "sub price"; }
        .item-name { grid-area: name; font-weight: 700; color: #f1f5f9; font-size: 14px; }
        .item-sub { grid-area: sub; font-size: 12px; color: #64748b; margin-top: 2px; }
        .item-price { grid-area: price; display: flex; align-items: center; justify-content: flex-end; font-weight: 800; color: #f1f5f9; }
        
        .breakdown-list { display: flex; flex-direction: column; gap: 12px; }
        .breakdown-item { background: rgba(15, 23, 42, 0.4); padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.03); }
        .breakdown-item .item-name { font-weight: 700; color: #f1f5f9; }
        .breakdown-item .item-qty-badge { background: #f97316; color: white; padding: 4px 12px; border-radius: 100px; font-size: 13px; font-weight: 800; }
        .item-amount-text { font-weight: 800; font-size: 16px; color: #38bdf8; }
        .modal-footer { padding: 20px 24px; background: rgba(15, 23, 42, 0.4); border-top: 1px solid rgba(255,255,255,0.05); border-radius: 0 0 20px 20px; display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 14px; font-weight: 800; color: #94a3b8; }
        .total-amount { font-size: 24px; font-weight: 900; color: #38bdf8; }

        .reprint-btn { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          background: rgba(56, 189, 248, 0.1); 
          border: 1px solid rgba(56, 189, 248, 0.2); 
          color: #38bdf8; 
          padding: 6px 14px; 
          border-radius: 8px; 
          font-size: 11px; 
          font-weight: 800; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .reprint-btn:hover:not(:disabled) { background: #38bdf8; color: #0f172a; }
        .reprint-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;
