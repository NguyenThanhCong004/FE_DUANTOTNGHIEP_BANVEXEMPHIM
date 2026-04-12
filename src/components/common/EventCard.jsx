import React from "react";
import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  const imgSrc =
    event?.posterUrl ||
    event?.imageUrl ||
    "https://via.placeholder.com/400x600?text=Event";

  const title = event?.title ?? "Sự kiện";
  const startDate = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("vi-VN")
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@600;700;800&display=swap');

        .ec-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,255,0,0.14);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: transform .28s ease, border-color .28s ease, box-shadow .28s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          text-decoration: none !important;
        }
        .ec-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,45,120,0.5);
          box-shadow: 0 12px 40px rgba(255,45,120,0.18);
        }

        .ec-poster-wrap {
          position: relative;
          overflow: hidden;
        }
        .ec-poster-wrap img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
          transition: transform .35s ease;
        }
        .ec-card:hover .ec-poster-wrap img {
          transform: scale(1.04);
        }

        .ec-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 55%;
          background: linear-gradient(to top, rgba(13,13,43,0.95) 0%, transparent 100%);
          pointer-events: none;
        }

        .ec-body {
          padding: 12px 13px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .ec-strip {
          height: 2px;
          width: 28px;
          background: linear-gradient(90deg, #8b00ff, #ff2d78);
          border-radius: 2px;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .ec-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 1.5px;
          color: #f0f0ff;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          flex-shrink: 0;
        }

        .ec-date {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #d4ff00;
          letter-spacing: 0.5px;
          margin: 4px 0 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .ec-btn {
          display: block;
          width: 100%;
          padding: 8px 0;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #8b00ff, #ff2d78);
          color: #fff !important;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          cursor: pointer;
          text-align: center;
          text-decoration: none !important;
          transition: box-shadow .2s, transform .18s;
          box-shadow: 0 0 14px rgba(255,45,120,0.2);
          margin-top: auto;
        }
        .ec-btn:hover {
          box-shadow: 0 0 24px rgba(255,45,120,0.5);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="ec-card">
        <Link
          to={`/events/${event?.id}`}
          style={{ textDecoration: "none", color: "inherit", display: "contents" }}
        >
          <div className="ec-poster-wrap">
            <img src={imgSrc} alt={title} />
            <div className="ec-overlay" />
          </div>

          <div className="ec-body">
            <div className="ec-strip" />
            <div className="ec-title">{title}</div>

            {startDate && (
              <div className="ec-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4ff00" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.8 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {startDate}
              </div>
            )}

            <Link
              to={`/events/${event?.id}`}
              className="ec-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Xem Chi Tiết
            </Link>
          </div>
        </Link>
      </div>
    </>
  );
}