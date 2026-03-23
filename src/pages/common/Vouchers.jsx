import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Container, Row, Col, Button, Modal, Form, InputGroup, Spinner } from "react-bootstrap";
import { getStoredUser, getAccessToken } from '../../utils/authStorage';
import { getUserIdFromToken } from '../../utils/jwt';
import { apiFetch, apiUrl } from '../../utils/apiClient';
import { VOUCHERS as VOUCHERS_API, ME, USERS } from '../../constants/apiEndpoints';

const fmt     = (n) => n.toLocaleString("vi-VN") + "đ";
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN");

function normalizeCatalogVoucher(v) {
  const end = v.endDate ? new Date(`${String(v.endDate).slice(0, 10)}T23:59:59`) : null;
  const start = v.startDate ? new Date(`${String(v.startDate).slice(0, 10)}T00:00:00`) : null;
  const now = new Date();
  let statusStr = "active";
  if (v.status === 0) statusStr = "expired";
  else if (end && end < now) statusStr = "expired";
  else if (start && start > now) statusStr = "expired";
  const dt = String(v.discountType || "").toLowerCase();
  const discount_type = dt.includes("percent") ? "percent" : "fixed";
  return {
    Vouchers_id: v.id,
    Code: v.code,
    discount_type,
    value: Number(v.value ?? 0),
    min_order_value: Number(v.minOrderValue ?? 0),
    start_date: v.startDate,
    end_date: v.endDate,
    point_voucher: Number(v.pointVoucher ?? 0),
    status: statusStr,
  };
}

