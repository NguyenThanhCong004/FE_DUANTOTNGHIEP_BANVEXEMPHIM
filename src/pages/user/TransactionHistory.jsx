import { useState } from "react";
import Layout from "../../components/layout/Layout";
import { Container, Row, Col } from "react-bootstrap";

/* ══════════════════════════════════════
   MOCK DATA — based on ERD tables
   Orders, Orders_online, Tickets,
   OderDetails_food, PointsHistories
══════════════════════════════════════ */
const MOCK_TRANSACTIONS = [
  {
    id: "TXN-001",
    type: "ticket_online",       // Orders_online
    order_code: "ONL-20250318-001",
    created_at: "2025-03-18T14:30:00",
    status: "completed",
    original_amount: 180000,
    discount_amount: 20000,
    final_amount: 160000,
    voucher_code: "SAVE20",
    items: [
      { label: "MAI — Ghế A5, A6", sub: "Phòng 1 · 15:30 · 18/03", icon: "🎬", qty: 2, price: 90000 },
    ],
    points_earned: 160,
  },
  {
    id: "TXN-002",
    type: "food",                // Orders (tại rạp)
    order_code: "POS-20250318-042",
    created_at: "2025-03-18T15:15:00",
    status: "completed",
    original_amount: 125000,
    discount_amount: 0,
    final_amount: 125000,
    voucher_code: null,
    items: [
      { label: "Combo Đôi Bạn", sub: "1 Bắp lớn + 2 Nước", icon: "🍿", qty: 1, price: 125000 },
    ],
    points_earned: 125,
  },
  {
    id: "TXN-003",
    type: "ticket_online",
    order_code: "ONL-20250310-007",
    created_at: "2025-03-10T10:00:00",
    status: "completed",
    original_amount: 270000,
    discount_amount: 0,
    final_amount: 270000,
    voucher_code: null,
    items: [
      { label: "DUNE 2 — Ghế C3, C4, C5", sub: "Phòng VIP · 19:00 · 10/03", icon: "🎬", qty: 3, price: 90000 },
    ],
    points_earned: 270,
  },
  {
    id: "TXN-004",
    type: "points",              // PointsHistories — redeem voucher
    order_code: "PTS-20250308-003",
    created_at: "2025-03-08T09:00:00",
    status: "completed",
    original_amount: 0,
    discount_amount: 0,
    final_amount: -500,          // negative = points spent
    voucher_code: "SAVE20PCT",
    items: [
      { label: "Đổi voucher SAVE20PCT", sub: "Trừ 500 điểm tích lũy", icon: "⭐", qty: 1, price: -500 },
    ],
    points_earned: -500,
  },
  {
    id: "TXN-005",
    type: "ticket_online",
    order_code: "ONL-20250301-015",
    created_at: "2025-03-01T20:45:00",
    status: "cancelled",
    original_amount: 180000,
    discount_amount: 0,
    final_amount: 180000,
    voucher_code: null,
    items: [
      { label: "KUNG FU PANDA 4 — Ghế B7, B8", sub: "Phòng 2 · 21:00 · 01/03", icon: "🎬", qty: 2, price: 90000 },
    ],
    points_earned: 0,
  },
  {
    id: "TXN-006",
    type: "food",
    order_code: "POS-20250225-089",
    created_at: "2025-02-25T18:20:00",
    status: "completed",
    original_amount: 85000,
    discount_amount: 10000,
    final_amount: 75000,
    voucher_code: "FILM10K",
    items: [
      { label: "Combo Hoạt Hình", sub: "1 Bắp lớn + 1 Nước lớn", icon: "🍿", qty: 1, price: 85000 },
    ],
    points_earned: 75,
  },
  {
    id: "TXN-007",
    type: "points",
    order_code: "PTS-20250220-001",
    created_at: "2025-02-20T12:00:00",
    status: "completed",
    original_amount: 0,
    discount_amount: 0,
    final_amount: 270,          // positive = points earned from order
    voucher_code: null,
    items: [
      { label: "Điểm thưởng từ đơn hàng ONL-20250310-007", sub: "+270 điểm tích lũy", icon: "⭐", qty: 1, price: 270 },
    ],
    points_earned: 270,
  },
  {
    id: "TXN-008",
    type: "ticket_online",
    order_code: "ONL-20250115-003",
    created_at: "2025-01-15T11:30:00",
    status: "completed",
    original_amount: 200000,
    discount_amount: 50000,
    final_amount: 150000,
    voucher_code: "VIP50K",
    items: [
      { label: "AVENGERS — Ghế D1, D2", sub: "Phòng IMAX · 13:00 · 15/01", icon: "🎬", qty: 2, price: 100000 },
    ],
    points_earned: 150,
  },
];

