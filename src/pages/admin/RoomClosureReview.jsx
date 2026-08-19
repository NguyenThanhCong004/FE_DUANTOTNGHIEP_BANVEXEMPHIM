import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiFetch } from '../../utils/apiClient';
import { ROOMS, ROOM_CLOSURE } from '../../constants/apiEndpoints';
import { apiMessage, MESSAGES } from '../../utils/uiMessages';

const RoomClosureReview = () => {
  const { id } = useParams();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith('/super-admin');
  const prefix = isSuperAdmin ? '/super-admin' : '/admin';
  const { showToast, ToastComponent } = useAdminToast();

  const [room, setRoom] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsByOrder, setSuggestionsByOrder] = useState({});
  const [loadingSuggestionsFor, setLoadingSuggestionsFor] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomRes, ordersRes] = await Promise.all([
        apiFetch(ROOMS.BY_ID(id)),
        apiFetch(ROOM_CLOSURE.AFFECTED_ORDERS(id)),
      ]);
      const roomJson = await roomRes.json().catch(() => null);
      const ordersJson = await ordersRes.json().catch(() => null);
      setRoom(roomJson?.data ?? null);
      setOrders(Array.isArray(ordersJson?.data) ? ordersJson.data : []);
    } catch {
      showToast(MESSAGES.networkError, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSuggestions = async (orderId) => {
    setLoadingSuggestionsFor(orderId);
    try {
      const res = await apiFetch(ROOM_CLOSURE.SUGGESTIONS(id, orderId));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(apiMessage(json, 'Không lấy được gợi ý suất thay thế'), 'error');
        return;
      }
      setSuggestionsByOrder((prev) => ({ ...prev, [orderId]: Array.isArray(json?.data) ? json.data : [] }));
    } catch {
      showToast(MESSAGES.networkError, 'error');
    } finally {
      setLoadingSuggestionsFor(null);
    }
  };

  const confirmMove = async (orderId, targetShowtimeId) => {
    if (busyOrderId) return;
    setBusyOrderId(orderId);
    try {
      const res = await apiFetch(ROOM_CLOSURE.MOVE(id, orderId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetShowtimeId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(apiMessage(json, 'Dời vé thất bại'), 'error');
        return;
      }
      showToast('Đã dời vé sang suất chiếu mới và gửi email cho khách hàng');
      setOrders((prev) => prev.filter((o) => o.orderOnlineId !== orderId));
    } catch {
      showToast(MESSAGES.networkError, 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (busyOrderId) return;
    if (!window.confirm('Xác nhận hủy đơn này? Khách sẽ nhận email hướng dẫn đến quầy vé để nhận hoàn tiền trực tiếp.')) return;
    setBusyOrderId(orderId);
    try {
      const res = await apiFetch(ROOM_CLOSURE.CANCEL(id, orderId), { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(apiMessage(json, 'Hủy đơn thất bại'), 'error');
        return;
      }
      showToast('Đã hủy đơn và gửi email cho khách hàng');
      setOrders((prev) => prev.filter((o) => o.orderOnlineId !== orderId));
    } catch {
      showToast(MESSAGES.networkError, 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header mb-4">
        <div className="admin-header-content d-flex justify-content-between align-items-center flex-nowrap w-100">
          <div>
            <h1 className="h3 mb-1">Xử lý dời vé — phòng đóng tạm thời</h1>
            {room ? (
              <p className="text-muted mb-0 small">
                Phòng <strong>{room.name}</strong>
                {room.closeReason ? <> &middot; Lý do: {room.closeReason}</> : null}
              </p>
            ) : null}
          </div>
          <Link to={`${prefix}/rooms`} className="admin-btn admin-btn-outline">
            Quay lại danh sách phòng
          </Link>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>Đơn hàng bị ảnh hưởng ({orders.length})</h4>
        </div>
        <div className="admin-card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Đang tải dữ liệu...
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">
              <h5 className="mb-2">Không còn đơn nào cần xử lý</h5>
              <p className="mb-0">Tất cả vé của phòng này đã được dời sang suất khác hoặc hủy.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.orderOnlineId} className="admin-card mb-3" style={{ boxShadow: 'none', border: '1px solid #eee' }}>
                <div className="admin-card-body">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="fw-bold">Đơn {order.orderCode}</div>
                      <div className="text-muted small">
                        {order.customerName} {order.customerPhone ? `· ${order.customerPhone}` : ''} {order.customerEmail ? `· ${order.customerEmail}` : ''}
                      </div>
                    </div>
                    <div className="fw-bold">{Number(order.finalAmount || 0).toLocaleString('vi-VN')} đ</div>
                  </div>

                  <table className="admin-table mb-3">
                    <thead>
                      <tr>
                        <th>Phim</th>
                        <th>Suất chiếu hiện tại</th>
                        <th>Ghế</th>
                        <th>Loại ghế</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.tickets || []).map((t) => (
                        <tr key={t.ticketId}>
                          <td>{t.movieTitle}</td>
                          <td>{t.showtimeStart}</td>
                          <td>{t.seatLabel}</td>
                          <td>{t.seatTypeName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!suggestionsByOrder[order.orderOnlineId] ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      disabled={loadingSuggestionsFor === order.orderOnlineId}
                      onClick={() => loadSuggestions(order.orderOnlineId)}
                    >
                      {loadingSuggestionsFor === order.orderOnlineId ? 'Đang tìm...' : 'Xem suất thay thế'}
                    </button>
                  ) : suggestionsByOrder[order.orderOnlineId].length === 0 ? (
                    <div className="alert alert-warning py-2 small mb-0">
                      Không tìm được suất chiếu nào còn đủ ghế đúng loại để dời đơn này.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mb-3">
                      {suggestionsByOrder[order.orderOnlineId].map((sug) => (
                        <div key={sug.showtimeId} className="d-flex justify-content-between align-items-center border rounded p-2 flex-wrap gap-2">
                          <div className="small">
                            <div className="fw-semibold">{sug.movieTitle} &middot; {sug.startTime}</div>
                            <div className="text-muted">
                              Phòng {sug.roomName} &middot; Ghế mới: {(sug.plannedSeats || []).map((p) => p.seatLabel).join(', ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-success"
                            disabled={busyOrderId === order.orderOnlineId}
                            onClick={() => confirmMove(order.orderOnlineId, sug.showtimeId)}
                          >
                            {busyOrderId === order.orderOnlineId ? 'Đang xử lý...' : 'Xác nhận dời'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestionsByOrder[order.orderOnlineId] && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger mt-2"
                      disabled={busyOrderId === order.orderOnlineId}
                      onClick={() => cancelOrder(order.orderOnlineId)}
                    >
                      Hủy đơn &amp; hoàn tiền tại quầy
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ToastComponent />
    </div>
  );
};

export default RoomClosureReview;