export default function VoucherExchange() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [catalog, setCatalog] = useState([]);
  const [redeemedIds, setRedeemedIds] = useState([]);
  const [userPoints, setUserPoints] = useState(Number(storedUser?.points ?? storedUser?.totalPoints ?? 0));
  const [loading, setLoading] = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [successCode, setSuccessCode] = useState(null);
  const [redeemBusy, setRedeemBusy] = useState(false);

  const loadWallet = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setRedeemedIds([]);
      return;
    }
    try {
      const res = await apiFetch(ME.VOUCHERS);
      const body = await res.json().catch(() => null);
      if (!res.ok) return;
      const ids = (Array.isArray(body?.data) ? body.data : [])
        .map((uv) => uv.voucher?.id)
        .filter((id) => id != null);
      setRedeemedIds(ids);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const vr = await apiFetch(VOUCHERS_API.LIST);
        const vj = await vr.json().catch(() => null);
        if (!cancelled && vr.ok && Array.isArray(vj?.data)) {
          const rows = vj.data
            .map(normalizeCatalogVoucher)
            .filter((x) => x.point_voucher > 0);
          setCatalog(rows);
        } else if (!cancelled) {
          setCatalog([]);
        }
        const token = getAccessToken();
        const uid = token ? getUserIdFromToken(token) : null;
        if (token && uid) {
          const ur = await fetch(apiUrl(USERS.BY_ID(uid)), { headers: { Authorization: `Bearer ${token}` } });
          const uj = await ur.json().catch(() => null);
          if (!cancelled && ur.ok && uj?.data) {
            setUserPoints(Number(uj.data.points ?? 0));
          }
          await loadWallet();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadWallet]);

  const filtered = useMemo(() => catalog.filter((v) => {
    const matchFilter =
      filter === "all" ||
      (filter === "active"  && v.status === "active")  ||
      (filter === "expired" && v.status === "expired") ||
      (filter === "mine"    && redeemedIds.includes(v.Vouchers_id));
    const matchSearch =
      String(v.Code || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.discount_type === "fixed" ? fmt(v.value) : `${v.value}%`)
        .toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [catalog, filter, search, redeemedIds]);

  const handleRedeem = async () => {
    if (!selected) return;
    const token = getAccessToken();
    if (!token) {
      navigate("/login", { state: { from: "/voucher" } });
      return;
    }
    setRedeemBusy(true);
    try {
      const res = await apiFetch(ME.REDEEM_VOUCHER, {
        method: "POST",
        body: JSON.stringify({ voucherId: selected.Vouchers_id }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) {
        navigate("/login", { state: { from: "/voucher" } });
        return;
      }
      if (!res.ok) {
        window.alert(body?.message || "Không đổi được voucher");
        return;
      }
      setRedeemedIds((r) => [...new Set([...r, selected.Vouchers_id])]);
      setUserPoints((p) => Math.max(0, p - selected.point_voucher));
      setSuccessCode(selected.Code);
      setShowModal(false);
      setSelected(null);
      await loadWallet();
    } catch {
      window.alert("Lỗi kết nối");
    } finally {
      setRedeemBusy(false);
    }
  };

  return (
    <Layout>
      <style>{`
        :root {
          --purple:  #e11d48;
          --pink:    #f43f5e;
          --yellow:  #fb7185;
          --dark:    #09090b;
        }

        .voucher-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% -15%, rgba(244, 63, 94, 0.12) 0%, transparent 55%),
            linear-gradient(180deg, #09090b 0%, #18181b 100%);
          font-family: var(--font-ui), system-ui, sans-serif;
          padding: 32px 0 60px;
        }

        .page-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(38px,7vw,64px); letter-spacing:4px; line-height:1; color:#fff; }
        .page-title span { color:#f43f5e; }

        .points-badge { background:linear-gradient(135deg,#e11d48,#f43f5e); border-radius:14px; padding:14px 24px; display:inline-flex; align-items:center; gap:12px; box-shadow:0 0 32px rgba(244,63,94,0.28); }
        .points-badge .pts-num { font-family:'Bebas Neue',sans-serif; font-size:36px; color:#fecdd3; line-height:1; letter-spacing:2px; }
        .points-badge .pts-label { font-size:11px; font-weight:700; color:rgba(255,255,255,0.75); text-transform:uppercase; letter-spacing:1.5px; }

        .filter-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .filter-btn { font-family: var(--font-ui), system-ui, sans-serif; font-weight:700; font-size:12px; letter-spacing:1px; text-transform:uppercase; padding:8px 18px; border-radius:9999px; border:1.5px solid rgba(63,63,70,0.9); background:transparent; color:rgba(161,161,170,0.95); cursor:pointer; transition:all 0.2s ease; }
        .filter-btn:hover { border-color:#f43f5e; color:#fb7185; }
        .filter-btn.active { background:rgba(244,63,94,0.15); border-color:#f43f5e; color:#f43f5e; }

        .search-box .form-control { background:rgba(24,24,27,0.9) !important; border:1.5px solid rgba(63,63,70,0.9) !important; border-right:none !important; color:#fff !important; font-size:13px; border-radius:10px 0 0 10px !important; }
        .search-box .form-control::placeholder { color:rgba(161,161,170,0.8); }
        .search-box .form-control:focus { border-color:#f43f5e !important; box-shadow:none !important; }
        .search-box .input-group-text { background:rgba(24,24,27,0.9) !important; border:1.5px solid rgba(63,63,70,0.9) !important; border-left:none !important; color:rgba(161,161,170,0.9); border-radius:0 10px 10px 0 !important; }

        .voucher-card { background:rgba(24,24,27,0.95); border:1px solid rgba(63,63,70,0.85); border-radius:16px; overflow:hidden; transition:transform 0.25s ease,box-shadow 0.25s ease,border-color 0.25s ease; position:relative; cursor:pointer; }
        .voucher-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.45); border-color:rgba(244,63,94,0.35); }
        .voucher-card.expired { opacity:0.5; filter:grayscale(0.4); cursor:default; }
        .voucher-card.redeemed-card { border-color:rgba(244,63,94,0.45); }

        .card-stripe { position:absolute; left:0; top:0; bottom:0; width:4px; background:linear-gradient(180deg,#e11d48,#f43f5e); }
        .voucher-card.expired .card-stripe { background:rgba(255,255,255,0.2); }
        .voucher-card.redeemed-card .card-stripe { background:#f43f5e; }
        .card-body-inner { padding:20px 20px 20px 24px; }

        .discount-value { font-family:'Bebas Neue',sans-serif; font-size:42px; line-height:1; letter-spacing:1px; background:linear-gradient(135deg,#fb7185,#f43f5e); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .discount-unit { font-family:'Bebas Neue',sans-serif; font-size:18px; color:rgba(255,255,255,0.5); letter-spacing:1px; }

        .code-chip { font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:3px; background:rgba(255,255,255,0.06); border:1px dashed rgba(255,255,255,0.2); color:rgba(255,255,255,0.7); padding:4px 12px; border-radius:6px; display:inline-block; }

        .meta-row { font-size:11.5px; color:rgba(255,255,255,0.4); font-weight:600; letter-spacing:0.3px; }
        .meta-row strong { color:rgba(255,255,255,0.65); }

        .point-cost { display:inline-flex; align-items:center; gap:5px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.28); border-radius:8px; padding:5px 12px; font-family:'Bebas Neue',sans-serif; font-size:18px; color:#fb7185; letter-spacing:1.5px; }
        .point-cost.not-enough { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); color:rgba(255,255,255,0.25); }

        .btn-redeem { background:linear-gradient(135deg,#e11d48,#f43f5e) !important; border:none !important; color:#fff !important; font-weight:800; font-size:12px; letter-spacing:0.5px; border-radius:8px !important; padding:8px 18px !important; box-shadow:0 0 16px rgba(244,63,94,0.25); transition:box-shadow 0.25s,transform 0.2s !important; }
        .btn-redeem:hover { box-shadow:0 0 28px rgba(244,63,94,0.45) !important; transform:translateY(-1px); }
        .btn-redeem:disabled { background:rgba(255,255,255,0.08) !important; box-shadow:none !important; color:rgba(255,255,255,0.25) !important; transform:none !important; }
        .btn-redeemed { background:transparent !important; border:1.5px solid #f43f5e !important; color:#fb7185 !important; font-weight:800; font-size:12px; letter-spacing:0.5px; border-radius:8px !important; padding:8px 18px !important; cursor:default !important; }

        .status-pill { font-family:'Syne',sans-serif; font-weight:700; font-size:10px; letter-spacing:1px; text-transform:uppercase; padding:3px 10px; border-radius:20px; }
        .status-pill.active-pill  { background:rgba(76,175,80,0.15);    color:#81c784;              border:1px solid rgba(76,175,80,0.3); }
        .status-pill.expired-pill { background:rgba(255,255,255,0.06);  color:rgba(255,255,255,0.3); border:1px solid rgba(255,255,255,0.1); }

        .card-divider { height:1px; background:rgba(255,255,255,0.05); margin:12px 0; }

        .empty-state { text-align:center; padding:80px 20px; color:rgba(255,255,255,0.25); }
        .empty-state .empty-icon { font-size:56px; margin-bottom:16px; opacity:0.5; }
        .empty-state p { font-size:14px; font-weight:600; }
        .result-count { font-size:12px; color:rgba(255,255,255,0.3); font-weight:600; letter-spacing:0.5px; }

        /* ════ MODAL — override toàn bộ Bootstrap ════ */
        .modal-content {
          background: #18181b !important;
          border: 1px solid rgba(63,63,70,0.95) !important;
          border-radius: 20px !important;
          color: #fff !important;
        }
        .modal-header {
          background: #18181b !important;
          border-bottom: 1px solid rgba(63,63,70,0.85) !important;
          padding: 20px 24px !important;
        }
        .modal-body {
          background: #18181b !important;
          color: rgba(255,255,255,0.75) !important;
          padding: 24px !important;
        }
        .modal-footer {
          background: #18181b !important;
          border-top: 1px solid rgba(63,63,70,0.85) !important;
          padding: 16px 24px !important;
        }
        /* Force tất cả text bên trong modal-body sang màu sáng */
        .modal-body * { color: rgba(255,255,255,0.75) !important; }
        /* Các helper class để override lại đúng màu */
        .modal-body .c-white    { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        .modal-body .c-yellow   { color: #fb7185 !important; -webkit-text-fill-color: #fb7185 !important; }
        .modal-body .c-muted    { color: rgba(255,255,255,0.45) !important; -webkit-text-fill-color: rgba(255,255,255,0.45) !important; }
        .modal-body .c-gradient {
          background: linear-gradient(135deg, #fb7185, #e11d48) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
        }
        .modal-title { color: #fff !important; font-family: 'Bebas Neue', sans-serif !important; font-size: 24px !important; letter-spacing: 3px !important; }
        .btn-close { filter: invert(1) opacity(0.5) !important; }
      `}</style>

      {loading ? (
        <div className="text-center py-5 mt-5">
          <Spinner animation="border" variant="light" />
          <p className="text-white-50 small mt-2">Đang tải danh sách voucher…</p>
        </div>
      ) : null}
      <div className="voucher-page mt-5">
        <Container fluid="xl">

          {/* HEADER */}
          <Row className="align-items-end mb-4 gy-3">
            <Col>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>
                🎟 Đổi điểm lấy ưu đãi
              </p>
              <h1 className="page-title mb-0">ĐỔI <span>VOUCHER</span></h1>
            </Col>
            <Col xs="auto">
              <div className="points-badge">
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:2 }}>Điểm của bạn</div>
                  <div className="pts-num">{userPoints.toLocaleString()}</div>
                  <div className="pts-label">điểm tích lũy</div>
                </div>
                <div style={{ fontSize:32 }}>⭐</div>
              </div>
            </Col>
          </Row>

          {/* FILTER + SEARCH */}
          <Row className="align-items-center mb-4 gy-2">
            <Col>
              <div className="filter-bar">
                {[
                  { key:"all",     label:"Tất cả" },
                  { key:"active",  label:"Còn hạn" },
                  { key:"expired", label:"Hết hạn" },
                  { key:"mine",    label:`Đã đổi (${redeemedIds.length})` },
                ].map(({ key, label }) => (
                  <button key={key} className={`filter-btn${filter===key?" active":""}`} onClick={() => setFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </Col>
            <Col xs={12} md="auto">
              <InputGroup className="search-box" style={{ maxWidth:280 }}>
                <Form.Control placeholder="Tìm voucher..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <InputGroup.Text>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>

          <div className="result-count mb-3">{filtered.length} voucher</div>

          {/* SUCCESS BANNER */}
          {successCode && (
            <div className="mb-4 p-3" style={{ background:"rgba(244,63,94,0.1)", border:"1.5px solid rgba(244,63,94,0.35)", borderRadius:12, display:"flex", alignItems:"center", gap:12, color:"#fb7185", fontWeight:700, fontSize:14 }}>
              <span style={{ fontSize:22 }}>🎉</span>
              Đổi thành công! Mã <span style={{ fontFamily:"'Bebas Neue'", letterSpacing:2, fontSize:16, margin:"0 6px" }}>{successCode}</span> đã được thêm vào tài khoản.
              <button onClick={() => setSuccessCode(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(244,63,94,0.6)", cursor:"pointer", fontSize:18 }}>×</button>
            </div>
          )}

          {/* VOUCHER GRID */}
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎟</div><p>Không tìm thấy voucher nào</p></div>
          ) : (
            <Row className="g-3">
              {filtered.map((v) => {
                const isExpired  = v.status === "expired";
                const isRedeemed = redeemedIds.includes(v.Vouchers_id);
                const enough     = userPoints >= v.point_voucher;
                const isFree     = v.point_voucher === 0;
                return (
                  <Col key={v.Vouchers_id} xs={12} sm={6} xl={4}>
                    <div
                      className={`voucher-card h-100${isExpired?" expired":""}${isRedeemed?" redeemed-card":""}`}
                      onClick={() => { if (!isExpired && !isRedeemed) { setSelected(v); setShowModal(true); } }}
                    >
                      <div className="card-stripe" />
                      <div className="card-body-inner">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span className="code-chip">{v.Code}</span>
                          <span className={`status-pill ${v.status==="active"?"active-pill":"expired-pill"}`}>
                            {v.status==="active"?"Còn hạn":"Hết hạn"}
                          </span>
                        </div>
                        <div className="d-flex align-items-baseline gap-2 mb-1">
                          <span className="discount-value">
                            {v.discount_type==="fixed" ? (v.value/1000).toFixed(0)+"K" : v.value+"%"}
                          </span>
                          <span className="discount-unit">GIẢM</span>
                        </div>
                        <div className="card-divider" />
                        <div className="meta-row mb-1">🛒 Đơn tối thiểu: <strong>{fmt(v.min_order_value)}</strong></div>
                        <div className="meta-row mb-3">📅 <strong>{fmtDate(v.start_date)}</strong> – <strong>{fmtDate(v.end_date)}</strong></div>
                        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                          {isFree
                            ? <span style={{ fontSize:12, fontWeight:700, color:"#81c784" }}>🎁 Miễn phí</span>
                            : <span className={`point-cost${!enough?" not-enough":""}`}>⭐ {v.point_voucher.toLocaleString()} điểm</span>
                          }
                          {isRedeemed ? (
                            <button className="btn-redeemed" onClick={(e) => e.stopPropagation()}>✓ Đã đổi</button>
                          ) : isExpired ? (
                            <button className="btn-redeem" disabled onClick={(e) => e.stopPropagation()}>Hết hạn</button>
                          ) : isFree ? (
                            <button className="btn-redeem" onClick={(e) => { e.stopPropagation(); setSelected(v); setShowModal(true); }}>Nhận ngay</button>
                          ) : !enough ? (
                            <button className="btn-redeem" disabled onClick={(e) => e.stopPropagation()}>Không đủ điểm</button>
                          ) : (
                            <button className="btn-redeem" onClick={(e) => { e.stopPropagation(); setSelected(v); setShowModal(true); }}>Đổi ngay →</button>
                          )}
                        </div>
                        {!isFree && !isExpired && !isRedeemed && !enough && (
                          <div style={{ marginTop:10, fontSize:11, color:"rgba(233,30,140,0.7)", fontWeight:600 }}>
                            ⚠ Cần thêm {(v.point_voucher - userPoints).toLocaleString()} điểm
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </div>

      {/* CONFIRM MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>XÁC NHẬN ĐỔI VOUCHER</Modal.Title>
        </Modal.Header>

        {selected && (
          <Modal.Body>
            {/* Tên giảm giá */}
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:20, marginBottom:16, border:"1px solid rgba(255,255,255,0.08)" }}>
              <div
                className="c-gradient"
                style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:2 }}
              >
                {selected.discount_type==="fixed" ? `Giảm ${fmt(selected.value)}` : `Giảm ${selected.value}%`}
              </div>
              <div className="c-muted" style={{ fontFamily:"'Bebas Neue'", fontSize:16, letterSpacing:3, marginTop:4 }}>
                MÃ: {selected.Code}
              </div>
            </div>

            {/* Thông tin */}
            <div style={{ fontSize:13, lineHeight:2, fontWeight:600 }}>
              <div>🛒 Đơn tối thiểu: <span className="c-white">{fmt(selected.min_order_value)}</span></div>
              <div>📅 Hết hạn: <span className="c-white">{fmtDate(selected.end_date)}</span></div>
              {selected.point_voucher > 0 && (
                <div>⭐ Chi phí: <span className="c-yellow">{selected.point_voucher.toLocaleString()} điểm</span></div>
              )}
            </div>

            {/* Điểm còn lại */}
            {selected.point_voucher > 0 && (
              <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(244,63,94,0.08)", borderRadius:10, border:"1px solid rgba(244,63,94,0.25)", fontSize:13, fontWeight:600 }}>
                Số điểm sau khi đổi:{" "}
                <span className="c-yellow" style={{ fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:1 }}>
                  {(userPoints - selected.point_voucher).toLocaleString()} điểm
                </span>
              </div>
            )}
          </Modal.Body>
        )}

        <Modal.Footer>
          <Button
            variant="link"
            style={{ color:"rgba(255,255,255,0.4)", fontFamily:"'Syne'", fontWeight:700, fontSize:13, textDecoration:"none" }}
            onClick={() => setShowModal(false)}
          >
            Hủy
          </Button>
          <Button className="btn-redeem" disabled={redeemBusy} onClick={handleRedeem}>
            {redeemBusy ? "…" : "✓ Xác nhận đổi"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}