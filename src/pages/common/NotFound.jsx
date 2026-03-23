import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div className="container min-vh-100 d-flex flex-column align-items-center justify-content-center text-center">
        <h1 className="display-1 fw-black text-light" style={{ fontSize: '150px', fontWeight: 900 }}>404</h1>
        <h2 className="fw-bold text-white text-uppercase mt-n5 mb-4">Ối! Trang không tồn tại</h2>
        <p className="text-light mb-5 opacity-75" style={{ maxWidth: '500px' }}>
          Có vẻ như đường dẫn bạn đang truy cập đã bị xóa hoặc không tồn tại.
        </p>
        <Link to="/" className="btn btn-gradient rounded-pill px-5 py-3 fw-bold shadow">
          QUAY LẠI TRANG CHỦ
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
