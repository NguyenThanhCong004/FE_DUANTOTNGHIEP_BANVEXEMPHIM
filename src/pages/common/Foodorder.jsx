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
        className="rounded-3 mb-2"
        style={{ width: "100%", height: 100, objectFit: "cover" }}
      />
    ) : (
      <div
        className="rounded-3 mb-2 d-flex align-items-center justify-content-center fw-black text-white-50"
        style={{ width: "100%", height: 100, background: "rgba(255,255,255,0.06)", fontSize: 36 }}
      >
        🍿
      </div>
    );

  return (
    <div
      className={`h-100 p-3 rounded-4 border ${
        qty > 0 ? "border-rose-500 border-opacity-40" : "border-zinc-700 border-opacity-80"
      }`}
      style={{ background: "rgba(24, 24, 27, 0.92)", backdropFilter: "blur(8px)" }}
    >
      {img}
      <h6 className="text-white fw-bold small mb-1 text-truncate" title={product.name}>
        {product.name}
      </h6>
      <p className="text-white-50 small mb-2" style={{ minHeight: 36, fontSize: 11, lineHeight: 1.35 }}>
        {(product.description || "").slice(0, 80)}
        {(product.description || "").length > 80 ? "…" : ""}
      </p>
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className="fw-black text-rose-400">{fmt(product.price)}</span>
        {qty === 0 ? (
          <button
            type="button"
            className="btn btn-sm btn-gradient text-white fw-bold rounded-pill px-3 border-0"
            onClick={() => onAdd(product.productId)}
          >
            + Thêm
          </button>
        ) : (
          <div className="d-flex align-items-center gap-1">
            <button type="button" className="btn btn-sm btn-outline-light py-0 px-2 border-zinc-600" onClick={() => onRemove(product.productId)}>
              −
            </button>
            <span className="text-white fw-bold px-1" style={{ minWidth: 20, textAlign: "center" }}>
              {qty}
            </span>
            <button
              type="button"
              className="btn btn-sm py-0 px-2 border text-rose-400"
              style={{ borderColor: "rgba(244,63,94,0.5)", background: "rgba(244,63,94,0.1)" }}
              onClick={() => onAdd(product.productId)}
            >
              +
            </button>
          </div>
        )}
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
    return () => {
      c = true;
    };
  }, []);

  const loadMenu = useCallback(async (cid) => {
    const id = Number(cid);
    if (!Number.isFinite(id) || id <= 0) {
      setProducts([]);
      return;
    }
    setLoadingMenu(true);
    setMenuError(null);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU(id));
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setMenuError(body?.message || "Không tải được menu");
        setProducts([]);
        return;
      }
      const onSale = Array.isArray(body?.data?.onSale) ? body.data.onSale : [];
      setProducts(onSale.map(normalizeProduct).filter((p) => p.productId != null));
    } catch {
      setMenuError("Không kết nối được máy chủ");
      setProducts([]);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    if (cinemaId) loadMenu(cinemaId);
  }, [cinemaId, loadMenu]);

  const categories = useMemo(() => {
    const s = new Set();
    for (const p of products) {
      if (p.categoryName) s.add(p.categoryName);
    }
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

  const addItem = (productId) => setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  const removeItem = (productId) =>
    setCart((c) => {
      const n = { ...c, [productId]: (c[productId] || 0) - 1 };
      if (n[productId] <= 0) delete n[productId];
      return n;
    });

  const cartItems = useMemo(
    () => products.filter((p) => (cart[p.productId] || 0) > 0),
    [products, cart]
  );
  const totalQty = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const subtotal = useMemo(
    () => cartItems.reduce((sum, p) => sum + p.price * (cart[p.productId] || 0), 0),
    [cartItems, cart]
  );

  const handlePayOS = async () => {
    setCheckoutError(null);
    const id = Number(cinemaId);
    if (!Number.isFinite(id) || id <= 0) {
      setCheckoutError("Chọn rạp nhận hàng");
      return;
    }
    if (totalQty <= 0) {
      setCheckoutError("Chọn ít nhất một món");
      return;
    }
    if (!getAccessToken()) {
      navigate("/login", { state: { from: "/foodorder" } });
      return;
    }
    const items = Object.entries(cart)
      .map(([k, q]) => ({ productId: Number(k), quantity: q }))
      .filter((x) => Number.isFinite(x.productId) && x.quantity > 0);
    setPaying(true);
    const origin = window.location.origin;
    try {
      const res = await apiFetch(FOOD_ORDERS.CHECKOUT, {
        method: "POST",
        body: JSON.stringify({
          cinemaId: id,
          items,
          returnUrl: `${origin}/payment/success`,
          cancelUrl: `${origin}/payment/cancel`,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) {
        navigate("/login", { state: { from: "/foodorder" } });
        return;
      }
      if (res.status === 403) {
        setCheckoutError(body?.message || "Chỉ tài khoản khách được đặt online.");
        return;
      }
      if (!res.ok) {
        setCheckoutError(body?.message || "Không tạo được link thanh toán");
        return;
      }
      const url = body?.data?.payos?.checkoutUrl;
      if (!url) {
        setCheckoutError("BE không trả về link PayOS");
        return;
      }
      const payosOrderCode = body?.data?.payosOrderCode;
      if (payosOrderCode != null) {
        try {
          sessionStorage.setItem("payos_pending_order_code", String(payosOrderCode));
          sessionStorage.setItem("payos_pending_kind", "food");
        } catch {
          /* ignore */
        }
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
      <div
        className="py-4 py-md-5"
        style={{
          minHeight: "85vh",
          background:
            "radial-gradient(ellipse 75% 50% at 50% -10%, rgba(244, 63, 94, 0.1) 0%, transparent 55%), linear-gradient(180deg, #09090b 0%, #18181b 100%)",
        }}
      >
        <Container fluid="xl" className="px-3">
          <Row className="align-items-end mb-4 gy-3">
            <Col>
              <p className="small text-zinc-400 fw-bold text-uppercase mb-1" style={{ letterSpacing: 2 }}>
                Đặt trước — nhận tại quầy rạp
              </p>
              <h1
                className="text-white fw-black mb-0"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, fontSize: "clamp(2rem,5vw,3rem)" }}
              >
                BẮP NƯỚC <span className="text-rose-500">ONLINE</span>
              </h1>
            </Col>
            <Col xs={12} md="auto">
              <Form.Select
                className="bg-zinc-900 text-white border-zinc-600 rounded-pill"
                value={cinemaId}
                onChange={(e) => {
                  setCinemaId(e.target.value);
                  setCart({});
                }}
                disabled={loadingCinemas}
              >
                <option value="">— Chọn rạp —</option>
                {cinemas.map((c) => {
                  const cid = c.cinemaId ?? c.cinema_id ?? c.id;
                  const name = c.name ?? `Rạp #${cid}`;
                  return (
                    <option key={cid} value={cid}>
                      {name}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
          </Row>

          {menuError ? <Alert variant="warning">{menuError}</Alert> : null}
          {checkoutError ? <Alert variant="danger">{checkoutError}</Alert> : null}

          <Row className="g-4">
            <Col lg={8}>
              {loadingMenu ? (
                <div className="text-center py-5 text-white">
                  <Spinner animation="border" variant="light" />
                  <p className="small mt-2 opacity-75">Đang tải menu…</p>
                </div>
              ) : !cinemaId ? (
                <p className="text-white-50 text-center py-5">Chọn rạp để xem món đang bán.</p>
              ) : filtered.length === 0 ? (
                <p className="text-white-50 text-center py-5">Không có món phù hợp hoặc menu trống.</p>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`btn btn-sm rounded-pill fw-bold ${
                          activeCategory === c ? "btn-gradient text-white border-0" : "btn-outline-light border-zinc-600 text-zinc-300"
                        }`}
                        onClick={() => setActiveCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <Form.Control
                    className="mb-3 bg-zinc-900 text-white border-zinc-600 rounded-pill"
                    placeholder="Tìm món…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Row className="g-3">
                    {filtered.map((p) => (
                      <Col key={p.productId} xs={6} md={4} xl={3}>
                        <ProductCard product={p} qty={cart[p.productId] || 0} onAdd={addItem} onRemove={removeItem} />
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </Col>

            <Col lg={4}>
              <div
                className="p-4 rounded-4 border border-zinc-700 sticky-top"
                style={{ top: 96, background: "rgba(24, 24, 27, 0.95)", backdropFilter: "blur(12px)" }}
              >
                <h5 className="text-white fw-black text-uppercase mb-3 border-bottom border-zinc-600 pb-2">Giỏ hàng</h5>
                {cartItems.length === 0 ? (
                  <p className="text-white-50 small mb-0">Chưa có món — thêm từ danh sách bên trái.</p>
                ) : (
                  <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: 280, overflowY: "auto" }}>
                    {cartItems.map((p) => (
                      <div key={p.productId} className="d-flex justify-content-between align-items-start small">
                        <div className="text-white me-2">
                          <div className="fw-bold">{p.name}</div>
                          <div className="text-white-50">
                            {fmt(p.price)} × {cart[p.productId]}
                          </div>
                        </div>
                        <div className="text-rose-400 fw-bold text-nowrap">{fmt(p.price * cart[p.productId])}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="d-flex justify-content-between text-white fw-bold mb-3 pt-2 border-top border-zinc-600">
                  <span>Tạm tính ({totalQty} món)</span>
                  <span className="text-rose-400">{fmt(subtotal)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-gradient w-100 rounded-pill fw-bold text-white py-3 border-0"
                  disabled={paying || totalQty === 0 || !cinemaId}
                  onClick={handlePayOS}
                >
                  {paying ? (
                    <>
                      <Spinner size="sm" className="me-2 text-white" />
                      Đang tạo link PayOS…
                    </>
                  ) : (
                    <>Thanh toán PayOS — {fmt(subtotal)}</>
                  )}
                </button>
                <p className="small text-zinc-400 text-center mt-2 mb-0">Cần đăng nhập tài khoản khách. Thanh toán xong nhận tại quầy rạp đã chọn.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
}
