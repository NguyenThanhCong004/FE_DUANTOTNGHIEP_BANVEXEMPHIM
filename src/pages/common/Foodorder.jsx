import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { Container, Row, Col, Spinner, Form, Alert } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { CINEMAS, FOOD_ORDERS } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";

const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function normalizeProduct(o) {
  const id = o.productId ?? o.product_id;
  return {
    productId: id != null ? Number(id) : null,
    name: o.name ?? "—",
    description: o.description ?? "",
    price: Number(o.price ?? 0) || 0,
    categoryName: o.categoryName ?? o.category_name ?? "Khác",
    image: typeof o.image === "string" ? o.image.trim() : "",
  };
}

function ProductCard({ product, qty, onAdd, onRemove }) {
  const img =
    product.image && (product.image.startsWith("http") || product.image.startsWith("data:")) ? (
      <img
        src={product.image}
        alt=""
        style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 10, marginBottom: 12 }}
      />
    ) : (
      <div
        style={{
          width: "100%", height: 100, borderRadius: 10, marginBottom: 12,
          background: "rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
        }}
      >
        🍿
      </div>
    );

  return (
    <div className={`fd-card h-100${qty > 0 ? " in-cart" : ""}`}>
      <div className="fd-card-inner">
        {img}
        <h6 className="fd-name" title={product.name}>{product.name}</h6>
        <p className="fd-desc">
          {(product.description || "").slice(0, 80)}
          {(product.description || "").length > 80 ? "…" : ""}
        </p>
        <div className="fd-price-row">
          <span className="fd-price">{fmt(product.price)}</span>
        </div>
        <div className="fd-actions">
          {qty === 0 ? (
            <button className="fd-add-btn" onClick={() => onAdd(product.productId)}>
              + Thêm
            </button>
          ) : (
            <div className="fd-qty-ctrl">
              <button className="fd-qty-btn" onClick={() => onRemove(product.productId)}>−</button>
              <span className="fd-qty-num">{qty}</span>
              <button className="fd-qty-btn" onClick={() => onAdd(product.productId)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FoodOrder() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [cinemaId, setCinemaId] = useState("");
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoadingCinemas(true);
      try {
        const res = await apiFetch(CINEMAS.LIST);
        const body = await res.json().catch(() => null);
        if (!c && res.ok && Array.isArray(body?.data)) {
          setCinemas(body.data);
          if (body.data.length === 1) {
            const only = body.data[0];
            setCinemaId(String(only.cinemaId ?? only.cinema_id ?? only.id ?? ""));
          }
        }
      } catch {
        if (!c) setCinemas([]);
      } finally {
        if (!c) setLoadingCinemas(false);
      }
    })();
    return () => { c = true; };
  }, []);

  const loadMenu = useCallback(async (cid) => {
    const id = Number(cid);
    if (!Number.isFinite(id) || id <= 0) { setProducts([]); return; }
    setLoadingMenu(true);
    setMenuError(null);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU(id));
      const body = await res.json().catch(() => null);
      if (!res.ok) { setMenuError(body?.message || "Không tải được menu"); setProducts([]); return; }
      const onSale = Array.isArray(body?.data?.onSale) ? body.data.onSale : [];
      setProducts(onSale.map(normalizeProduct).filter((p) => p.productId != null));
    } catch {
      setMenuError("Không kết nối được máy chủ");
      setProducts([]);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => { if (cinemaId) loadMenu(cinemaId); }, [cinemaId, loadMenu]);

  const categories = useMemo(() => {
    const s = new Set();
    for (const p of products) { if (p.categoryName) s.add(p.categoryName); }
    return ["Tất cả", ...[...s].sort((a, b) => a.localeCompare(b, "vi"))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = activeCategory === "Tất cả" || p.categoryName === activeCategory;
      const searchOk = !q || p.name.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [products, activeCategory, search]);

  const addItem    = (productId) => setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  const removeItem = (productId) => setCart((c) => {
    const n = { ...c, [productId]: (c[productId] || 0) - 1 };
    if (n[productId] <= 0) delete n[productId];
    return n;
  });

  const cartItems = useMemo(() => products.filter((p) => (cart[p.productId] || 0) > 0), [products, cart]);
  const totalQty  = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const subtotal  = useMemo(() => cartItems.reduce((sum, p) => sum + p.price * (cart[p.productId] || 0), 0), [cartItems, cart]);

  const handlePayOS = async () => {
    setCheckoutError(null);
    const id = Number(cinemaId);
    if (!Number.isFinite(id) || id <= 0) { setCheckoutError("Chọn rạp nhận hàng"); return; }
    if (totalQty <= 0) { setCheckoutError("Chọn ít nhất một món"); return; }
    if (!getAccessToken()) { navigate("/login", { state: { from: "/foodorder" } }); return; }
    const items = Object.entries(cart)
      .map(([k, q]) => ({ productId: Number(k), quantity: q }))
      .filter((x) => Number.isFinite(x.productId) && x.quantity > 0);
    setPaying(true);
    const origin = window.location.origin;
    try {
      const res = await apiFetch(FOOD_ORDERS.CHECKOUT, {
        method: "POST",
        body: JSON.stringify({
          cinemaId: id, items,
          returnUrl: `${origin}/payment/success`,
          cancelUrl:  `${origin}/payment/cancel`,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) { navigate("/login", { state: { from: "/foodorder" } }); return; }
      if (res.status === 403) { setCheckoutError(body?.message || "Chỉ tài khoản khách được đặt online."); return; }
      if (!res.ok) { setCheckoutError(body?.message || "Không tạo được link thanh toán"); return; }
      const url = body?.data?.payos?.checkoutUrl;
      if (!url) { setCheckoutError("BE không trả về link PayOS"); return; }
      const payosOrderCode = body?.data?.payosOrderCode;
      if (payosOrderCode != null) {
        try {
          sessionStorage.setItem("payos_pending_order_code", String(payosOrderCode));
          sessionStorage.setItem("payos_pending_kind", "food");
        } catch { /* ignore */ }
      }
      window.location.assign(url);
    } catch {
      setCheckoutError("Lỗi kết nối");
    } finally {
      setPaying(false);
    }
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card-bg: rgba(20,22,50,0.92);
        }

        .fd-page {
          min-height: 85vh;
          background:
            radial-gradient(ellipse 70% 45% at 10% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 90% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 80px;
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

        /* ── CINEMA SELECT ── */
        .fd-select {
          background: rgba(255,255,255,0.05) !important;
          border: 1.5px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: #fff !important;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 14px;
          outline: none;
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .fd-select:focus { border-color: var(--yellow) !important; box-shadow: none !important; }
        .fd-select option { background: #1a1b3a; color: #fff; }

        /* ── SEARCH ── */
        .fd-search {
          background: rgba(255,255,255,0.05) !important;
          border: 1.5px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: #fff !important;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .fd-search::placeholder { color: rgba(255,255,255,0.25); }
        .fd-search:focus { border-color: var(--yellow) !important; box-shadow: none !important; }

        /* ── CATEGORY PILLS ── */
        .fd-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
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
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          position: relative;
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
        .fd-card-inner { padding: 16px; display: flex; flex-direction: column; height: 100%; }

        .fd-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 1.5px;
          color: #fff;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fd-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          margin-bottom: 10px;
          line-height: 1.4;
          min-height: 30px;
          flex: 1;
        }
        .fd-price-row { margin-bottom: 12px; }
        .fd-price {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 1px;
          color: var(--yellow);
        }

        /* add / qty */
        .fd-add-btn {
          width: 100%;
          padding: 8px;
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
          border-radius: 9px;
          overflow: hidden;
          border: 1.5px solid rgba(212,226,25,0.35);
        }
        .fd-qty-btn {
          background: rgba(212,226,25,0.1);
          border: none;
          color: var(--yellow);
          font-size: 16px;
          font-weight: 700;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .fd-qty-btn:hover { background: rgba(212,226,25,0.2); }
        .fd-qty-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          color: #fff;
          letter-spacing: 1px;
          flex: 1;
          text-align: center;
          background: rgba(255,255,255,0.04);
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── CART PANEL ── */
        .fd-cart-panel {
          background: rgba(20,22,50,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          position: sticky;
          top: 96px;
          backdrop-filter: blur(12px);
        }
        .fd-cart-panel-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 3px;
          color: #fff;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .fd-cart-panel-title span { color: var(--yellow); }

        .fd-cart-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .fd-cart-item-name { color: #fff; font-weight: 700; }
        .fd-cart-item-sub { color: rgba(255,255,255,0.35); font-weight: 600; margin-top: 1px; }
        .fd-cart-item-total { color: var(--yellow); font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 1px; white-space: nowrap; }

        .fd-cart-scroll { max-height: 260px; overflow-y: auto; margin-bottom: 12px; }
        .fd-cart-scroll::-webkit-scrollbar { width: 3px; }
        .fd-cart-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .fd-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 16px;
        }
        .fd-summary-row .val {
          color: var(--yellow);
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 1px;
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
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(233,30,140,0.3);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .fd-checkout-btn:hover { box-shadow: 0 0 40px rgba(233,30,140,0.55); transform: translateY(-1px); }
        .fd-checkout-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

        /* alerts */
        .fd-alert-warn {
          background: rgba(212,226,25,0.08);
          border: 1.5px solid rgba(212,226,25,0.25);
          border-radius: 10px;
          color: #d4e219;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .fd-alert-danger {
          background: rgba(233,30,140,0.08);
          border: 1.5px solid rgba(233,30,140,0.25);
          border-radius: 10px;
          color: #e91e8c;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        /* empty / loading */
        .fd-empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.2); }
        .fd-empty .ei { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }
        .fd-empty p { font-size: 13px; font-weight: 600; }
      `}</style>

      <div className="fd-page mt-4">
        <Container fluid="xl">

          {/* HEADER */}
          <Row className="align-items-end mb-4 gy-3">
            <Col>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>
                🍿 Đặt trước — nhận tại quầy rạp
              </p>
              <h1 className="fd-title mb-0">
                BẮP NƯỚC <span>ONLINE</span>
              </h1>
            </Col>
            <Col xs={12} md="auto">
              <Form.Select
                className="fd-select"
                value={cinemaId}
                onChange={(e) => { setCinemaId(e.target.value); setCart({}); }}
                disabled={loadingCinemas}
              >
                <option value="">— Chọn rạp —</option>
                {cinemas.map((c) => {
                  const cid  = c.cinemaId ?? c.cinema_id ?? c.id;
                  const name = c.name ?? `Rạp #${cid}`;
                  return <option key={cid} value={cid}>{name}</option>;
                })}
              </Form.Select>
            </Col>
          </Row>

          {menuError    && <div className="fd-alert-warn">⚠ {menuError}</div>}
          {checkoutError && <div className="fd-alert-danger">⚠ {checkoutError}</div>}

          <Row className="g-4">
            {/* LEFT — menu */}
            <Col lg={8}>
              {loadingMenu ? (
                <div className="fd-empty">
                  <Spinner animation="border" variant="light" />
                  <p style={{ marginTop:12 }}>Đang tải menu…</p>
                </div>
              ) : !cinemaId ? (
                <div className="fd-empty"><div className="ei">🎬</div><p>Chọn rạp để xem món đang bán.</p></div>
              ) : filtered.length === 0 ? (
                <div className="fd-empty"><div className="ei">🔍</div><p>Không có món phù hợp hoặc menu trống.</p></div>
              ) : (
                <>
                  <div className="fd-cats">
                    {categories.map((c) => (
                      <button
                        key={c}
                        className={`fd-cat-btn${activeCategory === c ? " active" : ""}`}
                        onClick={() => setActiveCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    className="fd-search"
                    placeholder="Tìm món ăn…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 20 }}
                  />
                  <Row className="g-3">
                    {filtered.map((p) => (
                      <Col key={p.productId} xs={6} md={4} xl={3}>
                        <ProductCard
                          product={p}
                          qty={cart[p.productId] || 0}
                          onAdd={addItem}
                          onRemove={removeItem}
                        />
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </Col>

            {/* RIGHT — cart */}
            <Col lg={4}>
              <div className="fd-cart-panel">
                <div className="fd-cart-panel-title">GIỎ <span>HÀNG</span></div>

                {cartItems.length === 0 ? (
                  <p style={{ color:"rgba(255,255,255,0.25)", fontSize:13, fontWeight:600 }}>
                    Chưa có món — thêm từ danh sách bên trái.
                  </p>
                ) : (
                  <div className="fd-cart-scroll">
                    {cartItems.map((p) => (
                      <div key={p.productId} className="fd-cart-item-row">
                        <div>
                          <div className="fd-cart-item-name">{p.name}</div>
                          <div className="fd-cart-item-sub">{fmt(p.price)} × {cart[p.productId]}</div>
                        </div>
                        <div className="fd-cart-item-total">{fmt(p.price * cart[p.productId])}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="fd-summary-row">
                  <span>Tạm tính ({totalQty} món)</span>
                  <span className="val">{fmt(subtotal)}</span>
                </div>

                <button
                  className="fd-checkout-btn"
                  disabled={paying || totalQty === 0 || !cinemaId}
                  onClick={handlePayOS}
                >
                  {paying ? (
                    <><Spinner size="sm" className="me-2" />Đang tạo link PayOS…</>
                  ) : (
                    <>🍿 Thanh toán PayOS — {fmt(subtotal)}</>
                  )}
                </button>

                <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:600, textAlign:"center", marginTop:10, marginBottom:0 }}>
                  Cần đăng nhập tài khoản khách. Thanh toán xong nhận tại quầy rạp đã chọn.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
}