import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import { Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { ArrowRight, CalendarDays, Newspaper, Search } from "lucide-react";
import EventCard from "../../components/common/EventCard";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { NEWS } from "../../constants/apiEndpoints";

function toDate(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 3) {
    const d = new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = toDate(value);
  if (!d) return null;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function plainText(html) {
  const raw = String(html || "");
  if (!raw.trim()) return "";

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(content, max = 150) {
  const text = plainText(content);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function mapNewsToEvent(n) {
  const id = n.id ?? n.newsId;
  const created = n.createdAt;
  const createdDate = toDate(created);
  const content = n.content ?? n.description ?? "";
  return {
    id,
    title: n.title ?? "Tin tức",
    posterUrl: n.image || n.imageUrl,
    imageUrl: n.image,
    startDate: createdDate?.toISOString() ?? created,
    dateLabel: formatDate(created),
    excerpt: makeExcerpt(content),
    content,
    sortTime: createdDate?.getTime() ?? 0,
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
        const res = await apiFetch(withQuery(NEWS.LIST, { search: keyword }));
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
  }, [keyword]);

  const events = useMemo(
    () => [...raw].sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0) || Number(b.id || 0) - Number(a.id || 0)),
    [raw]
  );

  const filtered = events;

  const featured = filtered[0] ?? null;
  const remaining = featured ? filtered.slice(1) : filtered;

  return (
    <Layout>
      <style>{`
        .ev-page {
          --ev-bg: #0f102a;
          --ev-panel: rgba(20, 22, 50, 0.86);
          --ev-panel-strong: rgba(255, 255, 255, 0.08);
          --ev-border: rgba(255, 255, 255, 0.11);
          --ev-text: #ffffff;
          --ev-muted: rgba(255, 255, 255, 0.62);
          --ev-dim: rgba(255, 255, 255, 0.42);
          --ev-purple: #7b1fa2;
          --ev-pink: #e91e8c;
          --ev-yellow: #d4e219;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            var(--ev-bg);
          padding: 36px 0 72px;
          color: var(--ev-text);
        }

        .ev-hero {
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding-bottom: 30px;
          margin-bottom: 30px;
        }

        .ev-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 24px;
          align-items: end;
        }

        .ev-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ev-yellow);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .ev-title {
          font-family: var(--font-brand);
          font-size: clamp(34px, 5vw, 56px);
          color: #fff;
          line-height: 1.02;
          margin: 0 0 12px;
        }
        .ev-title span { color: var(--ev-yellow); }

        .ev-strip {
          height: 3px;
          width: 58px;
          background: linear-gradient(90deg, var(--ev-purple), var(--ev-pink), var(--ev-yellow));
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .ev-subtitle {
          max-width: 680px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.65;
          color: var(--ev-muted);
          margin: 0;
        }

        .ev-search-card {
          background: var(--ev-panel);
          border: 1px solid var(--ev-border);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
        }

        .ev-search-wrap {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255,0.055);
          transition: border-color .2s, box-shadow .2s;
        }
        .ev-search-wrap:focus-within {
          border-color: var(--ev-yellow);
          box-shadow: 0 0 0 4px rgba(212,226,25,0.12);
        }

        .ev-search-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          color: var(--ev-dim);
          flex-shrink: 0;
        }

        .ev-search-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 11px 12px 11px 0;
        }
        .ev-search-input::placeholder { color: rgba(255,255,255,0.38); }

        .ev-count {
          font-size: 12px;
          font-weight: 800;
          color: var(--ev-dim);
          white-space: nowrap;
        }
        .ev-count strong {
          color: var(--ev-yellow);
          font-size: 14px;
        }

        .ev-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          gap: 12px;
        }
        .ev-loading p {
          font-size: 13px;
          font-weight: 600;
          color: var(--ev-muted);
          margin: 0;
        }

        .ev-error {
          font-size: 13px;
          font-weight: 700;
          color: #ff7aa7;
          padding: 14px 16px;
          background: rgba(233,30,140,0.09);
          border: 1px solid rgba(233,30,140,0.24);
          border-radius: 12px;
        }

        .ev-feature {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
          min-height: 350px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          background: var(--ev-panel);
          border: 1px solid var(--ev-border);
          border-radius: 16px;
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.25);
          transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
        }
        .ev-feature:hover {
          color: inherit;
          transform: translateY(-3px);
          border-color: rgba(212,226,25,0.35);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.34);
        }

        .ev-feature-media {
          position: relative;
          min-height: 300px;
          background: linear-gradient(135deg, rgba(123,31,162,.38), rgba(233,30,140,.28));
        }
        .ev-feature-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ev-feature-empty,
        .event-post-empty {
          width: 100%;
          height: 100%;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.7);
          background:
            linear-gradient(135deg, rgba(123,31,162,.36), rgba(233,30,140,.22)),
            rgba(255,255,255,0.05);
        }

        .ev-feature-body {
          padding: clamp(24px, 4vw, 38px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .ev-meta,
        .event-post-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ev-yellow);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .ev-feature-title {
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 900;
          line-height: 1.16;
          margin: 0 0 14px;
          color: #fff;
        }

        .ev-feature-excerpt {
          color: var(--ev-muted);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.75;
          margin: 0 0 24px;
        }

        .ev-readmore,
        .event-post-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          width: fit-content;
          padding: 10px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--ev-purple), var(--ev-pink));
        }

        .ev-section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin: 30px 0 18px;
        }

        .ev-section-title {
          font-family: var(--font-brand);
          color: #fff;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1;
          margin: 0;
        }

        .ev-section-note {
          color: var(--ev-dim);
          font-size: 13px;
          font-weight: 700;
          margin: 0;
        }

        .ev-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .event-post-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          background: rgba(20,22,50,0.82);
          border: 1px solid var(--ev-border);
          border-radius: 14px;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .event-post-card:hover {
          color: inherit;
          transform: translateY(-3px);
          border-color: rgba(212,226,25,0.32);
          background: rgba(255,255,255,0.07);
        }

        .event-post-media {
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: rgba(255,255,255,0.06);
        }
        .event-post-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .28s ease;
        }
        .event-post-card:hover .event-post-media img {
          transform: scale(1.035);
        }

        .event-post-body {
          padding: 18px;
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        .event-post-title {
          color: #fff;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.32;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-post-excerpt {
          color: var(--ev-muted);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.65;
          margin: 0 0 18px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-post-action {
          margin-top: auto;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 9px 12px;
        }

        .ev-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--ev-purple), var(--ev-pink));
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .ev-empty-btn:hover {
          box-shadow: 0 16px 34px rgba(233,30,140,0.22);
          transform: translateY(-1px);
          color: #fff;
        }

        @media (max-width: 991.98px) {
          .ev-header,
          .ev-feature {
            grid-template-columns: 1fr;
          }
          .ev-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767px) {
          .ev-page { padding-top: 26px; }
          .ev-feature-media { min-height: 220px; }
          .ev-section-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 575.98px) {
          .ev-grid {
            grid-template-columns: 1fr;
          }
          .ev-search-card {
            align-items: stretch;
            flex-direction: column;
          }
          .ev-count {
            align-self: flex-end;
          }
        }
      `}</style>

      <div className="ev-page">
        <section className="ev-hero">
          <div className="container">
          <div className="ev-header">
            <div className="ev-title-block">
                <div className="ev-eyebrow">
                  <Newspaper size={16} />
                  Tin tức & sự kiện
                </div>
                <h1 className="ev-title">Bài viết <span>mới nhất</span></h1>
              <div className="ev-strip" />
                <p className="ev-subtitle">
                  Cập nhật thông báo, ưu đãi và các hoạt động đang diễn ra tại rạp.
                </p>
            </div>

            <div className="ev-search-card">
              <div className="ev-search-wrap">
                  <span className="ev-search-icon"><Search size={17} /></span>
                <input
                  type="text"
                  className="ev-search-input"
                    placeholder="Tìm theo tiêu đề hoặc nội dung..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="ev-count">
                <strong>{filtered.length}</strong> mục
              </div>
            </div>
          </div>
          </div>
        </section>

        <div className="container">

          {loading && (
            <div className="ev-loading">
              <Spinner animation="border" style={{ color: "var(--ev-pink)" }} />
              <p>Đang tải tin tức...</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="ev-error">{loadError}</div>
          )}

          {!loading && !loadError && featured && (
            <>
              <Link to={`/events/${featured.id}`} className="ev-feature">
                <div className="ev-feature-media">
                  {featured.imageUrl || featured.posterUrl ? (
                    <img src={featured.imageUrl || featured.posterUrl} alt={featured.title} />
                  ) : (
                    <div className="ev-feature-empty">
                      <Newspaper size={42} />
                    </div>
                  )}
                </div>
                <div className="ev-feature-body">
                  {featured.dateLabel && (
                    <div className="ev-meta">
                      <CalendarDays size={16} />
                      {featured.dateLabel}
                    </div>
                  )}
                  <h2 className="ev-feature-title">{featured.title}</h2>
                  {featured.excerpt && <p className="ev-feature-excerpt">{featured.excerpt}</p>}
                  <span className="ev-readmore">
                    Đọc bài viết
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>

              {remaining.length > 0 && (
                <>
                  <div className="ev-section-head">
                    <h2 className="ev-section-title">Các bài viết khác</h2>
                    <p className="ev-section-note">{remaining.length} bài</p>
                  </div>
                  <div className="ev-grid">
                    {remaining.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <EmptyState
              title="Chưa có tin / sự kiện"
              subtitle="Hiện chưa có bài viết công khai."
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
