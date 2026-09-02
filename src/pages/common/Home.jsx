import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HeroSlider from "../../components/common/HeroSlider";
import SectionHeader from "../../components/common/SectionHeader";
import MovieCard from "../../components/common/MovieCard";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch } from "../../utils/apiClient";
import { MOVIES } from "../../constants/apiEndpoints";
import { splitNowAndSoon } from "../../utils/movieApiMap";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const HOME_MOVIE_LIMIT = 8;

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [br, mr] = await Promise.all([apiFetch(MOVIES.HOME_BANNERS), apiFetch(MOVIES.LIST)]);
        const [bj, mj] = await Promise.all([br.json().catch(() => null), mr.json().catch(() => null)]);

        if (cancelled) return;

        if (!mr.ok) {
          setLoadError(mj?.message || "Không tải được danh sách phim");
          setNowShowing([]);
          setComingSoon([]);
          setBanners([]);
        } else {
          const list = Array.isArray(mj?.data) ? mj.data : [];
          const { nowShowing: n, comingSoon: c } = splitNowAndSoon(list);
          setNowShowing(n.slice(0, HOME_MOVIE_LIMIT));
          setComingSoon(c.slice(0, HOME_MOVIE_LIMIT));

          const newestMovies = [...list]
            .sort((a, b) => {
              const ad = String(a?.releaseDate || "");
              const bd = String(b?.releaseDate || "");
              if (ad !== bd) return bd.localeCompare(ad);
              return Number(b?.id || 0) - Number(a?.id || 0);
            })
            .filter((m) => m?.status === 1 || m?.status === 2);
          const slides = newestMovies
            .map((m) => ({
              imageUrl: (m?.banner || m?.poster || "").trim(),
              movieId: m?.movieId ?? m?.id ?? null,
              title: m?.title ?? "Phim mới",
            }))
            .filter((s) => s.imageUrl)
            .slice(0, 8);
          if (!slides.length) {
            const bannerUrls = br.ok && Array.isArray(bj?.data)
              ? bj.data.filter((u) => typeof u === "string" && u.trim()).slice(0, 8)
              : [];
            const fallbackSlides = bannerUrls.map((url) => ({
              imageUrl: url,
              movieId: null,
              title: "Phim nổi bật",
            }));
            setBanners(fallbackSlides);
            return;
          }
          setBanners(slides);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Không kết nối được máy chủ (kiểm tra BE và VITE_API_BASE_URL).");
          setNowShowing([]);
          setComingSoon([]);
          setBanners([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card:   rgba(20,22,50,0.92);
        }

        .home-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
        }

        /* Loading */
        .home-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
        }
        .home-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(123,31,162,0.3);
          border-top-color: var(--pink);
          border-radius: 50%;
          animation: homeSpin 0.7s linear infinite;
        }
        @keyframes homeSpin { to { transform: rotate(360deg); } }
        .home-loading p {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          margin: 0;
          letter-spacing: 0.5px;
        }

        /* Error */
        .home-error {
          margin: 32px auto;
          max-width: 640px;
          padding: 16px 20px;
          border-radius: 12px;
          background: rgba(233,30,140,0.08);
          border: 1px solid rgba(233,30,140,0.25);
          color: #e91e8c;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Section wrapper */
        .home-section {
          padding: 40px 0;
        }

        /* Section header override */
        .home-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .home-section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(22px, 4vw, 32px);
          letter-spacing: 4px;
          color: #fff;
          line-height: 1;
          position: relative;
        }
        .home-section-title::after {
          content: '';
          display: block;
          height: 3px;
          width: 48px;
          margin-top: 8px;
          background: linear-gradient(90deg, var(--purple), var(--pink));
          border-radius: 2px;
        }
        .home-section-title span {
          color: var(--yellow);
        }
        .home-section-link {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--yellow);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(212,226,25,0.25);
          background: rgba(212,226,25,0.05);
          transition: all 0.2s;
        }
        .home-section-link:hover {
          background: rgba(212,226,25,0.12);
          border-color: rgba(212,226,25,0.5);
          color: var(--yellow);
          transform: translateY(-1px);
        }

        /* Divider between sections */
        .home-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 0 16px;
        }

        /* Empty state override */
        .home-empty {
          text-align: center;
          padding: 48px 0;
        }
        .home-empty-icon { font-size: 36px; opacity: 0.2; margin-bottom: 12px; }
        .home-empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 3px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .home-empty-sub   { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.2); max-width: 400px; margin: 0 auto; line-height: 1.6; }
      `}</style>

      <div className="home-page">

        {/* Loading */}
        {loading && (
          <div className="home-loading">
            <div className="home-spinner" />
            <p>Đang tải dữ liệu từ server…</p>
          </div>
        )}

        {/* Error */}
        {!loading && loadError && (
          <div className="container">
            <div className="home-error">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />{loadError}
            </div>
          </div>
        )}

        {/* Hero Slider */}
        {!loading && banners.length > 0 && <HeroSlider banners={banners} />}

        {/* Now Showing */}
        {!loading && !loadError && (
          <div className="container home-section">
            <div className="home-section-header">
              <div className="home-section-title">
                Phim <span>Đang Chiếu</span>
              </div>
              <Link to="/movies" className="home-section-link">
                Xem tất cả →
              </Link>
            </div>

            {nowShowing.length === 0 ? (
              <div className="home-empty">
                <div className="home-empty-icon"><i className="bi bi-camera-reels-fill" aria-hidden="true" /></div>
                <div className="home-empty-title">Chưa có phim đang chiếu</div>
                <div className="home-empty-sub">Thêm phim trên admin hoặc kiểm tra ngày khởi chiếu / trạng thái phim.</div>
              </div>
            ) : (
              <div className="row g-4">
                {nowShowing.map((movie) => (
                  <div key={movie.id} className="col-6 col-md-3">
                    <MovieCard movie={movie} showBuyButton={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {!loading && !loadError && comingSoon.length > 0 && <div className="home-divider" />}

        {/* Coming Soon */}
        {!loading && !loadError && comingSoon.length > 0 && (
          <div className="container home-section">
            <div className="home-section-header">
              <div className="home-section-title">
                Phim <span>Sắp Chiếu</span>
              </div>
              <Link to="/movies" className="home-section-link">
                Xem lịch →
              </Link>
            </div>
            <div className="row g-4">
              {comingSoon.map((movie) => (
                <div key={movie.id} className="col-6 col-md-3">
                  <MovieCard movie={movie} showBuyButton={false} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Home;
