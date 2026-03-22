import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import MovieCard from '../../components/common/MovieCard';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { apiFetch } from '../../utils/apiClient';
import { ME } from '../../constants/apiEndpoints';
import { getAccessToken } from '../../utils/authStorage';
import { mapFavoriteRowToFavCard } from '../../utils/customerMeApi';

const STARS = [1, 2, 3, 4, 5];

function StarRating({ rating, onRate, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="d-flex gap-1" style={{ cursor: readonly ? 'default' : 'pointer' }}>
      {STARS.map((s) => (
        <span
          key={s}
          style={{
            fontSize: 18,
            color: s <= (readonly ? rating : (hovered || rating)) ? '#d4e219' : 'rgba(255,255,255,0.2)',
            transition: 'color 0.15s',
            textShadow: s <= (readonly ? rating : (hovered || rating)) ? '0 0 8px rgba(212,226,25,0.6)' : 'none',
          }}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onRate && onRate(s)}
        >★</span>
      ))}
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState(null); // { favorite_id, movie }
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setFavorites([]);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(ME.FAVORITES);
        const body = await res.json().catch(() => null);
        if (c) return;
        if (res.status === 401) {
          navigate('/login', { state: { from: '/movieFavorite' } });
          return;
        }
        if (!res.ok) {
          setLoadError(body?.message || 'Không tải được danh sách yêu thích');
          setFavorites([]);
          return;
        }
        const rows = Array.isArray(body?.data) ? body.data : [];
        setFavorites(rows.map(mapFavoriteRowToFavCard));
      } catch {
        if (!c) setLoadError('Lỗi kết nối');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const filtered = favorites.filter((f) => {
    if (filter === 'reviewed') return !!f.review;
    if (filter === 'unreviewed') return !f.review;
    return true;
  });

  const handleRemove = async (fav) => {
    const mid = fav?.movie?.id;
    if (mid == null) return;
    try {
      const res = await apiFetch(ME.FAVORITE_BY_MOVIE(mid), { method: 'DELETE' });
      if (res.status === 401) {
        navigate('/login', { state: { from: '/movieFavorite' } });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        showToast(body?.message || 'Không xóa được');
        return;
      }
      setFavorites((prev) => prev.filter((f) => f.favorite_id !== fav.favorite_id));
      setRemoveConfirm(null);
      showToast('Đã xóa khỏi danh sách yêu thích');
    } catch {
      showToast('Lỗi kết nối');
    }
  };

  const handleSaveReview = () => {
    if (!draftRating) return;
    setFavorites((prev) =>
      prev.map((f) =>
        f.favorite_id === reviewModal.favorite_id
          ? { ...f, review: { rating: draftRating, comment: draftComment } }
          : f
      )
    );
    showToast('Đã lưu đánh giá thành công!');
    setReviewModal(null);
    setDraftRating(0);
    setDraftComment('');
  };

  const openReview = (fav) => {
    setReviewModal(fav);
    setDraftRating(fav.review?.rating || 0);
    setDraftComment(fav.review?.comment || '');
  };

  const avgRating = favorites.filter((f) => f.review).reduce((acc, f) => acc + f.review.rating, 0) /
    (favorites.filter((f) => f.review).length || 1);

  return (
    <Layout>
      <style>{`
        :root {
          --navy:    #2d3151;
          --purple:  #7b1fa2;
          --pink:    #e91e8c;
          --yellow:  #d4e219;
          --dark:    #0f102a;
          --card-bg: rgba(20,22,50,0.92);
        }

        .fav-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 70% 45% at 10% 15%, rgba(123,31,162,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 90% 85%, rgba(233,30,140,0.14) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 80px;
        }

        /* ── PAGE TITLE ── */
        .fav-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 60px);
          letter-spacing: 4px;
          line-height: 1;
          color: #fff;
        }
        .fav-title span { color: var(--yellow); }

        /* ── STATS ROW ── */
        .stat-chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 18px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }
        .stat-chip .num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: var(--yellow);
          line-height: 1;
          letter-spacing: 1px;
        }
        .stat-chip .lbl {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        /* ── FILTER BAR ── */
        .fav-filter-btn {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 7px 16px;
          border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fav-filter-btn:hover { border-color: var(--yellow); color: var(--yellow); }
        .fav-filter-btn.active { background: var(--yellow); border-color: var(--yellow); color: #0f102a; }

        /* ── MOVIE CARD WRAPPER ── */
        .fav-card-wrap {
          position: relative;
        }

        /* Override MovieCard colors for dark theme */
        .fav-card-wrap .card {
          background: var(--card-bg) !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 14px !important;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
          overflow: hidden;
        }
        .fav-card-wrap .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          border-color: rgba(212,226,25,0.2) !important;
        }
        .fav-card-wrap .card h6 {
          color: #fff !important;
        }
        .fav-card-wrap .card .text-muted {
          color: rgba(255,255,255,0.4) !important;
        }
        .fav-card-wrap .card .btn-gradient {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          border: none;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .fav-card-wrap .card .btn-gradient:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        /* ── BOTTOM ACTION BAR (on each card) ── */
        .card-actions {
          display: flex;
          gap: 6px;
          padding: 0 4px 8px;
          justify-content: center;
        }
        .btn-action {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.5px;
          border-radius: 7px;
          padding: 5px 10px;
          border: 1.5px solid;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .btn-action.review {
          border-color: rgba(212,226,25,0.35);
          background: rgba(212,226,25,0.07);
          color: var(--yellow);
        }
        .btn-action.review:hover {
          background: rgba(212,226,25,0.18);
          border-color: var(--yellow);
        }
        .btn-action.remove {
          border-color: rgba(233,30,140,0.3);
          background: rgba(233,30,140,0.06);
          color: var(--pink);
        }
        .btn-action.remove:hover {
          background: rgba(233,30,140,0.18);
          border-color: var(--pink);
        }

        /* ── REVIEW BADGE ON CARD ── */
        .review-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(15,16,42,0.88);
          border: 1px solid rgba(212,226,25,0.35);
          border-radius: 8px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 10;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          color: var(--yellow);
          letter-spacing: 1px;
          pointer-events: none;
        }

        /* ── MODAL OVERLAY ── */
        .fav-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(6px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .fav-modal {
          background: #12133a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 460px;
          padding: 28px;
          position: relative;
        }
        .fav-modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 3px;
          color: #fff;
          margin-bottom: 4px;
        }
        .fav-modal-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .fav-modal textarea {
          background: rgba(255,255,255,0.05) !important;
          border: 1.5px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
          border-radius: 10px !important;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          resize: none;
        }
        .fav-modal textarea:focus {
          border-color: var(--yellow) !important;
          box-shadow: none !important;
          background: rgba(212,226,25,0.03) !important;
        }
        .fav-modal textarea::placeholder { color: rgba(255,255,255,0.25); }

        .btn-modal-save {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.5px;
          border-radius: 10px;
          padding: 10px 24px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-modal-save:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-modal-save:disabled { opacity: 0.3; transform: none; cursor: default; }
        .btn-modal-cancel {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.35);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 10px;
          transition: color 0.2s;
        }
        .btn-modal-cancel:hover { color: rgba(255,255,255,0.7); }

        /* ── CONFIRM MODAL ── */
        .confirm-modal {
          max-width: 360px;
          text-align: center;
        }
        .confirm-modal p {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          font-weight: 600;
          margin: 8px 0 24px;
        }
        .btn-confirm-remove {
          background: linear-gradient(135deg, #c2185b, var(--pink));
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          border-radius: 10px;
          padding: 10px 24px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-confirm-remove:hover { opacity: 0.88; }

        /* ── EMPTY STATE ── */
        .fav-empty {
          text-align: center;
          padding: 80px 20px;
          color: rgba(255,255,255,0.2);
        }
        .fav-empty .empty-icon { font-size: 60px; margin-bottom: 16px; opacity: 0.4; }
        .fav-empty p { font-size: 14px; font-weight: 600; letter-spacing: 0.5px; }
        .fav-empty a {
          display: inline-block;
          margin-top: 16px;
          padding: 10px 28px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border-radius: 10px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: opacity 0.2s;
        }
        .fav-empty a:hover { opacity: 0.85; color: #fff; }

        /* ── TOAST ── */
        .fav-toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #12133a;
          border: 1.5px solid var(--yellow);
          border-radius: 14px;
          padding: 14px 28px;
          color: var(--yellow);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.4px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          z-index: 9999;
          white-space: nowrap;
          animation: toastUp 0.3s ease;
        }
        @keyframes toastUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* section divider */
        .section-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 28px 0;
        }
      `}</style>

      {loading ? (
        <div className="text-center py-5 mt-5">
          <Spinner animation="border" variant="warning" />
          <p className="text-white-50 small mt-2">Đang tải danh sách yêu thích…</p>
        </div>
      ) : null}
      {!loading && !getAccessToken() ? (
        <div className="container py-5 mt-4">
          <div className="alert alert-warning border-0">Đăng nhập để xem phim yêu thích.</div>
        </div>
      ) : null}
      {loadError && getAccessToken() ? (
        <div className="container py-3 mt-3">
          <div className="alert alert-danger border-0">{loadError}</div>
        </div>
      ) : null}

      {!loading && getAccessToken() ? (
      <div className="fav-page mt-4">
        <Container fluid="xl">

          {/* ── HEADER ── */}
          <Row className="align-items-end mb-4 gy-3">
            <Col>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                ❤️ Danh sách cá nhân
              </p>
              <h1 className="fav-title mb-0">PHIM <span>YÊU THÍCH</span></h1>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <div className="stat-chip">
                  <span className="num">{favorites.length}</span>
                  <span className="lbl">Phim đã lưu</span>
                </div>
                <div className="stat-chip">
                  <span className="num">{favorites.filter(f => f.review).length}</span>
                  <span className="lbl">Đã đánh giá</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── FILTER BAR ── */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'all',        label: `Tất cả (${favorites.length})` },
              { key: 'reviewed',   label: `Đã đánh giá (${favorites.filter(f => f.review).length})` },
              { key: 'unreviewed', label: `Chưa đánh giá (${favorites.filter(f => !f.review).length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`fav-filter-btn${filter === key ? ' active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── GRID ── */}
          {filtered.length === 0 ? (
            <div className="fav-empty">
              <div className="empty-icon">🎬</div>
              <p>Không có phim nào trong danh sách này</p>
              <Link to="/movies">Khám phá phim ngay</Link>
            </div>
          ) : (
            <Row className="g-4">
              {filtered.map((fav) => (
                <Col key={fav.favorite_id} xs={6} md={4} lg={3}>
                  <div className="fav-card-wrap">

                    {/* Rating badge nếu đã review */}
                    {fav.review && (
                      <div className="review-badge">
                        ★ {fav.review.rating}.0
                      </div>
                    )}

                    {/* Reuse MovieCard */}
                    <MovieCard
                      movie={fav.movie}
                      isComingSoon={fav.movie.type === 'soon'}
                    />

                    {/* Action buttons */}
                    <div className="card-actions mt-2">
                      <button
                        className="btn-action review"
                        onClick={() => openReview(fav)}
                        title={fav.review ? 'Sửa đánh giá' : 'Viết đánh giá'}
                      >
                        {fav.review ? '✏️ Sửa' : '⭐ Đánh giá'}
                      </button>
                      <button
                        className="btn-action remove"
                        onClick={() => setRemoveConfirm(fav)}
                        title="Xóa khỏi yêu thích"
                      >
                        🗑 Xóa
                      </button>
                    </div>

                    {/* Comment preview */}
                    {fav.review?.comment && (
                      <div style={{
                        margin: '0 4px 8px',
                        padding: '8px 10px',
                        background: 'rgba(212,226,25,0.05)',
                        border: '1px solid rgba(212,226,25,0.12)',
                        borderRadius: 8,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.45)',
                        fontStyle: 'italic',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        "{fav.review.comment}"
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {/* ── EMPTY FULL PAGE ── */}
          {favorites.length === 0 && (
            <div className="fav-empty" style={{ marginTop: 40 }}>
              <div className="empty-icon">🎬</div>
              <p>Bạn chưa có phim yêu thích nào</p>
              <Link to="/movies">Khám phá phim ngay →</Link>
            </div>
          )}

        </Container>
      </div>
      ) : null}

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <div className="fav-modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="fav-modal" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setReviewModal(null)}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
            >×</button>

            <div className="fav-modal-title">
              {reviewModal.review ? 'SỬA ĐÁNH GIÁ' : 'ĐÁNH GIÁ PHIM'}
            </div>
            <div className="fav-modal-subtitle">{reviewModal.movie.title}</div>

            {/* Star rating */}
            <div className="mb-3">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Xếp hạng
              </div>
              <StarRating rating={draftRating} onRate={setDraftRating} />
              {draftRating > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--yellow)', fontWeight: 700 }}>
                  {['', 'Tệ', 'Tạm được', 'Ổn', 'Hay', 'Xuất sắc!'][draftRating]}
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Nhận xét (tuỳ chọn)
              </div>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-2 justify-content-end">
              <button className="btn-modal-cancel" onClick={() => setReviewModal(null)}>Hủy</button>
              <button className="btn-modal-save" disabled={!draftRating} onClick={handleSaveReview}>
                ✓ Lưu đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE CONFIRM MODAL ── */}
      {removeConfirm && (
        <div className="fav-modal-overlay" onClick={() => setRemoveConfirm(null)}>
          <div className="fav-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗑</div>
            <div className="fav-modal-title" style={{ fontSize: 18 }}>XÓA KHỎI YÊU THÍCH?</div>
            <p>Bạn có chắc muốn xóa <strong style={{ color: '#fff' }}>{removeConfirm.movie.title}</strong> khỏi danh sách yêu thích không?</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn-modal-cancel" style={{ border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10 }} onClick={() => setRemoveConfirm(null)}>
                Giữ lại
              </button>
              <button className="btn-confirm-remove" onClick={() => handleRemove(removeConfirm)}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && <div className="fav-toast">✓ {toast}</div>}
    </Layout>
  );
}