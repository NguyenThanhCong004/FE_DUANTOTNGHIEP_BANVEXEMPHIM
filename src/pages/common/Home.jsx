import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import HeroSlider from "../../components/common/HeroSlider";
import SectionHeader from "../../components/common/SectionHeader";
import MovieCard from "../../components/common/MovieCard";
import EmptyState from "../../components/common/EmptyState";
import { apiFetch } from "../../utils/apiClient";
import { MOVIES } from "../../constants/apiEndpoints";
import { splitNowAndSoon } from "../../utils/movieApiMap";
import { Loader2, AlertCircle } from "lucide-react";

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
        const bj = await br.json().catch(() => null);
        const mj = await mr.json().catch(() => null);

        if (cancelled) return;

        if (br.ok && Array.isArray(bj?.data)) {
          setBanners(bj.data.filter((u) => typeof u === "string" && u.trim()).slice(0, 8));
        } else {
          setBanners([]);
        }

        if (!mr.ok) {
          setLoadError(mj?.message || "Không tải được danh sách phim");
          setNowShowing([]);
          setComingSoon([]);
        } else {
          const list = Array.isArray(mj?.data) ? mj.data : [];
          const { nowShowing: n, comingSoon: c } = splitNowAndSoon(list);
          setNowShowing(n.slice(0, HOME_MOVIE_LIMIT));
          setComingSoon(c.slice(0, HOME_MOVIE_LIMIT));
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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <div className="bg-zinc-950 min-h-screen text-zinc-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Đang tải dữ liệu từ server…</p>
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={20} />
              <p className="font-medium">{loadError}</p>
            </div>
          </div>
        ) : null}

        {!loading && banners.length > 0 ? <HeroSlider banners={banners} /> : null}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionHeader
            title="Phim Đang Chiếu"
            gradient="linear-gradient(to right, #f43f5e, #fb7185)"
            linkText="Tất cả"
            linkTo="/movies"
            icon="fas fa-arrow-right"
            linkColorClass="text-rose-500 hover:text-rose-400 transition-colors"
          />
          {nowShowing.length === 0 && !loading ? (
            <EmptyState
              title="Chưa có phim đang chiếu"
              subtitle="Thêm phim trên admin hoặc kiểm tra ngày khởi chiếu / trạng thái phim (đang chiếu = 1)."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} showBuyButton={false} />
              ))}
            </div>
          )}

          <div className="mt-20">
            <SectionHeader
              title="Phim Sắp Chiếu"
              gradient="linear-gradient(to right, #3b82f6, #60a5fa)"
              linkText="Xem lịch"
              linkTo="/movies"
              icon="fas fa-calendar"
              linkColorClass="text-blue-500 hover:text-blue-400 transition-colors"
            />
          </div>
          {comingSoon.length === 0 && !loading ? (
            <EmptyState title="Chưa có phim sắp chiếu" subtitle="Các phim có ngày khởi chiếu sau hôm nay sẽ hiển thị ở đây." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={movie} isComingSoon showBuyButton={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
