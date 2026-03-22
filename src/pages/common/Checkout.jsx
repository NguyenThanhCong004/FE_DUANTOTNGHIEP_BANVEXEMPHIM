import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";

/**
 * Trang legacy `/checkout` — luồng chính: đặt vé (`/booking/:id`) hoặc bắp nước (`/foodorder`) rồi PayOS.
 */
const Checkout = () => {
  return (
    <Layout>
      <div className="container py-5 mt-5 text-white">
        <div className="mb-4">
          <Link to="/" className="btn btn-outline-light rounded-pill fw-bold">
            <i className="fas fa-arrow-left me-2" /> Trang chủ
          </Link>
        </div>
        <div
          className="p-4 p-md-5 rounded-4 border border-white border-opacity-10"
          style={{ background: "rgba(20,22,50,0.85)", maxWidth: 640 }}
        >
          <h1 className="h4 fw-black text-uppercase mb-3">Thanh toán</h1>
          <p className="text-white-50 small mb-4">
            Hệ thống dùng <strong className="text-warning">PayOS</strong>: sau khi chọn vé hoặc bắp nước, bạn được chuyển sang trang thanh toán của PayOS. Không cần vào trang này trực tiếp.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/movies" className="btn btn-warning rounded-pill fw-bold px-4">
              Đặt vé phim
            </Link>
            <Link to="/foodorder" className="btn btn-outline-light rounded-pill fw-bold px-4">
              Đặt bắp nước
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
