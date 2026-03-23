import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { apiFetch } from "../../utils/apiClient";
import { TICKET_ORDERS, FOOD_ORDERS } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";

/**
 * PayOS redirect khi hủy — gọi BE xóa đơn chờ + trả ghế (vé).
 */
const PaymentCancel = () => {
  const [cancelNote, setCancelNote] = useState("Đang hủy đơn chờ và trả ghế (nếu có)…");

  useEffect(() => {
    let alive = true;
    (async () => {
      let codeStr = null;
      try {
        codeStr = sessionStorage.getItem("payos_pending_order_code");
      } catch {
        /* ignore */
      }
      if (!codeStr) {
        if (alive) setCancelNote(null);
        return;
      }
      const code = Number(codeStr);
      if (!Number.isFinite(code) || code <= 0) {
        try {
          sessionStorage.removeItem("payos_pending_order_code");
          sessionStorage.removeItem("payos_pending_kind");
        } catch {
          /* ignore */
        }
        if (alive) setCancelNote(null);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        if (alive) setCancelNote("Bạn chưa đăng nhập — không thể hủy đơn chờ tự động. Mã đơn vẫn lưu trên thiết bị; đăng nhập và quay lại trang này nếu cần.");
        return;
      }

      let kind = "ticket";
      try {
        kind = sessionStorage.getItem("payos_pending_kind") || "ticket";
      } catch {
        kind = "ticket";
      }
      const path = kind === "food" ? FOOD_ORDERS.CANCEL_PENDING : TICKET_ORDERS.CANCEL_PENDING;

      try {
        const res = await apiFetch(path, {
          method: "POST",
          body: JSON.stringify({ payosOrderCode: code }),
        });
        const body = await res.json().catch(() => null);
        if (alive) {
          if (res.ok) {
            setCancelNote("Đã hủy đơn chờ — ghế được trả lại để bán.");
          } else if (res.status === 404) {
            setCancelNote(body?.message || "Đơn không còn (có thể đã thanh toán hoặc đã hủy trước đó).");
          } else {
            setCancelNote(body?.message || "Không hủy được đơn chờ — thử đặt lại hoặc liên hệ quầy vé.");
          }
        }
      } catch {
        if (alive) setCancelNote("Không kết nối được máy chủ để hủy đơn chờ.");
      } finally {
        try {
          sessionStorage.removeItem("payos_pending_order_code");
          sessionStorage.removeItem("payos_pending_kind");
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
            <div className="bg-warning bg-opacity-10 d-inline-block p-4 rounded-circle">
              <i className="fas fa-times-circle fa-5x text-warning" />
            </div>
          </div>
          <h2 className="fw-bold mb-3">Đã hủy thanh toán</h2>
          {cancelNote ? <p className="text-muted mb-4">{cancelNote}</p> : null}
          <p className="text-muted mb-4">
            Bạn có thể chọn suất khác hoặc thanh toán lại. Ghế không còn bị giữ bởi đơn chờ (sau khi hệ thống xử lý hủy).
          </p>
          <div className="d-grid gap-2">
            <Link to="/movies" className="btn btn-gradient rounded-pill py-3 fw-bold shadow">
              CHỌN SUẤT KHÁC
            </Link>
            <Link to="/" className="btn btn-outline-secondary rounded-pill py-2 fw-bold border-0">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCancel;
