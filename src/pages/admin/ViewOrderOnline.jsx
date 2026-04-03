import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Card, Spinner } from "react-bootstrap";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { apiFetch } from "../../utils/apiClient";
import { ORDERS_ONLINE } from "../../constants/apiEndpoints";

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
}

function formatDt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("vi-VN");
}

function statusLabel(s) {
  if (s === 0) return "Chờ thanh toán";
  if (s === 2) return "Đã hủy";
  return "Hoàn thành";
}

export default function ViewOrderOnline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let m = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await apiFetch(ORDERS_ONLINE.BY_ID(id));
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          if (m) setErr(json?.message || "Không tải được đơn");
          return;
        }
        const data = json?.data ?? json;
        if (m) setOrder(data);
      } catch {
        if (m) setErr("Không thể kết nối server");
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, [id]);

  return (
    <div className="px-2 px-md-3 pb-5">
      <div className="d-flex align-items-center gap-2 mb-4">
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(`${prefix}/invoices`)}>
          <ArrowLeft size={16} className="me-1" />
          Danh sách
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h4 className="d-flex align-items-center gap-2 mb-0">
            <ReceiptText className="text-primary" />
            Chi tiết đơn online
          </h4>
          <p className="text-muted small mb-0 mt-2">Mã đơn #{id}</p>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : err ? (
            <p className="text-danger mb-0">{err}</p>
          ) : !order ? (
            <p className="text-muted mb-0">Không có dữ liệu</p>
          ) : (
            <dl className="row mb-0">
              <dt className="col-sm-3 text-muted">Mã đơn (orderCode)</dt>
              <dd className="col-sm-9 fw-semibold">{order.orderCode || "—"}</dd>

              <dt className="col-sm-3 text-muted">Khách</dt>
              <dd className="col-sm-9">{order.customerName || "—"}</dd>

              <dt className="col-sm-3 text-muted">Email</dt>
              <dd className="col-sm-9">{order.customerEmail || "—"}</dd>

              <dt className="col-sm-3 text-muted">Thời gian</dt>
              <dd className="col-sm-9">{formatDt(order.createdAt)}</dd>

              <dt className="col-sm-3 text-muted">Trạng thái</dt>
              <dd className="col-sm-9">{statusLabel(order.status)}</dd>

              <dt className="col-sm-3 text-muted">Giá gốc</dt>
              <dd className="col-sm-9">{formatMoney(order.originalAmount)}</dd>

              <dt className="col-sm-3 text-muted">Giảm giá</dt>
              <dd className="col-sm-9">{formatMoney(order.discountAmount)}</dd>

              <dt className="col-sm-3 text-muted">Thanh toán</dt>
              <dd className="col-sm-9 text-success fw-bold">{formatMoney(order.finalAmount)}</dd>
            </dl>
          )}
        </Card.Body>
        <Card.Footer className="bg-white border-0 pb-4">
          <Link to={`${prefix}/invoices`} className="btn btn-primary">
            Quay lại danh sách
          </Link>
        </Card.Footer>
      </Card>
    </div>
  );
}
