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
    return () => { c = true; };
  }, [newsId]);

  const formatDate = (createdAt) => {
    if (!createdAt) return null;
    try {
      if (Array.isArray(createdAt))
        return new Date(createdAt[0], createdAt[1] - 1, createdAt[2]).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
      return new Date(createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return null; }
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        .ed-page {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
        }

        .ed-page {
          min-height: 100vh;
          background: var(--navy);
          padding: 80px 0 60px;
        }

        /* ── BACK BUTTON ── */
        .ed-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: border-color .25s, background .25s, color .25s;
          margin-bottom: 36px;
        }
        .ed-back:hover {
          border-color: var(--yellow);
          background: rgba(212,255,0,0.05);
          color: var(--yellow);
        }
        .ed-back i { font-size: 12px; }

        /* ── LOADING ── */
        .ed-loading {
          display: flex;
          justify-content: center;
          padding: 80px 0;
        }

        /* ── LAYOUT ── */
        .ed-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 767px) {
          .ed-layout { grid-template-columns: 1fr; }
        }

        /* ── POSTER ── */
        .ed-poster {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid rgba(212,255,0,0.12);
          box-shadow: 0 0 40px rgba(139,0,255,0.2);
          display: block;
        }
        .ed-poster-empty {
          width: 100%;
          aspect-ratio: 2/3;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
        }

        /* ── CONTENT ── */
        .ed-content {}

        .ed-strip {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          border-radius: 2px;
          margin-bottom: 20px;
        }

        .ed-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(28px, 4vw, 44px);
          letter-spacing: 3px;
          color: var(--off-white);
          line-height: 1.1;
          margin: 0 0 14px;
          text-transform: uppercase;
        }

        .ed-date {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--yellow);
          background: rgba(212,255,0,0.07);
          border: 1px solid rgba(212,255,0,0.18);
          border-radius: 8px;
          padding: 6px 14px;
          margin-bottom: 28px;
        }
        .ed-date i { font-size: 11px; }

        .ed-divider {
          height: 1px;
          background: rgba(212,255,0,0.1);
          margin-bottom: 24px;
        }

        .ed-body {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.85;
          color: rgba(240,240,255,0.6);
          white-space: pre-line;
        }

        /* ── ERROR ── */
        .ed-error {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--pink);
          padding: 14px 18px;
          background: rgba(255,45,120,0.08);
          border: 1px solid rgba(255,45,120,0.2);
          border-radius: 10px;
        }

        /* ── EMPTY BTN ── */
        .ed-empty-btn {
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
        .ed-empty-btn:hover {
          box-shadow: 0 0 36px rgba(255,45,120,0.55);
          transform: translateY(-1px);
          color: #fff;
        }
      `}</style>

      <div className="ed-page">
        <div className="container">

          {/* Back */}
          <Link to="/events" className="ed-back">
            <i className="fas fa-arrow-left" />
            Quay lại sự kiện
          </Link>

          {/* Loading */}
          {loading && (
            <div className="ed-loading">
              <Spinner animation="border" style={{ color: "var(--pink)" }} />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="ed-error">{error}</div>
          )}

          {/* Content */}
          {!loading && item && (
            <div className="ed-layout">
              {/* Poster */}
              <div>
                {item.image
                  ? <img src={item.image} alt={item.title} className="ed-poster" />
                  : <div className="ed-poster-empty" />
                }
              </div>

              {/* Info */}
              <div className="ed-content">
                <div className="ed-strip" />
                <h1 className="ed-title">{item.title}</h1>

                {item.createdAt && (
                  <div className="ed-date">
                    <i className="fas fa-calendar-alt" />
                    {formatDate(item.createdAt)}
                  </div>
                )}

                <div className="ed-divider" />

                {(item.content || item.description) && (
                  <div className="ed-body">
                    {item.content || item.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !item && (
            <EmptyState
              title="Không có dữ liệu"
              subtitle={`id=${id}`}
              action={
                <Link to="/events" className="ed-empty-btn">
                  Xem tất cả sự kiện
                </Link>
              }
            />
          )}

        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;