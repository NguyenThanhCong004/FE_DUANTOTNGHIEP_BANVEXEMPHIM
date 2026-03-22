import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import { ArrowDownLeft, ArrowUpRight, Package } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { CINEMAS } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
}

function isComboCategory(name) {
  return String(name || "")
    .toLowerCase()
    .includes("combo");
}

export default function ProductManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId, selectedCinemaName } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [onSale, setOnSale] = useState([]);
  const [notOnSale, setNotOnSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  const loadMenu = useCallback(async () => {
    if (effectiveCinemaId == null) {
      setOnSale([]);
      setNotOnSale([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU(effectiveCinemaId));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setOnSale([]);
        setNotOnSale([]);
        return;
      }
      const data = json?.data ?? json;
      setOnSale(Array.isArray(data?.onSale) ? data.onSale : []);
      setNotOnSale(Array.isArray(data?.notOnSale) ? data.notOnSale : []);
    } catch {
      setOnSale([]);
      setNotOnSale([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const toggleSelling = async (productId, selling) => {
    if (effectiveCinemaId == null) return;
    setBusyId(productId);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU_SELLING(effectiveCinemaId, productId), {
        method: "PUT",
        body: JSON.stringify({ selling }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Cập nhật thất bại");
        return;
      }
      await loadMenu();
    } catch {
      alert("Không thể kết nối server");
    } finally {
      setBusyId(null);
    }
  };

  const filterRows = (rows, q) => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        String(r.name || "").toLowerCase().includes(s) ||
        String(r.categoryName || "").toLowerCase().includes(s)
    );
  };

  const filteredOnSale = useMemo(() => filterRows(onSale, searchA), [onSale, searchA]);
  const filteredNotOnSale = useMemo(() => filterRows(notOnSale, searchB), [notOnSale, searchB]);

  const cinemaLabel =
    effectiveCinemaId != null
      ? selectedCinemaName || `Rạp #${effectiveCinemaId}`
      : null;

  const renderTable = (rows, mode) => (
    <div className="table-responsive">
      <Table hover className="align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ minWidth: 200 }}>Sản phẩm / Combo</th>
            <th>Loại</th>
            <th className="text-end">Giá</th>
            <th style={{ minWidth: 160 }} className="text-end">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-4">
                Không có mục nào
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const combo = isComboCategory(r.categoryName);
              const id = r.productId;
              return (
                <tr key={`${mode}-${id}`}>
                  <td>
                    <div className="fw-semibold">{r.name}</div>
                    {r.description ? (
                      <div className="small text-muted text-truncate" style={{ maxWidth: 280 }}>
                        {r.description}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {r.categoryName ? (
                      <Badge bg={combo ? "warning" : "secondary"} text={combo ? "dark" : undefined}>
                        {combo ? "Combo" : r.categoryName}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-end">{formatMoney(r.price)}</td>
                  <td className="text-end">
                    {mode === "on" ? (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={busyId === id}
                        onClick={() => toggleSelling(id, false)}
                        title="Xóa dòng khỏi bảng cinema_products"
                      >
                        {busyId === id ? <Spinner animation="border" size="sm" /> : "Xóa khỏi menu rạp"}
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        disabled={busyId === id}
                        onClick={() => toggleSelling(id, true)}
                        title="Thêm dòng vào bảng cinema_products (mở bán)"
                      >
                        {busyId === id ? <Spinner animation="border" size="sm" /> : "Thêm vào menu rạp"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );

  return (
    <div className="product-management px-2 px-md-3 pb-4">
      <style>{`
        .pm-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.75rem 1.5rem;
          margin: 0 -0.5rem 1.5rem;
          border-radius: 0 0 1rem 1rem;
        }
        @media (min-width: 768px) {
          .pm-header { margin: 0 0 1.5rem; border-radius: 1rem; }
        }
      `}</style>

      <div className="pm-header">
        <div>
          <h1 className="h4 mb-1 d-flex align-items-center gap-2">
            <Package size={22} /> Sản phẩm &amp; Combo
          </h1>
          <p className="mb-0 small opacity-90">
            <strong>Đang bán</strong> = có trong <code>cinema_products</code>. <strong>Chưa bán</strong> = chưa có dòng đó. Xóa = gỡ bản ghi khỏi DB.
          </p>
          {cinemaLabel ? (
            <p className="mb-0 mt-2 small">
              <Badge bg="light" text="dark">
                {cinemaLabel}
              </Badge>
            </p>
          ) : null}
        </div>
      </div>

      {effectiveCinemaId == null ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5 text-muted">
            <h5 className="text-dark">Chưa chọn rạp</h5>
            <p className="mb-0 small">
              {isSuperAdmin
                ? "Vui lòng chọn rạp ở sidebar (Super Admin)."
                : "Tài khoản chưa được gán rạp (cinemaId). Liên hệ Super Admin."}
            </p>
          </Card.Body>
        </Card>
      ) : loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-4 w-100 pm-tables-stack">
          <Card className="border-0 shadow-sm w-100">
            <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-2 bg-success bg-opacity-10 border-0">
              <div className="d-flex align-items-center gap-2 fw-bold text-success">
                <ArrowUpRight size={18} />
                Bảng 1 — Đang bán tại rạp
                <Badge bg="success">{onSale.length}</Badge>
              </div>
              <Form.Control
                size="sm"
                placeholder="Tìm đang bán…"
                className="pm-search"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
              />
            </Card.Header>
            <Card.Body className="p-0">{renderTable(filteredOnSale, "on")}</Card.Body>
          </Card>

          <Card className="border-0 shadow-sm w-100">
            <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-2 bg-secondary bg-opacity-10 border-0">
              <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                <ArrowDownLeft size={18} />
                Bảng 2 — Chưa bán (chưa mở tại rạp)
                <Badge bg="secondary">{notOnSale.length}</Badge>
              </div>
              <Form.Control
                size="sm"
                placeholder="Tìm chưa bán…"
                className="pm-search"
                value={searchB}
                onChange={(e) => setSearchB(e.target.value)}
              />
            </Card.Header>
            <Card.Body className="p-0">{renderTable(filteredNotOnSale, "off")}</Card.Body>
          </Card>
        </div>
      )}

      <style>{`
        .pm-tables-stack { max-width: 100%; }
        .pm-search { max-width: min(100%, 280px); }
      `}</style>
    </div>
  );
}
