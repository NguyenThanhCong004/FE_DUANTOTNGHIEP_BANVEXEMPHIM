import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import { Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import EventCard from "../../components/common/EventCard";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch } from "../../utils/apiClient";
import { NEWS } from "../../constants/apiEndpoints";

function mapNewsToEvent(n) {
  const id = n.id ?? n.newsId;
  const created = n.createdAt;
  let startDate = created;
  if (Array.isArray(created) && created.length >= 3) {
    startDate = new Date(created[0], created[1] - 1, created[2]).toISOString();
  }
  return {
    id,
    title: n.title ?? "Tin tức",
    posterUrl: n.image || n.imageUrl,
    imageUrl: n.image,
    startDate,
  };
}

const Events = () => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [raw, setRaw] = useState([]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(NEWS.LIST);
        const body = await res.json().catch(() => null);
        if (c) return;
        if (!res.ok) {
          setLoadError(body?.message || "Không tải được tin tức");
          setRaw([]);
          return;
        }
        const list = Array.isArray(body?.data) ? body.data : [];
        const pub = list.filter((x) => (x.status ?? 1) === 1);
        setRaw(pub.map(mapNewsToEvent));
      } catch {
        if (!c) setLoadError("Không kết nối được máy chủ");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const events = useMemo(() => raw, [raw]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => String(e.title ?? "").toLowerCase().includes(q));
  }, [events, keyword]);

  return (
    <Layout>
      <div className="container py-5 mt-5">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="text-white-50 small mt-2">Đang tải sự kiện / tin tức…</p>
          </div>
        ) : null}
        {!loading && loadError ? (
          <div className="alert alert-warning border-0 shadow-sm">{loadError}</div>
        ) : null}

        <div className="row mb-5 align-items-end g-3">
          <div className="col-lg-4">
            <h2
              className="fw-black text-white text-uppercase tracking-tighter m-0 display-5"
              style={{ fontWeight: 900 }}
            >
              Danh Sách Sự Kiện
            </h2>
            <div style={{ height: "6px", width: "80px", background: "var(--primary-gradient)", borderRadius: "10px" }} />
            <p className="small text-white-50 mt-2 mb-0">Nội dung lấy từ tin tức (News) trên hệ thống.</p>
          </div>

          <div className="col-lg-8">
            <div className="card p-3 border-0 shadow-sm bg-white bg-opacity-10 rounded-4" style={{ backdropFilter: "blur(20px)" }}>
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white bg-opacity-10 border-0 ps-3 text-white opacity-50">
                      <i className="fas fa-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-white bg-opacity-10 border-0 py-2 shadow-none text-white"
                      placeholder="Tìm sự kiện..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <div style={{ color: "rgba(255,255,255,0.25)", fontWeight: 700, fontSize: 12 }}>
                    {filtered.length} mục
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!loading && filtered.length > 0 ? (
          <div className="row g-4">
            {filtered.map((e) => (
              <div key={e.id} className="col-6 col-md-3">
                <EventCard event={e} />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !loadError && filtered.length === 0 ? (
          <EmptyState
            title="Chưa có tin / sự kiện"
            subtitle="Thêm tin tức (status công khai) trong quản trị."
            action={
              <Link to="/movies" className="btn btn-gradient rounded-pill px-5 fw-bold">
                Khám phá phim
              </Link>
            }
          />
        ) : null}
      </div>
    </Layout>
  );
};

export default Events;
