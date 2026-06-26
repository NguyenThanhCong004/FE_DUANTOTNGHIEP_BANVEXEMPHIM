import React from "react";
import { formatDate, formatDateTime, formatTime, formatVnd } from "../../utils/formatters";

const emptyText = "—";

function asNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function getStatusLabel(status) {
  if (status === 0 || status === "pending") return "Chờ thanh toán";
  if (status === 2 || status === "cancelled") return "Đã hủy";
  if (status === 1 || status === "completed" || status === "paid") return "Đã thanh toán";
  return "Không xác định";
}

function getStatusStyle(status) {
  if (status === 0 || status === "pending") {
    return { color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a" };
  }
  if (status === 2 || status === "cancelled") {
    return { color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca" };
  }
  if (status === 1 || status === "completed" || status === "paid") {
    return { color: "#065f46", background: "#d1fae5", border: "1px solid #a7f3d0" };
  }
  return { color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0" };
}

function getPaymentLabel(method) {
  if (method === "CASH") return "Tiền mặt";
  if (method === "TRANSFER") return "Chuyển khoản";
  if (method === "PAYOS") return "PayOS";
  return method || emptyText;
}

function getTicketPrice(ticket) {
  return asNumber(ticket.price ?? ticket.finalPrice ?? ticket.displayPrice);
}

function getTicketOriginalPrice(ticket) {
  return asNumber(ticket.originalPrice ?? ticket.price ?? ticket.finalPrice);
}

function groupTicketsByType(tickets) {
  const groups = new Map();
  tickets.forEach((ticket) => {
    const typeName = ticket.seatTypeName || ticket.typeName || "Chưa có loại";
    const current = groups.get(typeName) || {
      typeName,
      seatNumbers: [],
      count: 0,
      originalTotal: 0,
      discountTotal: 0,
      total: 0,
    };
    current.count += 1;
    if (ticket.seatNumber) current.seatNumbers.push(ticket.seatNumber);
    current.originalTotal += getTicketOriginalPrice(ticket);
    current.discountTotal += asNumber(ticket.promotionDiscount);
    current.total += getTicketPrice(ticket);
    groups.set(typeName, current);
  });
  return Array.from(groups.values());
}

const sectionStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
};

const labelStyle = { color: "#64748b" };
const textStyle = { color: "#0f172a" };

function InfoRow({ label, value, valueClassName = "" }) {
  return (
    <div className="d-flex justify-content-between gap-3 small">
      <span style={labelStyle}>{label}</span>
      <span className={`fw-semibold text-end ${valueClassName}`} style={textStyle}>
        {value || emptyText}
      </span>
    </div>
  );
}

export default function InvoiceSummaryCard({ order, title = "Chi tiết hóa đơn", eyebrow = "Hóa đơn", className = "" }) {
  const data = order || {};
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  const foods = Array.isArray(data.foods) ? data.foods : [];
  const firstTicket = tickets[0] || {};

  const ticketGroups = groupTicketsByType(tickets);
  const ticketTotal = tickets.reduce((sum, ticket) => sum + getTicketPrice(ticket), 0);
  const ticketOriginalTotal = tickets.reduce((sum, ticket) => sum + getTicketOriginalPrice(ticket), 0);
  const promotionDiscountTotal = ticketGroups.reduce((sum, group) => sum + group.discountTotal, 0);
  const foodTotal = foods.reduce((sum, food) => sum + asNumber(food.price) * asNumber(food.quantity || 1), 0);
  const subtotalBeforeVoucher = data.originalAmount != null ? asNumber(data.originalAmount) : ticketTotal + foodTotal;
  const voucherDiscountAmount = asNumber(data.discountAmount);
  const finalAmount = data.finalAmount != null
    ? asNumber(data.finalAmount)
    : Math.max(0, subtotalBeforeVoucher - voucherDiscountAmount);
  const showtimeValue = firstTicket.showtime || firstTicket.showtimeStart || firstTicket.startTime;
  const orderCode = data.orderCode || `#${data.id || emptyText}`;
  const voucherLabel = data.voucherCode ? `Giảm voucher (${data.voucherCode})` : "Giảm voucher";

  return (
    <div
      className={className}
      style={{
        background: "#ffffff",
        border: "1px solid #dbe4ef",
        borderRadius: 14,
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
        color: "#0f172a",
        padding: 24,
      }}
    >
      <div className="d-flex align-items-start justify-content-between gap-3 pb-3 mb-3 border-bottom">
        <div>
          <div className="small text-uppercase fw-bold mb-1" style={{ color: "#64748b", letterSpacing: 0 }}>
            {eyebrow}
          </div>
          <h4 className="fw-black m-0" style={textStyle}>
            {title}
          </h4>
          <div className="small mt-1" style={labelStyle}>
            Mã đơn: <span className="fw-bold" style={textStyle}>{orderCode}</span>
          </div>
        </div>
        <span className="badge rounded-pill px-3 py-2" style={getStatusStyle(data.status)}>
          {getStatusLabel(data.status)}
        </span>
      </div>

      <div className="d-flex flex-column gap-3">
        <section style={sectionStyle}>
          <div className="fw-bold mb-3" style={textStyle}>Thông tin đơn hàng</div>
          <div className="row g-3">
            <div className="col-md-6">
              <InfoRow label="Mã hóa đơn" value={orderCode} />
            </div>
            <div className="col-md-6">
              <InfoRow label="Ngày tạo" value={formatDateTime(data.createdAt)} />
            </div>
            <div className="col-md-6">
              <InfoRow label="Thanh toán" value={getPaymentLabel(data.paymentMethod)} />
            </div>
            <div className="col-md-6">
              <InfoRow label="Nhân viên" value={data.staffName || "Đặt Online"} />
            </div>
            <div className="col-md-6">
              <InfoRow label="Rạp" value={data.cinemaName} />
            </div>
            <div className="col-md-6">
              <InfoRow label="Địa chỉ rạp" value={data.cinemaAddress} />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div className="fw-bold mb-3" style={textStyle}>Thông tin khách hàng</div>
          <div className="row g-3">
            <div className="col-md-4">
              <InfoRow label="Khách hàng" value={data.customerName} />
            </div>
            <div className="col-md-4">
              <InfoRow label="Email" value={data.customerEmail} />
            </div>
            <div className="col-md-4">
              <InfoRow label="Số điện thoại" value={data.customerPhone} />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div className="small fw-bold text-uppercase mb-1" style={{ color: "#64748b", letterSpacing: 0 }}>
            {tickets.length ? "Phim" : "Đơn hàng"}
          </div>
          <div className="fw-bold lh-sm" style={textStyle}>
            {firstTicket.movieTitle || (foods.length ? "Bắp nước / Combo" : "Đơn online")}
          </div>
          <div className="row g-3 mt-1">
            <div className="col-6 col-md-3">
              <div className="small" style={labelStyle}>Ngày chiếu</div>
              <div className="fw-bold small" style={textStyle}>
                {showtimeValue ? formatDate(showtimeValue) : emptyText}
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="small" style={labelStyle}>Giờ chiếu</div>
              <div className="fw-bold small" style={textStyle}>
                {showtimeValue ? formatTime(showtimeValue) : emptyText}
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="small" style={labelStyle}>Phòng</div>
              <div className="fw-bold small text-truncate" style={textStyle}>{firstTicket.roomName || emptyText}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="small" style={labelStyle}>Số vé</div>
              <div className="fw-bold small" style={textStyle}>{tickets.length}</div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
            <div className="fw-bold" style={textStyle}>Chi tiết vé</div>
            <span className="small fw-bold" style={{ color: tickets.length ? "#047857" : "#64748b" }}>
              {tickets.length ? `${tickets.length} vé` : "Không có vé"}
            </span>
          </div>

          {tickets.length ? (
            <>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr className="small">
                      <th>Loại ghế</th>
                      <th>Ghế</th>
                      <th className="text-center">SL</th>
                      <th className="text-end">Giá gốc</th>
                      <th className="text-end">Khuyến mãi</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketGroups.map((group) => {
                      const seats = group.seatNumbers.length ? group.seatNumbers.join(", ") : emptyText;
                      return (
                        <tr key={group.typeName}>
                          <td className="fw-semibold">{group.typeName}</td>
                          <td>
                            <span className="small" style={textStyle}>{seats}</span>
                          </td>
                          <td className="text-center fw-bold">{group.count}</td>
                          <td className="text-end">{formatVnd(group.originalTotal)}</td>
                          <td className="text-end text-success">
                            {group.discountTotal > 0 ? `-${formatVnd(group.discountTotal)}` : emptyText}
                          </td>
                          <td className="text-end fw-bold">{formatVnd(group.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="small rounded-3 p-3 text-center" style={{ color: "#64748b", background: "#fff" }}>
              Hóa đơn này không kèm vé xem phim.
            </div>
          )}

        </section>

        <section style={sectionStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="fw-bold" style={textStyle}>Bắp nước / Combo</div>
            <div className="fw-bold small" style={textStyle}>{formatVnd(foodTotal)}</div>
          </div>
          {foods.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="small">
                    <th>Sản phẩm</th>
                    <th className="text-center">SL</th>
                    <th className="text-end">Đơn giá</th>
                    <th className="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((item, index) => {
                    const quantity = asNumber(item.quantity || 1);
                    const price = asNumber(item.price);
                    return (
                      <tr key={`${item.productName || item.name || "food"}-${index}`}>
                        <td>{item.productName || item.name || "Sản phẩm"}</td>
                        <td className="text-center">{quantity}</td>
                        <td className="text-end">{formatVnd(price)}</td>
                        <td className="text-end fw-bold">{formatVnd(price * quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="small rounded-3 p-3 text-center" style={{ color: "#64748b", background: "#fff" }}>
              Hóa đơn này không kèm bắp nước / combo.
            </div>
          )}
        </section>

        <section style={{ ...sectionStyle, background: "#ffffff" }}>
          <div className="d-flex justify-content-between small mb-2" style={labelStyle}>
            <span>Tổng vé trước khuyến mãi</span>
            <span className="fw-bold" style={textStyle}>{formatVnd(ticketOriginalTotal || ticketTotal)}</span>
          </div>
          {promotionDiscountTotal > 0 ? (
            <div className="d-flex justify-content-between small mb-2 text-success">
              <span>Giảm khuyến mãi</span>
              <span className="fw-bold">-{formatVnd(promotionDiscountTotal)}</span>
            </div>
          ) : null}
          <div className="d-flex justify-content-between small mb-2" style={labelStyle}>
            <span>Tổng bắp nước / combo</span>
            <span className="fw-bold" style={textStyle}>{formatVnd(foodTotal)}</span>
          </div>
          <div className="d-flex justify-content-between small mb-2" style={labelStyle}>
            <span>Tạm tính sau khuyến mãi</span>
            <span className="fw-bold" style={textStyle}>{formatVnd(subtotalBeforeVoucher)}</span>
          </div>
          {voucherDiscountAmount > 0 ? (
            <div className="d-flex justify-content-between small mb-2 text-success">
              <span>{voucherLabel}</span>
              <span className="fw-bold">-{formatVnd(voucherDiscountAmount)}</span>
            </div>
          ) : null}
          <div className="d-flex justify-content-between align-items-end gap-3 pt-3 mt-3 border-top">
            <span className="small fw-bold text-uppercase" style={{ color: "#334155", letterSpacing: 0 }}>
              Tổng thanh toán
            </span>
            <h3 className="fw-black m-0 text-end" style={{ color: "#dc2626" }}>
              {formatVnd(finalAmount)}
            </h3>
          </div>
        </section>
      </div>
    </div>
  );
}
