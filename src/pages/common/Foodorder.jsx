import { useState } from "react";
import Layout from "../../components/layout/Layout";
import { Container, Row, Col } from "react-bootstrap";

/* ── Mock Products ── */
const CATEGORIES = ["Tất cả", "Combo", "Bắp Rang", "Nước Uống", "Snack"];

const PRODUCTS = [
  { id: 1, name: "Combo Hoạt Hình",     category: "Combo",    price: 85000,  originalPrice: 105000, desc: "1 Bắp lớn + 1 Nước lớn",        emoji: "🍿",  hot: true,  tag: "Bán chạy" },
  { id: 2, name: "Combo Đôi Bạn",       category: "Combo",    price: 125000, originalPrice: 160000, desc: "1 Bắp lớn + 2 Nước lớn",        emoji: "🎬",  hot: true,  tag: "Tiết kiệm" },
  { id: 3, name: "Combo Gia Đình",      category: "Combo",    price: 195000, originalPrice: 250000, desc: "2 Bắp lớn + 4 Nước lớn",        emoji: "👨‍👩‍👧‍👦", hot: false, tag: "Siêu deal" },
  { id: 4, name: "Combo VIP",           category: "Combo",    price: 215000, originalPrice: 280000, desc: "2 Bắp phô mai + 2 Nước + Snack", emoji: "👑",  hot: false, tag: "Premium" },
  { id: 5, name: "Bắp Rang Bơ Nhỏ",    category: "Bắp Rang", price: 35000,  originalPrice: null,   desc: "Size S - Bơ thơm béo",           emoji: "🌽",  hot: false, tag: null },
  { id: 6, name: "Bắp Rang Bơ Lớn",    category: "Bắp Rang", price: 45000,  originalPrice: null,   desc: "Size L - Bơ thơm béo",           emoji: "🌽",  hot: false, tag: null },
  { id: 7, name: "Bắp Phô Mai Nhỏ",    category: "Bắp Rang", price: 45000,  originalPrice: null,   desc: "Size S - Phô mai đặc biệt",      emoji: "🧀",  hot: true,  tag: "Mới" },
  { id: 8, name: "Bắp Phô Mai Lớn",    category: "Bắp Rang", price: 55000,  originalPrice: null,   desc: "Size L - Phô mai đặc biệt",      emoji: "🧀",  hot: false, tag: null },
  { id: 9, name: "Nước Ngọt Nhỏ",      category: "Nước Uống",price: 25000,  originalPrice: null,   desc: "Pepsi / 7UP / Mirinda - 500ml",  emoji: "🥤",  hot: false, tag: null },
  { id: 10, name: "Nước Ngọt Lớn",     category: "Nước Uống",price: 35000,  originalPrice: null,   desc: "Pepsi / 7UP / Mirinda - 1000ml", emoji: "🥤",  hot: false, tag: null },
  { id: 11, name: "Nước Khoáng",       category: "Nước Uống",price: 20000,  originalPrice: null,   desc: "LaVie / Aquafina 500ml",         emoji: "💧",  hot: false, tag: null },
  { id: 12, name: "Trà Đào Cam Sả",    category: "Nước Uống",price: 45000,  originalPrice: null,   desc: "Thức uống đặc biệt 700ml",       emoji: "🍑",  hot: true,  tag: "Mới" },
  { id: 13, name: "Nachos Phô Mai",    category: "Snack",    price: 55000,  originalPrice: 65000,  desc: "Nachos giòn + Sốt phô mai",      emoji: "🌮",  hot: false, tag: null },
  { id: 14, name: "Hotdog",            category: "Snack",    price: 45000,  originalPrice: null,   desc: "Xúc xích nướng thơm ngon",       emoji: "🌭",  hot: false, tag: null },
  { id: 15, name: "Kẹo Gôm",          category: "Snack",    price: 15000,  originalPrice: null,   desc: "Kẹo gôm các vị",                emoji: "🍬",  hot: false, tag: null },
];

