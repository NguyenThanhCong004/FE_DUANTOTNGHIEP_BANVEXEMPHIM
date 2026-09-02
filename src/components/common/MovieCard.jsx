import React from 'react';
import { Link } from 'react-router-dom';
import MoviePoster from './MoviePoster';

const MovieCard = ({ movie, isComingSoon = false, showBuyButton = true }) => {
  const ageLimit = Number(movie?.ageLimit);
  const hasAgeLimit = Number.isFinite(ageLimit) && ageLimit > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@600;700;800&display=swap');

        .mc-card {
          --navy:   #0d0d2b;
          --purple: #8b00ff;
          --pink:   #ff2d78;
          --yellow: #d4ff00;
        }

        .mc-card {
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
        .mc-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,45,120,0.5);
          box-shadow: 0 12px 40px rgba(255,45,120,0.18);
        }
        .mc-card.mc-soon {
          filter: grayscale(0.45);
          border-color: rgba(255,255,255,0.07);
        }
        .mc-card.mc-soon:hover {
          border-color: rgba(212,255,0,0.3);
          box-shadow: 0 12px 40px rgba(212,255,0,0.1);
        }

        /* ── POSTER WRAPPER ── */
        .mc-poster-wrap {
          position: relative;
          overflow: hidden;
        }
        .mc-poster-wrap img {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
          transition: transform .35s ease;
        }
        .mc-card:hover .mc-poster-wrap img {
          transform: scale(1.04);
        }

        /* gradient overlay */
        .mc-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 55%;
          background: linear-gradient(to top, rgba(13,13,43,0.95) 0%, transparent 100%);
          pointer-events: none;
        }

        /* ── BADGES ── */
        .mc-badge-age {
          position: absolute; top: 10px; left: 10px;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800;
          padding: 3px 8px; border-radius: 6px;
          background: rgba(255,45,120,0.85);
          color: #fff;
          letter-spacing: 0.5px;
          z-index: 2;
        }
        .mc-badge-soon {
          position: absolute; top: 10px; right: 10px;
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 6px;
          background: rgba(212,255,0,0.12);
          border: 1px solid rgba(212,255,0,0.35);
          color: #d4ff00;
          letter-spacing: 0.5px;
          z-index: 2;
        }

        /* ── BODY ── */
        .mc-body {
          padding: 12px 13px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .mc-strip {
          height: 2px;
          width: 28px;
          background: linear-gradient(90deg, #8b00ff, #ff2d78);
          border-radius: 2px;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .mc-soon .mc-strip {
          background: linear-gradient(90deg, #8b00ff, #d4ff00);
        }

        .mc-title {
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

        .mc-genre {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: rgba(240,240,255,0.35);
          letter-spacing: 0.3px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }
        .mc-genre-spacer { margin-bottom: 12px; }

        .mc-release {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #d4ff00;
          letter-spacing: 0.5px;
          margin: 6px 0 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* ── BUY BUTTON ── */
        .mc-btn {
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
        .mc-btn:hover {
          box-shadow: 0 0 24px rgba(255,45,120,0.5);
          transform: translateY(-1px);
        }
      `}</style>

      <div className={`mc-card${isComingSoon ? " mc-soon" : ""}`}>
        <Link
          to={`/movie/${movie.id}`}
          style={{ textDecoration: "none", color: "inherit", display: "contents" }}
        >
          {/* Poster */}
          <div className="mc-poster-wrap">
            <MoviePoster
              src={movie.posterUrl}
              alt={movie.title}
            />
            <div className="mc-overlay" />

            {/* Age badge */}
            {hasAgeLimit && (
              <span className="mc-badge-age">T{ageLimit}</span>
            )}

            {/* Coming soon badge */}
            {isComingSoon && (
              <span className="mc-badge-soon">Sắp chiếu</span>
            )}
          </div>

          {/* Body */}
          <div className="mc-body">
            <div className="mc-strip" />
            <div className="mc-title">{movie.title}</div>

            {isComingSoon ? (
              <>
                {movie.genre && <div className="mc-genre">{movie.genre}</div>}
                <div className="mc-release">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4ff00" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.8 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {movie.releaseDate}
                </div>
              </>
            ) : (
              <>
                <div className={`mc-genre${showBuyButton ? " mc-genre-spacer" : ""}`}>
                  {movie.genre}
                </div>
                {showBuyButton && (
                  <Link
                    to={`/movie/${movie.id}`}
                    className="mc-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Mua Vé
                  </Link>
                )}
              </>
            )}
          </div>
        </Link>
      </div>
    </>
  );
};

export default MovieCard;
