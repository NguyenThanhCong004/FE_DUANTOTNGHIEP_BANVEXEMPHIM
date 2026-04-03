import React, { useEffect, useState } from "react";
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
       <div className="container py-5 mt-5 text-center text-white">                                                              
          <div className="spinner-border text-danger" role="status" />                                                          
          <p className="mt-3 mb-0 small opacity-75">Đang tải dữ liệu từ server…</p>                                               
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

        {!loading && loadError ? (                                                                                                    
         <div className="container py-4 mt-4">                                                                                       
           <div className="alert alert-warning border-0 shadow-sm">{loadError}</div>                                                 
        </div>                                                                                                                      
      ) : null}                                                                                                                    
                                                                                                                                     
       {!loading && banners.length > 0 ? <HeroSlider banners={banners} /> : null}                                                    
                                                                                                                                     
       <div className="container my-5 pt-3">                                                                                         
         <SectionHeader                                                                                                              
           title="Phim Sắp Chiếu"                                                                                                  
             gradient="var(--secondary-gradient)"                                                                                    
             linkText="Xem lịch"                                                                                                         
           linkTo="/movies"                                                                                                          
           icon="fas fa-arrow-right"                                                                                                
          linkColorClass="text-danger"                                                                                             
        />                                                                                                                        
         {nowShowing.length === 0 ? (                                                                                               
          <EmptyState                                                                                                               
            title="Chưa có phim đang chiếu"                                                                                         
             subtitle="Thêm phim trên admin hoặc kiểm tra ngày khởi chiếu / trạng thái phim (đang chiếu = 1)."                       
          />                                                                                                                        
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
      </div>
    </Layout>
  );
};

export default Home;
