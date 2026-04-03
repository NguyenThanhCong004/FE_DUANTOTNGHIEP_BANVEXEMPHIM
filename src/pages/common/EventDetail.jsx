import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import EmptyState from "../../components/common/EmptyState";
import { Spinner } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { NEWS } from "../../constants/apiEndpoints";

const EventDetail = () => {
  const { id } = useParams();
  const newsId = Number(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!Number.isFinite(newsId) || newsId <= 0) {
      setError("Mã không hợp lệ");
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(NEWS.BY_ID(newsId));
        const body = await res.json().catch(() => null);
        if (c) return;
        if (!res.ok) {
          setError(body?.message || "Không tìm thấy");
          setItem(null);
          return;
        }
        setItem(body?.data || null);
      } catch {
        if (!c) setError("Lỗi kết nối");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [newsId]);

  return (
    <Layout>
      <div className="container py-5 mt-5 text-white">
        <div className="mb-4">
          <Link to="/events" className="btn btn-light rounded-pill shadow-sm fw-bold">
            <i className="fas fa-arrow-left me-2" />
            Quay lại
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
          </div>
        ) : null}

        {!loading && error ? (
          <EmptyState title="Không tải được" subtitle={error} />
        ) : null}

        {!loading && item ? (
          <div className="row g-4">
            <div className="col-md-4">
              {item.image ? (
                <img src={item.image} alt="" className="w-100 rounded-4 shadow" style={{ aspectRatio: "2/3", objectFit: "cover" }} />
              ) : (
                <div className="ratio ratio-2x3 bg-secondary rounded-4" />
              )}
            </div>
            <div className="col-md-8">
              <h1 className="fw-black text-uppercase mb-3">{item.title}</h1>
              {item.createdAt ? (
                <p className="text-white-50 small">
                  {Array.isArray(item.createdAt)
                    ? new Date(item.createdAt[0], item.createdAt[1] - 1, item.createdAt[2]).toLocaleDateString("vi-VN")
                    : new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </p>
              ) : null}
              {item.content ? (
                <div className="text-white-75 small" style={{ whiteSpace: "pre-line" }}>
                  {item.content}
                </div>
              ) : item.description ? (
                <div className="text-white-75 small" style={{ whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!loading && !error && !item ? (
          <EmptyState title="Không có dữ liệu" subtitle={`id=${id}`} />
        ) : null}
      </div>
    </Layout>
  );
};

export default EventDetail;