const VOUCHERS = [
  { code: "COMBO10", discount: 10000, label: "Giảm 10.000đ", minOrder: 100000 },
  { code: "SAVE20",  discount: 20000, label: "Giảm 20.000đ", minOrder: 150000 },
];

const fmt = (n) => n.toLocaleString("vi-VN") + "đ";

/* ── Product Card ── */
function ProductCard({ product, qty, onAdd, onRemove }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const hasBadge = product.tag || discount;

  return (
    <div className={`fd-card${qty > 0 ? " in-cart" : ""}`}>
      {product.tag && (
        <div className="fd-tag">{product.tag}</div>
      )}
      {discount && (
        <div className="fd-discount-badge">-{discount}%</div>
      )}

      <div className="fd-emoji" style={{ marginTop: hasBadge ? 28 : 0 }}>{product.emoji}</div>

      <div className="fd-card-body">
        <h6 className="fd-name">{product.name}</h6>
        <p className="fd-desc">{product.desc}</p>
        <div className="fd-price-row">
          <span className="fd-price">{fmt(product.price)}</span>
          {product.originalPrice && (
            <span className="fd-original">{fmt(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <div className="fd-actions">
        {qty === 0 ? (
          <button className="fd-add-btn" onClick={() => onAdd(product)}>
            + Thêm
          </button>
        ) : (
          <div className="fd-qty-ctrl">
            <button className="fd-qty-btn minus" onClick={() => onRemove(product)}>−</button>
            <span className="fd-qty-num">{qty}</span>
            <button className="fd-qty-btn plus" onClick={() => onAdd(product)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function FoodOrder() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [cart, setCart]     = useState({});
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError]     = useState("");
  const [showCart, setShowCart]   = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [search, setSearch] = useState("");

  /* cart helpers */
  const addItem = (p) => setCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
  const removeItem = (p) => setCart(c => {
    const next = { ...c, [p.id]: (c[p.id] || 0) - 1 };
    if (next[p.id] <= 0) delete next[p.id];
    return next;
  });

  const cartItems   = PRODUCTS.filter(p => cart[p.id] > 0);
  const totalQty    = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal    = cartItems.reduce((a, p) => a + p.price * cart[p.id], 0);
  const discount    = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal  = Math.max(0, subtotal - discount);

  const applyVoucher = () => {
    const v = VOUCHERS.find(v => v.code === voucherInput.toUpperCase().trim());
    if (!v) { setVoucherError("Mã voucher không hợp lệ"); return; }
    if (subtotal < v.minOrder) {
      setVoucherError(`Đơn tối thiểu ${fmt(v.minOrder)} để dùng mã này`);
      return;
    }
    setAppliedVoucher(v);
    setVoucherError("");
  };

  const handleOrder = () => {
    setOrderDone(true);
    setCart({});
    setAppliedVoucher(null);
    setShowCart(false);
  };

  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCategory === "Tất cả" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
          --card-bg: rgba(20,22,50,0.92);
        }

        .fd-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 70% 45% at 10% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 90% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 100px;
        }

        /* ── TITLE ── */
        .fd-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 58px);
          letter-spacing: 4px;
          line-height: 1;
          color: #fff;
        }
        .fd-title span { color: var(--yellow); }

        /* ── SEARCH ── */
        .fd-search-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0 16px;
          max-width: 300px;
          transition: border-color 0.2s;
        }
        .fd-search-wrap:focus-within { border-color: var(--yellow); }
        .fd-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 0;
          width: 100%;
        }
        .fd-search-input::placeholder { color: rgba(255,255,255,0.25); }

        /* ── CATEGORY PILLS ── */
        .fd-cats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .fd-cat-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 7px 18px;
          border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fd-cat-btn:hover { border-color: var(--yellow); color: var(--yellow); }
        .fd-cat-btn.active { background: var(--yellow); border-color: var(--yellow); color: #0f102a; }

        /* ── PRODUCT CARD ── */
        .fd-card {
          background: var(--card-bg);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          height: 100%;
          overflow: hidden;
        }
        .fd-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--purple), var(--pink));
          opacity: 0;
          transition: opacity 0.25s;
        }
        .fd-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.45); border-color: rgba(212,226,25,0.2); }
        .fd-card:hover::before { opacity: 1; }
        .fd-card.in-cart { border-color: rgba(212,226,25,0.4); }
        .fd-card.in-cart::before { opacity: 1; background: var(--yellow); }

        /* tag + discount */
        .fd-tag {
          position: absolute;
          top: 12px; left: 12px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 5px;
        }
        .fd-discount-badge {
          position: absolute;
          top: 12px; right: 12px;
          background: rgba(233,30,140,0.15);
          border: 1px solid rgba(233,30,140,0.4);
          color: var(--pink);
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .fd-emoji {
          font-size: 52px;
          margin-bottom: 12px;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
          line-height: 1;
        }
        .fd-card-body { flex: 1; width: 100%; }
        .fd-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 17px;
          letter-spacing: 2px;
          color: #fff;
          margin-bottom: 4px;
        }
        .fd-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .fd-price-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .fd-price {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 1px;
          color: var(--yellow);
        }
        .fd-original {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          text-decoration: line-through;
          font-weight: 600;
        }

        /* add / qty */
        .fd-add-btn {
          width: 100%;
          padding: 9px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 14px rgba(233,30,140,0.2);
        }
        .fd-add-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        .fd-qty-ctrl {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 9px;
          overflow: hidden;
          border: 1.5px solid rgba(212,226,25,0.35);
        }
        .fd-qty-btn {
          background: rgba(212,226,25,0.1);
          border: none;
          color: var(--yellow);
          font-size: 18px;
          font-weight: 700;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          line-height: 1;
        }
        .fd-qty-btn:hover { background: rgba(212,226,25,0.2); }
        .fd-qty-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          color: #fff;
          letter-spacing: 1px;
          min-width: 36px;
          text-align: center;
          background: rgba(255,255,255,0.04);
        }

        /* ── CART SIDEBAR ── */
        .fd-cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
        }
        .fd-cart-sidebar {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 100%;
          max-width: 420px;
          background: #0d0e28;
          border-left: 1px solid rgba(255,255,255,0.08);
          z-index: 2001;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .fd-cart-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fd-cart-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 3px;
          color: #fff;
        }
        .fd-cart-title span { color: var(--yellow); }
        .fd-close-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }
        .fd-close-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

        .fd-cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
        }
        .fd-cart-items::-webkit-scrollbar { width: 4px; }
        .fd-cart-items::-webkit-scrollbar-track { background: transparent; }
        .fd-cart-items::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .fd-cart-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .fd-item-emoji { font-size: 28px; flex-shrink: 0; }
        .fd-item-info { flex: 1; min-width: 0; }
        .fd-item-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 1.5px;
          color: #fff;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fd-item-price { font-size: 12px; font-weight: 700; color: var(--yellow); }
        .fd-item-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 0;
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .fd-item-qty-btn {
          background: rgba(255,255,255,0.04);
          border: none;
          color: rgba(255,255,255,0.5);
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .fd-item-qty-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .fd-item-qty-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          color: #fff;
          min-width: 28px;
          text-align: center;
          background: rgba(255,255,255,0.03);
          padding: 0 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 28px;
        }

        /* empty cart */
        .fd-cart-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.2);
          padding: 40px;
          text-align: center;
        }
        .fd-cart-empty .ce-icon { font-size: 56px; margin-bottom: 12px; opacity: 0.35; }
        .fd-cart-empty p { font-size: 13px; font-weight: 600; }

        /* cart footer */
        .fd-cart-footer {
          padding: 16px 24px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .fd-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          margin-bottom: 6px;
        }
        .fd-summary-row.total {
          font-size: 16px;
          color: #fff;
          font-weight: 800;
          margin: 12px 0;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .fd-summary-row.total .val { color: var(--yellow); font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; }
        .fd-summary-row .discount-val { color: #81c784; }

        /* voucher input */
        .fd-voucher-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .fd-voucher-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          padding: 9px 14px;
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 2px;
          outline: none;
          transition: border-color 0.2s;
        }
        .fd-voucher-input:focus { border-color: var(--yellow); }
        .fd-voucher-input::placeholder { color: rgba(255,255,255,0.2); font-size: 12px; font-family: 'Syne', sans-serif; letter-spacing: 0.5px; }
        .fd-voucher-apply {
          background: rgba(212,226,25,0.1);
          border: 1.5px solid rgba(212,226,25,0.3);
          border-radius: 9px;
          color: var(--yellow);
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 12px;
          padding: 0 16px;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .fd-voucher-apply:hover { background: rgba(212,226,25,0.2); }
        .fd-voucher-err { font-size: 11px; color: var(--pink); font-weight: 700; margin-bottom: 8px; }
        .fd-voucher-ok {
          font-size: 11px;
          color: #81c784;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* checkout btn */
        .fd-checkout-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(233,30,140,0.3);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .fd-checkout-btn:hover { box-shadow: 0 0 40px rgba(233,30,140,0.55); transform: translateY(-1px); }
        .fd-checkout-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── FLOATING CART BUTTON ── */
        .fd-cart-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none;
          border-radius: 16px;
          padding: 14px 22px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(233,30,140,0.4);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          transition: box-shadow 0.25s, transform 0.2s;
          animation: fabBounce 0.4s ease;
        }
        .fd-cart-fab:hover { box-shadow: 0 12px 44px rgba(233,30,140,0.6); transform: translateY(-2px); }
        @keyframes fabBounce {
          0%   { transform: scale(0.8); }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .fd-fab-badge {
          background: var(--yellow);
          color: #0f102a;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── SUCCESS ── */
        .fd-success {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .fd-success-card {
          background: #0d0e28;
          border: 1px solid rgba(212,226,25,0.25);
          border-radius: 24px;
          padding: 48px 36px;
          text-align: center;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: successPop 0.4s ease;
        }
        @keyframes successPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .fd-success-icon { font-size: 72px; margin-bottom: 20px; }
        .fd-success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 4px;
          color: #fff;
          margin-bottom: 8px;
        }
        .fd-success-title span { color: var(--yellow); }
        .fd-success-sub { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 600; margin-bottom: 28px; }
        .fd-back-btn {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          padding: 13px 32px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: opacity 0.2s;
        }
        .fd-back-btn:hover { opacity: 0.88; }

        /* ── EMPTY SEARCH ── */
        .fd-empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.2); }
        .fd-empty .ei { font-size: 52px; opacity: 0.3; margin-bottom: 12px; }
        .fd-empty p { font-size: 13px; font-weight: 600; }
      `}</style>

      {/* SUCCESS OVERLAY */}
      {orderDone && (
        <div className="fd-success">
          <div className="fd-success-card">
            <div className="fd-success-icon">🎉</div>
            <div className="fd-success-title">ĐẶT HÀNG <span>THÀNH CÔNG!</span></div>
            <p className="fd-success-sub">
              Đơn hàng của bạn đang được chuẩn bị.<br/>
              Vui lòng nhận tại quầy bắp nước.
            </p>
            <button className="fd-back-btn" onClick={() => setOrderDone(false)}>
              Đặt thêm
            </button>
          </div>
        </div>
      )}

      {/* CART SIDEBAR */}
      {showCart && (
        <>
          <div className="fd-cart-overlay" onClick={() => setShowCart(false)} />
          <div className="fd-cart-sidebar">
            <div className="fd-cart-header">
              <div className="fd-cart-title">GIỎ <span>HÀNG</span></div>
              <button className="fd-close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="fd-cart-empty">
                <div className="ce-icon">🛒</div>
                <p>Giỏ hàng đang trống<br/>Thêm món ngay!</p>
              </div>
            ) : (
              <div className="fd-cart-items">
                {cartItems.map(p => (
                  <div key={p.id} className="fd-cart-item">
                    <div className="fd-item-emoji">{p.emoji}</div>
                    <div className="fd-item-info">
                      <div className="fd-item-name">{p.name}</div>
                      <div className="fd-item-price">{fmt(p.price)} × {cart[p.id]} = {fmt(p.price * cart[p.id])}</div>
                    </div>
                    <div className="fd-item-qty-ctrl">
                      <button className="fd-item-qty-btn" onClick={() => removeItem(p)}>−</button>
                      <div className="fd-item-qty-num">{cart[p.id]}</div>
                      <button className="fd-item-qty-btn" onClick={() => addItem(p)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="fd-cart-footer">
                {/* Voucher */}
                <div className="fd-voucher-row">
                  <input
                    className="fd-voucher-input"
                    placeholder="Nhập mã voucher..."
                    value={voucherInput}
                    onChange={e => { setVoucherInput(e.target.value); setVoucherError(""); }}
                    onKeyDown={e => e.key === "Enter" && applyVoucher()}
                    disabled={!!appliedVoucher}
                  />
                  {!appliedVoucher
                    ? <button className="fd-voucher-apply" onClick={applyVoucher}>Áp dụng</button>
                    : <button className="fd-voucher-apply" onClick={() => { setAppliedVoucher(null); setVoucherInput(""); }}>Xóa</button>
                  }
                </div>
                {voucherError && <div className="fd-voucher-err">⚠ {voucherError}</div>}
                {appliedVoucher && (
                  <div className="fd-voucher-ok">
                    <span>✓</span> {appliedVoucher.label} đã được áp dụng
                  </div>
                )}

                {/* Summary */}
                <div className="fd-summary-row">
                  <span>Tạm tính ({totalQty} món)</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {appliedVoucher && (
                  <div className="fd-summary-row">
                    <span>Giảm giá</span>
                    <span className="discount-val">-{fmt(discount)}</span>
                  </div>
                )}
                <div className="fd-summary-row total">
                  <span>Tổng cộng</span>
                  <span className="val">{fmt(finalTotal)}</span>
                </div>

                {/* Demo hint */}
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: 0.5, marginBottom: 10, textAlign: "center" }}>
                  Voucher demo: <span style={{ color: "rgba(212,226,25,0.5)", fontFamily: "'Bebas Neue'", letterSpacing: 2 }}>COMBO10</span> hoặc <span style={{ color: "rgba(212,226,25,0.5)", fontFamily: "'Bebas Neue'", letterSpacing: 2 }}>SAVE20</span>
                </div>

                <button className="fd-checkout-btn" onClick={handleOrder}>
                  🍿 Xác nhận đặt hàng — {fmt(finalTotal)}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="fd-page mt-4">
        <Container fluid="xl">

          {/* HEADER */}
          <Row className="align-items-end mb-5 gy-3">
            <Col>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                🍿 Đặt trước — Nhận tại quầy
              </p>
              <h1 className="fd-title mb-0">ĐẶT <span>BẮP NƯỚC</span></h1>
            </Col>
            <Col xs="auto">
              <div className="fd-search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ flexShrink: 0, marginRight: 8 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="fd-search-input"
                  placeholder="Tìm món ăn..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </Col>
          </Row>

          {/* CATEGORIES */}
          <div className="fd-cats">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`fd-cat-btn${activeCategory === c ? " active" : ""}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* PRODUCTS */}
          {filtered.length === 0 ? (
            <div className="fd-empty">
              <div className="ei">🔍</div>
              <p>Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <Row className="g-3">
              {filtered.map(p => (
                <Col key={p.id} xs={6} sm={4} md={3} xl={2}>
                  <ProductCard
                    product={p}
                    qty={cart[p.id] || 0}
                    onAdd={addItem}
                    onRemove={removeItem}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* FLOATING CART BUTTON */}
      {totalQty > 0 && !showCart && (
        <button className="fd-cart-fab" onClick={() => setShowCart(true)}>
          <span>🛒 Giỏ hàng</span>
          <div className="fd-fab-badge">{totalQty}</div>
          <span style={{ fontSize: 13, opacity: 0.75 }}>{fmt(subtotal)}</span>
        </button>
      )}
    </Layout>
  );
}