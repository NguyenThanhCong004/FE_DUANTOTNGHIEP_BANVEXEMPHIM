import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import AdminFormListBack from '../../components/admin/AdminFormListBack';
import { apiFetch } from '../../utils/apiClient';
import { MOVIES, GENRES } from '../../constants/apiEndpoints';
import { useAdminToast } from '../../components/admin/AdminToast';
import { fileToDataUrl, IMAGE_FILE_ACCEPT } from '../../utils/mediaFiles';
import { adminStatusToCode, codeToAdminStatus } from '../../utils/statusFormat';
import { apiMessage, MESSAGES, resultToastType } from '../../utils/uiMessages';
import sanitizeHtml from '../../utils/sanitizeHtml';

const CreateMovie = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const posterInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const genreDropdownRef = useRef(null);
  const quillMountRef = useRef(null);
  const quillRef = useRef(null);
  const lastPushedHtmlRef = useRef("");
  const quillLiveRef = useRef({ quill: null, onTextChange: null });
  const { showToast, ToastComponent } = useAdminToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    genre_ids: [],
    release_date: '',
    age_limit: '',
    base_price: '',
    status: 'Active',
    poster: null,
    banner: null
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [previewPoster, setPreviewPoster] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [genreOptions, setGenreOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalDate, setOriginalDate] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [editorMode, setEditorMode] = useState("loading");
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    if (!genreDropdownOpen) return undefined;
    const handleClickOutside = (e) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [genreDropdownOpen]);

  const fetchGenres = async () => {
    try {
      const res = await apiFetch(GENRES.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setGenreOptions(Array.isArray(list) ? list : []);
    } catch {
      setGenreOptions([]);
    }
  };

  useEffect(() => {
    const mid = editData?.id;
    if (!mid || genreOptions.length === 0) return;
    
    const fetchMovieDetail = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(MOVIES.BY_ID(mid));
        const json = await res.json().catch(() => null);
        const m = json?.data ?? json;
        if (!res.ok || !m) return;
        
        const movieGenreNames = Array.isArray(m.genres) ? m.genres : [];
        const gids = genreOptions.filter((g) => movieGenreNames.includes(g.name)).map((g) => g.genreId);
        const rd = m.releaseDate ? String(m.releaseDate).slice(0, 10) : "";
        setOriginalDate(rd);
        setOriginalData({ ...m, genreIds: [...gids].sort((a, b) => a - b) });

        setFormData({
          title: m.title || "",
          description: sanitizeHtml(m.description || m.content || ""),
          duration: m.duration != null ? String(m.duration) : "",
          genre_ids: gids.map(String),
          release_date: rd,
          age_limit: m.ageLimit != null ? String(m.ageLimit) : "",
          base_price: m.basePrice != null ? String(m.basePrice) : "",
          status: codeToAdminStatus(m.status, { allowUpcoming: true }),
          poster: null,
          banner: null,
        });
        if (m.posterUrl) setPreviewPoster(m.posterUrl);
        if (m.banner) setPreviewBanner(m.banner);
      } catch (error) {
        console.error("Lỗi lấy chi tiết phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [editData?.id, genreOptions]);

  useEffect(() => {
    const host = quillMountRef.current;
    if (!host) return undefined;

    let cancelled = false;
    lastPushedHtmlRef.current = "";
    quillLiveRef.current = { quill: null, onTextChange: null };

    (async () => {
      setEditorMode("loading");
      try {
        await import("quill/dist/quill.snow.css");
        const { default: Quill } = await import("quill");
        if (cancelled || !quillMountRef.current) return;

        host.innerHTML = "";
        const editorEl = document.createElement("div");
        host.appendChild(editorEl);

        const quillInstance = new Quill(editorEl, {
          theme: "snow",
          placeholder: "Mô tả nội dung, cốt truyện của phim...",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "blockquote"],
              ["clean"],
            ],
          },
        });

        if (cancelled) {
          host.innerHTML = "";
          return;
        }

        quillRef.current = quillInstance;

        const initialHtml = sanitizeHtml(editData?.description || editData?.content || "");
        if (initialHtml) {
          try {
            quillInstance.setContents(quillInstance.clipboard.convert({ html: initialHtml }), "silent");
          } catch {
            quillInstance.root.innerHTML = initialHtml;
          }
        }

        const onTextChange = () => {
          let html;
          try {
            html = quillInstance.getSemanticHTML();
          } catch {
            html = quillInstance.root.innerHTML;
          }
          const safeHtml = sanitizeHtml(html);
          if (safeHtml === lastPushedHtmlRef.current) return;
          lastPushedHtmlRef.current = safeHtml;
          setFormData((prev) => ({ ...prev, description: safeHtml }));
        };

        quillInstance.on("text-change", onTextChange);
        quillLiveRef.current = { quill: quillInstance, onTextChange };
        onTextChange();

        if (!cancelled) setEditorMode("quill");
      } catch (e) {
        console.error("[CreateMovie] Quill init failed:", e);
        if (!cancelled) {
          host.innerHTML = "";
          setEditorMode("textarea");
        }
      }
    })();

    return () => {
      cancelled = true;
      const { quill, onTextChange } = quillLiveRef.current;
      if (quill && onTextChange) {
        quill.off("text-change", onTextChange);
      }
      quillLiveRef.current = { quill: null, onTextChange: null };
      quillRef.current = null;
      lastPushedHtmlRef.current = "";
      host.innerHTML = "";
    };
  }, [editData?.id, editData?.description, editData?.content]);

  useEffect(() => {
    if (!formData.release_date || formData.status === 'Inactive') return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(formData.release_date);
    selDate.setHours(0, 0, 0, 0);

    if (selDate > today) {
      if (formData.status === 'Active') {
        setFormData(prev => ({ ...prev, status: 'Upcoming' }));
      }
    } else {
      if (formData.status === 'Upcoming') {
        setFormData(prev => ({ ...prev, status: 'Active' }));
      }
    }
  }, [formData.release_date, formData.status]);

  const validateForm = () => {
    let newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.title.trim()) newErrors.title = 'Tiêu đề không được để trống';
    if (!formData.duration) {
      newErrors.duration = 'Thời lượng không được để trống';
    } else if (parseInt(formData.duration, 10) <= 0) {
      newErrors.duration = 'Thời lượng phải là số dương';
    }
    if (formData.genre_ids.length === 0) {
      newErrors.genre_ids = genreOptions.length === 0
        ? 'Chưa có thể loại phim. Hệ thống sẽ tạo thể loại mặc định sau khi chạy lại Docker.'
        : 'Vui lòng chọn ít nhất một thể loại';
    }
    
    if (!formData.release_date) {
      newErrors.release_date = 'Ngày khởi chiếu không được để trống';
    } else {
      const selDate = new Date(formData.release_date);
      selDate.setHours(0, 0, 0, 0);
      
      if (!editData?.id || formData.release_date !== originalDate) {
        if (selDate < today) {
          newErrors.release_date = 'Ngày khởi chiếu không được ở quá khứ';
        }
      }
    }

    if (formData.status === 'Upcoming' && formData.release_date) {
      const selDate = new Date(formData.release_date);
      selDate.setHours(0, 0, 0, 0);
      if (selDate <= today) {
        newErrors.status = 'Trạng thái "Sắp chiếu" chỉ dành cho phim có ngày chiếu trong tương lai';
      }
    }

    if (formData.age_limit === '' || formData.age_limit == null) {
      newErrors.age_limit = 'Vui lòng chọn giới hạn độ tuổi';
    }
    if (!formData.base_price) {
      newErrors.base_price = 'Giá vé không được để trống';
    } else if (parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Giá vé phải là số dương';
    }

    if (!editData?.id && !formData.poster) newErrors.poster = 'Vui lòng chọn poster';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'status' && errors.status) setErrors(prev => ({ ...prev, status: '' }));
  };

  const handleGenreToggle = (genreId) => {
    const id = String(genreId);
    setFormData(prev => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(id)
        ? prev.genre_ids.filter((g) => g !== id)
        : [...prev.genre_ids, id],
    }));
    if (errors.genre_ids) setErrors(prev => ({ ...prev, genre_ids: '' }));
  };

  const handleDescriptionTextarea = (e) => {
    const value = e.target.value;
    lastPushedHtmlRef.current = value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [name]: file }));
      const url = URL.createObjectURL(file);
      if (name === 'poster') {
        setPreviewPoster(url);
        setErrors(prev => ({ ...prev, poster: '' }));
      } else {
        setPreviewBanner(url);
        setErrors(prev => ({ ...prev, banner: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let posterBase64 = previewPoster;
      if (formData.poster instanceof File) {
        posterBase64 = await fileToDataUrl(formData.poster);
      }

      let bannerBase64 = previewBanner;
      if (formData.banner instanceof File) {
        bannerBase64 = await fileToDataUrl(formData.banner);
      }

      const genreIds = [...new Set(formData.genre_ids.map(Number))].sort((a, b) => a - b);
      const body = {
        genreIds,
        title: formData.title.trim(),
        description: sanitizeHtml(formData.description || "").trim(),
        duration: Number(formData.duration),
        ageLimit: Number(formData.age_limit),
        releaseDate: formData.release_date,
        poster: posterBase64,
        status: adminStatusToCode(formData.status, { allowUpcoming: true }),
        basePrice: Number(formData.base_price),
        banner: bannerBase64,
      };

      const movieId = editData?.id ?? editData?.movie_id;
      let payload = body;

      if (movieId && originalData) {
        payload = {};

        const sameGenres = originalData.genreIds
          && body.genreIds.length === originalData.genreIds.length
          && body.genreIds.every((id, i) => id === originalData.genreIds[i]);
        if (!sameGenres) payload.genreIds = body.genreIds;
        if (body.title !== originalData.title) payload.title = body.title;
        if (body.description !== sanitizeHtml(originalData.description || "").trim()) payload.description = body.description;
        if (body.duration !== originalData.duration) payload.duration = body.duration;
        if (body.ageLimit !== originalData.ageLimit) payload.ageLimit = body.ageLimit;
        if (body.releaseDate !== (originalData.releaseDate ? String(originalData.releaseDate).slice(0, 10) : null)) payload.releaseDate = body.releaseDate;
        if (body.poster !== originalData.posterUrl) payload.poster = body.poster;
        if (body.status !== originalData.status) payload.status = body.status;
        if (body.basePrice !== originalData.basePrice) payload.basePrice = body.basePrice;
        if (body.banner !== originalData.banner) payload.banner = body.banner;

        if (Object.keys(payload).length === 0) {
          showToast(MESSAGES.noChanges, 'warning');
          setSubmitting(false);
          return;
        }
      } else {
        payload = body;
      }

      const url = movieId ? MOVIES.BY_ID(movieId) : MOVIES.LIST;
      const res = await apiFetch(url, {
        method: movieId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, editData ? 'Cập nhật phim thành công' : 'Thêm phim mới thành công');
        const messageType = resultToastType(message);
        
        navigate("/super-admin/movies", { 
          state: { 
            message: message,
            type: messageType
          } 
        });
      } else {
        const json = await res.json().catch(() => null);
        const errorMessage = apiMessage(json, "Lưu phim thất bại");
        showToast(errorMessage, 'danger');
      }
    } catch {
      showToast(MESSAGES.networkError, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminPanelPage title="Đang tải..."><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></AdminPanelPage>;

  return (
    <AdminPanelPage
        icon={editData ? "bi-film" : "bi-plus-circle-dotted"}
        title={editData ? "Cập nhật phim" : "Thêm phim mới"}
        headerRight={<AdminFormListBack to="/super-admin/movies" />}
      >
        <div className="admin-form-page-wrap admin-form-compact">
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0">Hình ảnh phim (Poster & Banner)</h4>
              </div>
              <div className="admin-card-body p-3">
                <div className="row g-3 align-items-center">
                  <div className="col-md-3 text-center">
                    <label className="admin-form-label d-block mb-2">Poster phim (2:3)</label>
                    <div
                      className={`mx-auto mb-2 border-2 d-flex align-items-center justify-content-center overflow-hidden ${errors.poster ? 'border-danger' : 'border-light'}`}
                      style={{ width: '100%', maxWidth: '120px', aspectRatio: '2/3', cursor: 'pointer', background: 'var(--admin-bg-subtle)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      onClick={() => posterInputRef.current.click()}
                    >
                      {previewPoster ? (
                        <img src={previewPoster} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="text-muted text-center">
                          <div className="small fw-bold mt-2">POSTER</div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={posterInputRef} hidden accept={IMAGE_FILE_ACCEPT} name="poster" onChange={handleFileChange} />
                    {errors.poster && <div className="text-danger small fw-bold">{errors.poster}</div>}
                  </div>
                  <div className="col-md-9 text-center">
                    <label className="admin-form-label d-block mb-2">Banner phim (16:9)</label>
                    <div
                      className="mx-auto mb-2 border-2 d-flex align-items-center justify-content-center overflow-hidden"
                      style={{ width: '100%', maxWidth: '360px', aspectRatio: '16/9', cursor: 'pointer', background: 'var(--admin-bg-subtle)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      onClick={() => bannerInputRef.current.click()}
                    >
                      {previewBanner ? (
                        <img src={previewBanner} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="text-muted text-center">
                          <div className="small fw-bold mt-2">TẢI BANNER</div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={bannerInputRef} hidden accept={IMAGE_FILE_ACCEPT} name="banner" onChange={handleFileChange} />
                    <p className="text-muted small mb-0 mt-2">Tỉ lệ 16:9 giúp banner hiển thị tốt nhất trên màn hình lớn.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="admin-card admin-slide-up admin-card--dropdown-visible">
              <div className="admin-card-header">
                <h4 className="mb-0">Thông tin cơ bản</h4>
              </div>
              <div className="admin-card-body p-4">
                <div className="row">
                  <div className="col-md-8 mb-4">
                    <label className="admin-form-label">Tiêu đề phim <span className="text-danger">*</span></label>
                    <input 
                      type="text" name="title" className={`admin-search-input w-100 ${errors.title ? 'border-danger' : ''}`}
                      placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước" value={formData.title} onChange={handleChange} 
                    />
                    {errors.title && <small className="text-danger fw-medium">{errors.title}</small>}
                  </div>
                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Thời lượng (phút) <span className="text-danger">*</span></label>
                    <input
                      type="number" name="duration" className={`admin-search-input w-100 ${errors.duration ? 'border-danger' : ''}`}
                      placeholder="120" value={formData.duration} onChange={handleChange}
                    />
                    {errors.duration && <small className="text-danger fw-medium">{errors.duration}</small>}
                  </div>
                  <div className="col-md-8 mb-4">
                    <label className="admin-form-label">Thể loại <span className="text-danger">*</span></label>
                    <div className="position-relative" ref={genreDropdownRef}>
                      <button
                        type="button"
                        className={`admin-search-input w-100 text-start d-flex align-items-center justify-content-between ${errors.genre_ids ? 'border-danger' : ''}`}
                        onClick={() => setGenreDropdownOpen((prev) => !prev)}
                        disabled={genreOptions.length === 0}
                      >
                        <span className={formData.genre_ids.length === 0 ? 'text-muted' : ''}>
                          {genreOptions.length === 0
                            ? 'Chưa có thể loại nào.'
                            : formData.genre_ids.length === 0
                              ? '-- Chọn thể loại --'
                              : genreOptions
                                  .filter((g) => formData.genre_ids.includes(String(g.genreId)))
                                  .map((g) => g.name)
                                  .join(', ')}
                        </span>
                        <i className={`bi bi-chevron-${genreDropdownOpen ? 'up' : 'down'} text-muted`}></i>
                      </button>

                      {genreDropdownOpen && genreOptions.length > 0 && (
                        <div
                          className="position-absolute w-100 mt-1 bg-white border rounded-3 shadow-sm"
                          style={{ zIndex: 20, maxHeight: 260, overflowY: 'auto', padding: '8px 4px' }}
                        >
                          {genreOptions.map((g) => {
                            const checked = formData.genre_ids.includes(String(g.genreId));
                            return (
                              <label
                                key={g.genreId}
                                className="d-flex align-items-center gap-2 px-2 py-2 rounded-2"
                                style={{ cursor: 'pointer' }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input m-0"
                                  checked={checked}
                                  onChange={() => handleGenreToggle(g.genreId)}
                                />
                                <span>{g.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <small className="text-muted d-block mt-1">
                      Nhấn để mở danh sách, tích chọn được nhiều thể loại cùng lúc.
                    </small>
                    {errors.genre_ids && <small className="text-danger fw-medium d-block">{errors.genre_ids}</small>}
                  </div>
                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Ngày khởi chiếu <span className="text-danger">*</span></label>
                    <input type="date" name="release_date" className={`admin-search-input w-100 ${errors.release_date ? 'border-danger' : ''}`} value={formData.release_date} onChange={handleChange} />
                    {errors.release_date && <small className="text-danger fw-medium">{errors.release_date}</small>}
                  </div>
                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Độ tuổi <span className="text-danger">*</span></label>
                    <select name="age_limit" className={`admin-search-input w-100 ${errors.age_limit ? 'border-danger' : ''}`} value={formData.age_limit} onChange={handleChange}>
                      <option value="">-- Chọn giới hạn --</option>
                      <option value="0">Mọi lứa tuổi (0)</option>
                      <option value="13">T13 — trên 13</option>
                      <option value="16">T16 — trên 16</option>
                      <option value="18">T18 — trên 18</option>
                    </select>
                    {errors.age_limit && <small className="text-danger fw-medium">{errors.age_limit}</small>}
                  </div>
                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Giá vé cơ bản (VNĐ) <span className="text-danger">*</span></label>
                    <input type="number" name="base_price" className={`admin-search-input w-100 ${errors.base_price ? 'border-danger' : ''}`} placeholder="85000" value={formData.base_price} onChange={handleChange} />
                    {errors.base_price && <small className="text-danger fw-medium">{errors.base_price}</small>}
                  </div>
                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Trạng thái phát hành</label>
                    <select name="status" className={`admin-search-input w-100 ${errors.status ? 'border-danger' : ''}`} value={formData.status} onChange={handleChange}>
                      <option value="Active">Đang chiếu</option>
                      <option value="Inactive">Ngưng chiếu</option>
                      <option value="Upcoming">Sắp chiếu</option>
                    </select>
                    {errors.status && <small className="text-danger fw-medium">{errors.status}</small>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0">Mô tả & Nội dung</h4>
              </div>
              <div className="admin-card-body p-4">
                <div className="mb-0">
                  <label className="admin-form-label mb-3">Mô tả phim</label>
                  <div className="movie-quill-wrapper">
                    {editorMode === "loading" && (
                      <div className="text-muted small py-5 text-center border rounded-3 bg-light">Đang tải trình soạn thảo…</div>
                    )}
                    {editorMode === "textarea" && (
                      <textarea
                        name="description"
                        className="admin-search-input w-100 font-monospace"
                        rows={10}
                        placeholder="Nhập HTML mô tả phim…"
                        value={formData.description}
                        onChange={handleDescriptionTextarea}
                      />
                    )}
                    <div ref={quillMountRef} className={editorMode === "quill" ? "movie-quill-mount" : "d-none"} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 mt-2">
            <div className="d-flex justify-content-end">
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '220px' }} disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                {editData ? 'Cập nhật phim' : 'Lưu phim mới'}
              </button>
            </div>
          </div>
        </div>
      </form>
      </div>

      <style>{`
        .movie-quill-wrapper .movie-quill-mount .ql-toolbar {
          border-radius: 12px 12px 0 0;
          border-color: #e2e8f0 !important;
          background: var(--admin-bg-subtle);
        }
        .movie-quill-wrapper .movie-quill-mount .ql-container {
          min-height: 220px;
          font-size: 1rem;
          line-height: 1.7;
          color: #334155;
          border-radius: 0 0 12px 12px;
          border-color: #e2e8f0 !important;
        }
        .movie-quill-wrapper .movie-quill-mount .ql-editor {
          min-height: 200px;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        .movie-quill-wrapper .movie-quill-mount .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .movie-quill-wrapper .movie-quill-mount .ql-container.ql-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
      `}</style>
      <ToastComponent />
    </AdminPanelPage>
  );
};

export default CreateMovie;
