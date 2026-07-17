import React from "react";
import { Modal } from "react-bootstrap";
import { apiUrl } from "../../utils/apiClient";
import { TICKET_ORDERS } from "../../constants/apiEndpoints";
import { formatVnd } from "../../utils/formatters";

function ticketQrSrc(item) {
  const token = item?.qr_token || item?.qrToken;
  return token ? apiUrl(TICKET_ORDERS.QR(token)) : "";
}

/** Popup hiển thị vé (dùng chung cho trang thanh toán thành công và lịch sử giao dịch). */
export default function TicketPopup({ show, onHide, transaction }) {
  if (!transaction) return null;

  const items = transaction.items || [];
  const qrItems = items.filter((item) => ticketQrSrc(item));
  const qrLeadItem = qrItems[0] || null;
  const seatLabels = [...new Set(qrItems.map((item) => item.seat_label || item.sub).filter(Boolean))];
  const first = items[0];

  const rows = [
    first?.cinema_name ? ["Rạp", first.cinema_name] : null,
    first?.room_name ? ["Phòng chiếu", first.room_name] : null,
    (first?.show_date || first?.show_time) ? ["Suất chiếu", [first?.show_date, first?.show_time].filter(Boolean).join(" ")] : null,
    ["Ghế", seatLabels.length ? seatLabels.join(", ") : "—"],
    ["Mã đơn", transaction.order_code || "—"],
  ].filter(Boolean);

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="ticket-popup-content">
      <style>{`
        .ticket-popup-content {
          background: #0d0e28;
          color: #f0f0ff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
        }
        .ticket-popup-content .btn-close { filter: invert(1) grayscale(1) brightness(1.6); }
      `}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: "#f0f0ff" }}>Vé của bạn</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center pt-2">
        {first?.movie_poster ? (
          <img
            src={first.movie_poster}
            alt={first.label || ""}
            style={{ width: 100, borderRadius: 12, objectFit: "cover", marginBottom: 12 }}
          />
        ) : null}
        <h5 className="fw-bold mb-3" style={{ color: "#f0f0ff" }}>{first?.label || "Đơn hàng"}</h5>

        {qrLeadItem ? (
          <>
            <img
              src={ticketQrSrc(qrLeadItem)}
              alt={`QR vé ${transaction.order_code || ""}`}
              style={{ width: 180, height: 180, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 8 }}
            />
            <div className="small mt-2" style={{ color: "rgba(240,240,255,0.5)" }}>1 QR dùng cho toàn bộ ghế trong đơn này.</div>
          </>
        ) : (
          <div className="small py-3" style={{ color: "rgba(240,240,255,0.5)" }}>Đơn này không có vé kèm mã QR.</div>
        )}

        <div className="mt-3 text-start" style={{ maxWidth: 280, margin: "0 auto" }}>
          {rows.map(([label, value]) => (
            <div key={label} className="d-flex justify-content-between small mb-1">
              <span style={{ color: "rgba(240,240,255,0.5)" }}>{label}</span>
              <strong className="text-end" style={{ color: "#f0f0ff" }}>{value}</strong>
            </div>
          ))}
          <div className="d-flex justify-content-between small">
            <span style={{ color: "rgba(240,240,255,0.5)" }}>Tổng tiền</span>
            <strong style={{ color: "#d4ff00" }}>{formatVnd(transaction.final_amount)}</strong>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