const TYPE_CONFIG = {
  ticket_online: { label: "Vé Online",   color: "#7b1fa2", bg: "rgba(123,31,162,0.12)", icon: "🎫" },
  food:          { label: "Bắp & Nước",  color: "#e91e8c", bg: "rgba(233,30,140,0.12)", icon: "🍿" },
  points:        { label: "Điểm",        color: "#d4e219", bg: "rgba(212,226,25,0.12)",  icon: "⭐" },
};

const STATUS_CONFIG = {
  completed: { label: "Hoàn thành", color: "#81c784", bg: "rgba(76,175,80,0.12)" },
  cancelled: { label: "Đã hủy",     color: "#e57373", bg: "rgba(244,67,54,0.12)" },
  pending:   { label: "Chờ xử lý",  color: "#d4e219", bg: "rgba(212,226,25,0.12)" },
};

const fmt     = (n) => Math.abs(n).toLocaleString("vi-VN") + "đ";
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/* ══ Detail Modal ══ */
function DetailModal({ tx, onClose }) {
  if (!tx) return null;
  const tc = TYPE_CONFIG[tx.type];
  const sc = STATUS_CONFIG[tx.status];
  return (
    <div className="th-overlay" onClick={onClose}>
      <div className="th-modal" onClick={e => e.stopPropagation()}>
        <button className="th-modal-close" onClick={onClose}>×</button>

        {/* Header */}
        <div className="th-modal-header">
          <span className="th-modal-icon">{tc.icon}</span>
          <div>
            <div className="th-modal-title">CHI TIẾT GIAO DỊCH</div>
            <div className="th-modal-code">{tx.order_code}</div>
          </div>
          <span className="th-status-badge" style={{ background: sc.bg, color: sc.color, borderColor: `${sc.color}40` }}>
            {sc.label}
          </span>
        </div>

        <div className="th-modal-divider" />

        {/* Items */}
        <div className="th-modal-items">
          {tx.items.map((item, i) => (
            <div key={i} className="th-modal-item">
              <span className="th-mi-icon">{item.icon}</span>
              <div className="th-mi-info">
                <div className="th-mi-name">{item.label}</div>
                <div className="th-mi-sub">{item.sub}</div>
              </div>
              <div className="th-mi-price">
                {tx.type === "points"
                  ? <span style={{ color: item.price > 0 ? "#81c784" : "#e57373" }}>
                      {item.price > 0 ? "+" : ""}{item.price.toLocaleString()} pts
                    </span>
                  : fmt(item.price * item.qty)
                }
              </div>
            </div>
          ))}
        </div>

        <div className="th-modal-divider" />

        {/* Summary */}
        {tx.type !== "points" && (
          <div className="th-modal-summary">
            <div className="th-sum-row">
              <span>Tạm tính</span><span>{fmt(tx.original_amount)}</span>
            </div>
            {tx.discount_amount > 0 && (
              <div className="th-sum-row discount">
                <span>Giảm giá {tx.voucher_code && <span className="th-voucher-badge">{tx.voucher_code}</span>}</span>
                <span>-{fmt(tx.discount_amount)}</span>
              </div>
            )}
            <div className="th-sum-row total">
              <span>Tổng thanh toán</span>
              <span>{fmt(tx.final_amount)}</span>
            </div>
            {tx.points_earned > 0 && (
              <div className="th-sum-row points-row">
                <span>Điểm tích lũy nhận được</span>
                <span>+{tx.points_earned} pts</span>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="th-modal-meta">
          <div className="th-meta-item"><span>Thời gian</span><span>{fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}</span></div>
          <div className="th-meta-item"><span>Mã giao dịch</span><span className="th-code-mono">{tx.id}</span></div>
          <div className="th-meta-item"><span>Loại</span><span style={{ color: tc.color }}>{tc.label}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══ Main Page ══ */
export default function TransactionHistory() {
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState(null);
  const [expanded,     setExpanded]     = useState(null);

  const filtered = MOCK_TRANSACTIONS.filter(tx => {
    const matchType   = filterType   === "all" || tx.type   === filterType;
    const matchStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchSearch = tx.order_code.toLowerCase().includes(search.toLowerCase()) ||
                        tx.items.some(i => i.label.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  /* Stats */
  const totalSpent  = MOCK_TRANSACTIONS.filter(t => t.status === "completed" && t.type !== "points").reduce((a, t) => a + t.final_amount, 0);
  const totalPts    = MOCK_TRANSACTIONS.filter(t => t.status === "completed").reduce((a, t) => a + (t.points_earned || 0), 0);
  const totalOrders = MOCK_TRANSACTIONS.filter(t => t.status === "completed").length;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --navy:   #2d3151;
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card:   rgba(20,22,50,0.92);
        }

        .th-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 45% at 10% 15%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 80px;
        }

        /* ── TITLE ── */
        .th-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(34px, 5.5vw, 56px);
          letter-spacing: 4px;
          line-height: 1;
          color: #fff;
        }
        .th-title span { color: var(--yellow); }

        /* ── STAT CHIPS ── */
        .th-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .th-stat {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 20px;
          min-width: 110px;
          text-align: center;
        }
        .th-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 1px;
          color: var(--yellow);
          line-height: 1;
          margin-bottom: 3px;
        }
        .th-stat-lbl {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* ── FILTER BAR ── */
        .th-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .th-filter-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 7px 15px;
          border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .th-filter-btn:hover { border-color: var(--yellow); color: var(--yellow); }
        .th-filter-btn.active { background: var(--yellow); border-color: var(--yellow); color: #0f102a; }

        /* ── SEARCH ── */
        .th-search-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0 14px;
          max-width: 280px;
          transition: border-color 0.2s;
        }
        .th-search-wrap:focus-within { border-color: var(--yellow); }
        .th-search-input {
          background: transparent; border: none; outline: none;
          color: #fff; font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 600;
          padding: 10px 0; width: 100%;
        }
        .th-search-input::placeholder { color: rgba(255,255,255,0.25); }

        /* ── TRANSACTION ROW ── */
        .th-row {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          margin-bottom: 10px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .th-row:hover {
          border-color: rgba(212,226,25,0.18);
          box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        .th-row.expanded { border-color: rgba(212,226,25,0.3); }

        .th-row-main {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
        }

        /* type icon circle */
        .th-type-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        /* info block */
        .th-row-info { flex: 1; min-width: 0; }
        .th-row-code {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 2px;
          color: #fff;
          margin-bottom: 3px;
        }
        .th-row-desc {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* date */
        .th-row-date {
          text-align: right;
          flex-shrink: 0;
        }
        .th-row-date-val {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          display: block;
        }
        .th-row-date-time {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          font-weight: 600;
        }

        /* amount */
        .th-row-amount {
          text-align: right;
          flex-shrink: 0;
          min-width: 110px;
        }
        .th-amount-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 1px;
          display: block;
        }
        .th-amount-sub {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* status badge */
        .th-status-badge {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* expand arrow */
        .th-expand-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.2);
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          transition: color 0.2s, transform 0.25s;
          flex-shrink: 0;
        }
        .th-expand-btn.open { transform: rotate(180deg); color: var(--yellow); }

        /* ── EXPANDED DETAIL ── */
        .th-row-detail {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 16px 20px 16px 78px;
          animation: detailFade 0.2s ease;
        }
        @keyframes detailFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .th-detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .th-detail-item:last-child { border-bottom: none; }
        .th-di-icon { font-size: 20px; flex-shrink: 0; }
        .th-di-info { flex: 1; min-width: 0; }
        .th-di-name { font-size: 13px; font-weight: 700; color: #fff; }
        .th-di-sub  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); }
        .th-di-price { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--yellow); letter-spacing: 1px; }

        .th-detail-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap;
          gap: 8px;
        }
        .th-df-left { display: flex; gap: 16px; flex-wrap: wrap; }
        .th-df-item {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
        }
        .th-df-item span { color: rgba(255,255,255,0.6); }
        .th-df-item .voucher { color: var(--yellow); font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; font-size: 13px; }

        .th-see-more {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          color: rgba(255,255,255,0.4);
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 14px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        .th-see-more:hover { border-color: var(--yellow); color: var(--yellow); }

        /* ── EMPTY STATE ── */
        .th-empty {
          text-align: center;
          padding: 80px 20px;
          color: rgba(255,255,255,0.2);
        }
        .th-empty .ei { font-size: 52px; opacity: 0.3; margin-bottom: 12px; }
        .th-empty p { font-size: 13px; font-weight: 600; }

        /* ── MODAL ── */
        .th-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .th-modal {
          background: #0d0e28;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%; max-width: 480px;
          padding: 28px;
          position: relative;
          animation: modalPop 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
        }
        .th-modal::-webkit-scrollbar { width: 4px; }
        .th-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .th-modal-close {
          position: absolute; top: 16px; right: 18px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px; color: rgba(255,255,255,0.45);
          width: 32px; height: 32px; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .th-modal-close:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

        .th-modal-header { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
        .th-modal-icon { font-size: 32px; }
        .th-modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px; letter-spacing: 3px; color: #fff;
        }
        .th-modal-code {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px; letter-spacing: 2px; color: rgba(255,255,255,0.35);
        }
        .th-modal-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }

        .th-modal-items { display: flex; flex-direction: column; gap: 10px; }
        .th-modal-item { display: flex; align-items: center; gap: 10px; }
        .th-mi-icon { font-size: 22px; flex-shrink: 0; }
        .th-mi-info { flex: 1; min-width: 0; }
        .th-mi-name { font-size: 13px; font-weight: 700; color: #fff; }
        .th-mi-sub  { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600; }
        .th-mi-price { font-family: 'Bebas Neue', sans-serif; font-size: 17px; color: var(--yellow); letter-spacing: 1px; }

        .th-modal-summary { display: flex; flex-direction: column; gap: 7px; }
        .th-sum-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.45); }
        .th-sum-row.discount { color: #81c784; }
        .th-sum-row.total { font-size: 16px; color: #fff; font-weight: 800; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.07); margin-top: 4px; }
        .th-sum-row.total span:last-child { color: var(--yellow); font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; }
        .th-sum-row.points-row { color: var(--yellow); font-size: 12px; }
        .th-voucher-badge { font-family: 'Bebas Neue', sans-serif; font-size: 12px; letter-spacing: 2px; background: rgba(212,226,25,0.12); border: 1px solid rgba(212,226,25,0.3); border-radius: 4px; padding: 1px 6px; color: var(--yellow); margin-left: 6px; }

        .th-modal-meta { display: flex; flex-direction: column; gap: 7px; }
        .th-meta-item { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.35); }
        .th-meta-item span:last-child { color: rgba(255,255,255,0.6); }
        .th-code-mono { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1.5px; font-size: 13px; }
      `}</style>

      {selected && <DetailModal tx={selected} onClose={() => setSelected(null)} />}

      <div className="th-page mt-4">
        <Container fluid="xl">

          {/* ── HEADER ── */}
          <Row className="align-items-end mb-4 gy-3">
            <Col>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                📋 Tài khoản của bạn
              </p>
              <h1 className="th-title mb-0">LỊCH SỬ <span>GIAO DỊCH</span></h1>
            </Col>
            <Col xs="auto">
              <div className="th-stats">
                <div className="th-stat">
                  <div className="th-stat-num">{totalOrders}</div>
                  <div className="th-stat-lbl">Giao dịch</div>
                </div>
                <div className="th-stat">
                  <div className="th-stat-num" style={{ fontSize: 18 }}>{(totalSpent / 1000).toFixed(0)}K</div>
                  <div className="th-stat-lbl">Đã chi</div>
                </div>
                <div className="th-stat">
                  <div className="th-stat-num">{totalPts}</div>
                  <div className="th-stat-lbl">Điểm ⭐</div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── FILTERS ── */}
          <Row className="align-items-center mb-4 gy-2">
            <Col>
              <div className="th-filters">
                {/* Type */}
                {[
                  { key: "all",           label: "Tất cả" },
                  { key: "ticket_online", label: "🎫 Vé" },
                  { key: "food",          label: "🍿 Bắp Nước" },
                  { key: "points",        label: "⭐ Điểm" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`th-filter-btn${filterType === key ? " active" : ""}`}
                    onClick={() => setFilterType(key)}
                  >
                    {label}
                  </button>
                ))}

                <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

                {/* Status */}
                {[
                  { key: "all",       label: "Mọi trạng thái" },
                  { key: "completed", label: "Hoàn thành" },
                  { key: "cancelled", label: "Đã hủy" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`th-filter-btn${filterStatus === key ? " active" : ""}`}
                    onClick={() => setFilterStatus(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Col>
            <Col xs={12} md="auto">
              <div className="th-search-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ flexShrink: 0, marginRight: 8 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="th-search-input"
                  placeholder="Tìm mã đơn, tên sản phẩm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </Col>
          </Row>

          {/* result count */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600, marginBottom: 12 }}>
            {filtered.length} giao dịch
          </div>

          {/* ── LIST ── */}
          {filtered.length === 0 ? (
            <div className="th-empty">
              <div className="ei">📋</div>
              <p>Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <div>
              {filtered.map(tx => {
                const tc = TYPE_CONFIG[tx.type];
                const sc = STATUS_CONFIG[tx.status];
                const isExpanded = expanded === tx.id;
                const isPoints = tx.type === "points";
                const amountColor = tx.status === "cancelled" ? "rgba(255,255,255,0.25)"
                  : isPoints ? (tx.final_amount > 0 ? "#81c784" : "#e57373")
                  : "var(--yellow)";

                return (
                  <div key={tx.id} className={`th-row${isExpanded ? " expanded" : ""}`}>
                    <div className="th-row-main" onClick={() => setExpanded(isExpanded ? null : tx.id)}>

                      {/* Type icon */}
                      <div className="th-type-icon" style={{ background: tc.bg }}>
                        {tc.icon}
                      </div>

                      {/* Info */}
                      <div className="th-row-info">
                        <div className="th-row-code">{tx.order_code}</div>
                        <div className="th-row-desc">
                          {tx.items[0].label}
                          {tx.items.length > 1 && ` +${tx.items.length - 1} khác`}
                        </div>
                      </div>

                      {/* Status */}
                      <span className="th-status-badge" style={{ background: sc.bg, color: sc.color, borderColor: `${sc.color}40` }}>
                        {sc.label}
                      </span>

                      {/* Date */}
                      <div className="th-row-date" style={{ display: "none" }}>
                        <span className="th-row-date-val">{fmtDate(tx.created_at)}</span>
                        <span className="th-row-date-time">{fmtTime(tx.created_at)}</span>
                      </div>

                      {/* Amount */}
                      <div className="th-row-amount">
                        <span className="th-amount-val" style={{ color: amountColor }}>
                          {isPoints
                            ? `${tx.final_amount > 0 ? "+" : ""}${tx.final_amount.toLocaleString()} pts`
                            : (tx.status === "cancelled" ? fmt(tx.final_amount) : fmt(tx.final_amount))
                          }
                        </span>
                        <span className="th-amount-sub">
                          {isPoints ? "điểm" : fmtDate(tx.created_at)}
                        </span>
                      </div>

                      {/* Expand */}
                      <button className={`th-expand-btn${isExpanded ? " open" : ""}`} onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : tx.id); }}>
                        ▼
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="th-row-detail">
                        {tx.items.map((item, i) => (
                          <div key={i} className="th-detail-item">
                            <span className="th-di-icon">{item.icon}</span>
                            <div className="th-di-info">
                              <div className="th-di-name">{item.label}</div>
                              <div className="th-di-sub">{item.sub}</div>
                            </div>
                            <div className="th-di-price">
                              {isPoints
                                ? <span style={{ color: item.price > 0 ? "#81c784" : "#e57373" }}>
                                    {item.price > 0 ? "+" : ""}{item.price.toLocaleString()} pts
                                  </span>
                                : fmt(item.price)
                              }
                            </div>
                          </div>
                        ))}

                        <div className="th-detail-footer">
                          <div className="th-df-left">
                            <div className="th-df-item">
                              Thời gian: <span>{fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}</span>
                            </div>
                            {!isPoints && tx.discount_amount > 0 && (
                              <div className="th-df-item">
                                Giảm giá: <span style={{ color: "#81c784" }}>-{fmt(tx.discount_amount)}</span>
                                {tx.voucher_code && <span className="voucher"> {tx.voucher_code}</span>}
                              </div>
                            )}
                            {!isPoints && tx.points_earned > 0 && (
                              <div className="th-df-item">
                                Điểm nhận: <span style={{ color: "var(--yellow)" }}>+{tx.points_earned} pts</span>
                              </div>
                            )}
                          </div>
                          <button className="th-see-more" onClick={() => setSelected(tx)}>
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>
    </Layout>
  );
}