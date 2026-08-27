import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { FOOD_ORDERS, TICKET_ORDERS, ME } from "../../constants/apiEndpoints";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { getAccessToken } from "../../utils/authStorage";
import { mapMeTransactionToFe } from "../../utils/customerMeApi";
import TicketPopup from "../../components/common/TicketPopup";

/**
 * PayOS redirect về đây — query thường có orderCode (tuỳ bản PayOS).
 * Trang này xác nhận lại với BE để local/LAN vẫn chốt đơn nếu webhook PayOS không gọi được.
 */
const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const queryOrderCode =
    params.get("orderCode") ||
    params.get("order_code") ||
    params.get("id") ||
    null;
  const [displayOrderCode, setDisplayOrderCode] = useState(queryOrderCode);
  const [confirmNote, setConfirmNote] = useState("Đang xác nhận thanh toán với PayOS...");
  const [confirmDone, setConfirmDone] = useState(false);
  const [ticketTx, setTicketTx] = useState(null);
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const queryOrderId = params.get("orderId") || null;
  const appScheme = params.get("scheme");

  // Trang này được mở trong trình duyệt trong app mobile (không phải app tự nhận diện URL trả
  // về được) — nếu có `scheme` (deep link app kèm theo lúc tạo returnUrl), tự điều hướng lại vào
  // app gần như ngay lập tức, không cần dừng lại ở trang web. PayOS chỉ tự redirect đáng tin cậy
  // tới URL http/https nên vẫn phải qua trang này, nhưng chỉ thoáng qua rồi chuyển thẳng vào app.
  useEffect(() => {
    if (!appScheme) return;
    const timer = setTimeout(() => {
      window.location.href = decodeURIComponent(appScheme);
    }, 300);
    return () => clearTimeout(timer);
  }, [appScheme]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        let storedCode = null;
        let kind = "ticket";
        try {
          storedCode = sessionStorage.getItem("payos_pending_order_code");
          kind = sessionStorage.getItem("payos_pending_kind") || "ticket";
        } catch {
          /* ignore */
        }

        const codeStr = storedCode || queryOrderCode;
        if (alive) setDisplayOrderCode(codeStr || null);
        if (!codeStr) {
          if (alive) {
            setConfirmNote(params.get("free") ? "Đơn miễn phí đã được xác nhận." : "Không tìm thấy mã PayOS để xác nhận tự động.");
          }
          return;
        }

        const code = Number(codeStr);
        if (!Number.isFinite(code) || code <= 0) {
          if (alive) {
            setConfirmNote("Mã PayOS không hợp lệ, vui lòng kiểm tra lại lịch sử giao dịch.");
          }
          return;
        }

        if (!getAccessToken()) {
          if (alive) {
            setConfirmNote("Bạn chưa đăng nhập nên hệ thống chưa thể xác nhận và cộng điểm tự động.");
          }
          return;
        }

        const path = kind === "food" ? FOOD_ORDERS.CONFIRM_PAYOS : TICKET_ORDERS.CONFIRM_PAYOS;
        let clearPendingStorage = false;
        try {
          const res = await apiFetch(path, {
            method: "POST",
            body: JSON.stringify({ payosOrderCode: code }),
          });
          const body = await res.json().catch(() => null);
          if (alive) {
            if (res.ok) {
              clearPendingStorage = true;
              setConfirmNote("Đã xác nhận thanh toán và cộng điểm cho tài khoản.");
            } else {
              setConfirmNote(body?.message || "Chưa xác nhận được thanh toán. Vui lòng thử lại sau vài giây.");
            }
          }
        } catch {
          if (alive) {
            setConfirmNote("Không kết nối được máy chủ để xác nhận thanh toán.");
          }
        } finally {
          if (clearPendingStorage) {
            try {
              sessionStorage.removeItem("payos_pending_order_code");
              sessionStorage.removeItem("payos_pending_kind");
            } catch {
              /* ignore */
            }
          }
        }
      } finally {
        if (alive) setConfirmDone(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [queryOrderCode, params]);

  // Sau khi xác nhận xong, lấy vé vừa mua để hiện popup vé.
  useEffect(() => {
    if (!confirmDone || !getAccessToken()) return;
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(withQuery(ME.TRANSACTIONS, { search: displayOrderCode || "" }));
        const body = await res.json().catch(() => null);
        if (!alive || !res.ok) return;
        const list = Array.isArray(body?.data) ? body.data : [];
        const match =
          (queryOrderId && list.find((row) => String(row.id) === String(queryOrderId))) ||
          (displayOrderCode && list.find((row) => String(row.orderCode) === String(displayOrderCode))) ||
          list[0] ||
          null;
        if (match) setTicketTx(mapMeTransactionToFe(match));
      } catch {
        /* ignore — vé vẫn xem được trong lịch sử giao dịch */
      }
    })();
    return () => {
      alive = false;
    };
  }, [confirmDone, displayOrderCode, queryOrderId]);

  useEffect(() => {
    if (ticketTx) setShowTicketPopup(true);
  }, [ticketTx]);

  return (
    <Layout>
      <div
        className="container py-5 d-flex align-items-center justify-content-center"
        style={{ minHeight: "70vh" }}
      >
        <div
          className="card border-0 shadow-lg text-center p-5 rounded-5"
          style={{ maxWidth: "520px" }}
        >
          <div className="mb-4">
            <div className="bg-success bg-opacity-10 d-inline-block p-4 rounded-circle">
              <i className="fas fa-check-circle fa-5x text-success" />
            </div>
          </div>
          <h2 className="fw-bold mb-3">Thanh toán thành công</h2>
          <p className="text-muted mb-4">
            Giao dịch đã được ghi nhận. Hệ thống đang đồng bộ trạng thái thanh toán, vé và/hoặc đơn bắp nước của bạn.
          </p>
          {confirmNote ? <p className="text-muted mb-4">{confirmNote}</p> : null}
          {appScheme ? <p className="text-muted mb-4">Đang tự động quay lại ứng dụng…</p> : null}
          {displayOrderCode ? (
            <div className="bg-light p-3 rounded-4 mb-3 border border-dashed">
              <small className="text-uppercase text-muted fw-bold">Mã giao dịch / đơn</small>
              <h4 className="fw-bold text-dark mt-1 mb-0 text-break">{displayOrderCode}</h4>
            </div>
          ) : null}
          <div className="d-grid gap-2">
            {ticketTx ? (
              <>
                <button
                  type="button"
                  className="btn btn-gradient rounded-pill py-3 fw-bold shadow"
                  onClick={() => setShowTicketPopup(true)}
                >
                  XEM VÉ CỦA TÔI
                </button>
                <Link to="/" className="btn btn-outline-secondary rounded-pill py-2 fw-bold border-0">
                  Về trang chủ
                </Link>
              </>
            ) : (
              <Link to="/" className="btn btn-gradient rounded-pill py-3 fw-bold shadow">
                VỀ TRANG CHỦ
              </Link>
            )}
            <Link to="/profile" className="btn btn-outline-secondary rounded-pill py-2 fw-bold border-0">
              Hồ sơ
            </Link>
          </div>
        </div>
      </div>
      <TicketPopup show={showTicketPopup} onHide={() => setShowTicketPopup(false)} transaction={ticketTx} />
    </Layout>
  );
};

export default PaymentSuccess;
