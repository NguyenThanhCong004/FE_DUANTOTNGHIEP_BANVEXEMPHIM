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
    return () => { c = true; };
  }, []);

  const events = useMemo(() => raw, [raw]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => String(e.title ?? "").toLowerCase().includes(q));
  }, [events, keyword]);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        .ev-page {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
        }

        .ev-page {
          min-height: 100vh;
          background: var(--navy);
          padding: 80px 0 60px;
        }

        /* ── HEADER ── */
        .ev-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .ev-title-block {}

        .ev-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 48px);
          letter-spacing: 4px;
          color: var(--off-white);
          margin: 0 0 10px;
          line-height: 1;
        }
        .ev-title span { color: var(--yellow); }

        .ev-strip {
          height: 3px;
          width: 70px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          border-radius: 2px;
          margin-bottom: 10px;
        }

        .ev-subtitle {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.35);
          margin: 0;
        }

        /* ── SEARCH BAR ── */
        .ev-search-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,255,0,0.12);
          border-radius: 14px;
          padding: 16px 20px;
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 320px;
        }

        .ev-search-wrap {
          display: flex;
          align-items: stretch;
          flex: 1;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color .3s, box-shadow .3s;
        }
        .ev-search-wrap:focus-within {
          border-color: var(--yellow);
          box-shadow: 0 0 16px rgba(212,255,0,0.1);
        }

        .ev-search-icon {
          background: rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 0 14px;
          display: flex;
          align-items: center;
          color: rgba(240,240,255,0.3);
          font-size: 13px;
        }

        .ev-search-input {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: none;
          outline: none;
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 14px;
        }
        .ev-search-input::placeholder { color: rgba(240,240,255,0.25); }
        .ev-search-input:focus { background: rgba(212,255,0,0.02); }

        .ev-count {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: rgba(240,240,255,0.25);
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        .ev-count strong {
          color: var(--yellow);
          font-size: 14px;
        }

        /* ── LOADING ── */
        .ev-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          gap: 12px;
        }
        .ev-loading p {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.35);
          margin: 0;
        }

        /* ── ERROR ── */
        .ev-error {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--pink);
          padding: 14px 18px;
          background: rgba(255,45,120,0.08);
          border: 1px solid rgba(255,45,120,0.2);
          border-radius: 10px;
          margin-bottom: 24px;
        }

        /* ── GRID ── */
        .ev-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 991px) { .ev-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 639px) { .ev-grid { grid-template-columns: repeat(2, 1fr); } }

        /* ── BACK TO TOP ── */
        .ev-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 28px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          text-decoration: none;
          transition: box-shadow .25s, transform .25s;
          box-shadow: 0 0 20px rgba(255,45,120,0.3);
        }
        .ev-empty-btn:hover {
          box-shadow: 0 0 36px rgba(255,45,120,0.55);
          transform: translateY(-1px);
          color: #fff;
        }

        @media (max-width: 767px) {
          .ev-header { flex-direction: column; align-items: flex-start; }
          .ev-search-card { min-width: 100%; width: 100%; }
        }
      `}</style>

      <div className="ev-page">
        <div className="container">

          {/* Header */}
          <div className="ev-header">
            <div className="ev-title-block">
              <h2 className="ev-title">Danh Sách <span>Sự Kiện</span></h2>
              <div className="ev-strip" />
              <p className="ev-subtitle">Nội dung lấy từ tin tức (News) trên hệ thống.</p>
            </div>

            <div className="ev-search-card">
              <div className="ev-search-wrap">
                <span className="ev-search-icon"><i className="fas fa-search" /></span>
                <input
                  type="text"
                  className="ev-search-input"
                  placeholder="Tìm sự kiện..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="ev-count">
                <strong>{filtered.length}</strong> mục
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="ev-loading">
              <Spinner animation="border" style={{ color: "var(--pink)" }} />
              <p>Đang tải sự kiện / tin tức…</p>
            </div>
          )}

          {/* Error */}
          {!loading && loadError && (
            <div className="ev-error">{loadError}</div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="ev-grid">
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !loadError && filtered.length === 0 && (
            <EmptyState
              title="Chưa có tin / sự kiện"
              subtitle="Thêm tin tức (status công khai) trong quản trị."
              action={
                <Link to="/movies" className="ev-empty-btn">
                  Khám phá phim
                </Link>
              }
            />
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Events;