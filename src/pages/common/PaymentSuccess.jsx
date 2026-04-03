import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";

/**
 * PayOS redirect về đây — query thường có orderCode (tuỳ bản PayOS).
 * Webhook BE đã xác nhận thanh toán; trang này chỉ thông báo cho người dùng.
 */
const PaymentSuccess = () => {
  useEffect(() => {
    try {
      sessionStorage.removeItem("payos_pending_order_code");
      sessionStorage.removeItem("payos_pending_kind");
    } catch {
      /* ignore */
    }
  }, []);

  const [params] = useSearchParams();
  const orderCode =
    params.get("orderCode") ||
    params.get("order_code") ||
    params.get("id") ||
    null;
  const code = params.get("code");

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
            <div className="bg-success bg-opacity-10 d-inline-block p-4 rounded-circle">
              <i className="fas fa-check-circle fa-5x text-success" />
            </div>
          </div>
          <h2 className="fw-bold mb-3">Thanh toán thành công</h2>
          <p className="text-muted mb-4">
            Giao dịch đã được ghi nhận. Vé và/hoặc đơn bắp nước được kích hoạt trong hệ thống. Nếu chưa thấy cập nhật ngay,
            vui lòng đợi vài giây (webhook PayOS).
          </p>
          {orderCode ? (
            <div className="bg-light p-3 rounded-4 mb-3 border border-dashed">
              <small className="text-uppercase text-muted fw-bold">Mã giao dịch / đơn</small>
              <h4 className="fw-bold text-dark mt-1 mb-0 text-break">{orderCode}</h4>
            </div>
          ) : null}
          {code ? (
            <p className="small text-muted mb-4">
              Mã trả về: <code>{code}</code>
            </p>
          ) : null}
          <div className="d-grid gap-2">
            <Link to="/" className="btn btn-gradient rounded-pill py-3 fw-bold shadow">
              VỀ TRANG CHỦ
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary rounded-pill py-2 fw-bold border-0">
              Hồ sơ
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
