import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { MOVIES, GENRES } from '../../constants/apiEndpoints';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const CreateMovie = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    describe: '',
    duration: '',
    author: '',
    nation: '',
    genre_id: '',
    release_date: '',
    age_limit: '',
    base_price: '',
    status: 'Active',
    poster: null,
    banner: null
  });

  const [errors, setErrors] = useState({});
  const [previewPoster, setPreviewPoster] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [genreOptions, setGenreOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(GENRES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (mounted) setGenreOptions(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setGenreOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const mid = editData?.id;
    if (!mid || genreOptions.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(MOVIES.BY_ID(mid));
        const json = await res.json().catch(() => null);
        const m = json?.data ?? json;
        if (!mounted || !res.ok || !m) return;
        const gid = genreOptions.find((g) => g.name === m.genre)?.genreId;
        const rd = m.releaseDate ? String(m.releaseDate).slice(0, 10) : "";
        setFormData({
          title: m.title || "",
          description: m.description || "",
          describe: m.content || "",
          duration: m.duration != null ? String(m.duration) : "",
          author: m.author || "",
          nation: m.nation || "",
          genre_id: gid != null ? String(gid) : "",
          release_date: rd,
          age_limit: m.ageLimit != null ? String(m.ageLimit) : "",
          base_price: m.basePrice != null ? String(m.basePrice) : "",
          status: m.status === 1 ? "Active" : "Inactive",
          poster: null,
          banner: null,
        });
        if (m.posterUrl) setPreviewPoster(m.posterUrl);
        if (m.banner) setPreviewBanner(m.banner);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editData?.id, genreOptions]);

  useEffect(() => {
    if (editData?.id) return;
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state (no id)
      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        describe: editData.describe || '',
        duration: editData.duration || '',
        author: editData.author || '',
        nation: editData.nation || '',
        genre_id: editData.genre_id || '',
        release_date: editData.release_date || '',
        age_limit: editData.age_limit || '',
        base_price: editData.base_price || '',
        status: editData.status || 'Active',
        poster: null,
        banner: null
      });
      if (editData.poster) setPreviewPoster(editData.poster);
      if (editData.banner) setPreviewBanner(editData.banner);
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề không được để trống';

    if (!formData.duration) {
      newErrors.duration = 'Thời lượng không được để trống';
    } else if (parseInt(formData.duration, 10) <= 0) {
      newErrors.duration = 'Thời lượng phải là số dương';
    }

    if (!formData.genre_id) newErrors.genre_id = 'Vui lòng chọn thể loại';
    if (!formData.release_date) newErrors.release_date = 'Ngày khởi chiếu không được để trống';
    if (formData.age_limit === '' || formData.age_limit == null) {
      newErrors.age_limit = 'Vui lòng chọn giới hạn độ tuổi';
    }

    if (!formData.base_price) {
      newErrors.base_price = 'Giá vé không được để trống';
    } else if (parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Giá vé phải là số dương';
    }

    const editing = Boolean(editData?.id);
    if (!editing && !formData.poster) newErrors.poster = 'Vui lòng chọn poster';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [name]: file }));
      if (name === 'poster') {
        setPreviewPoster(URL.createObjectURL(file));
        setErrors(prev => ({ ...prev, poster: '' }));
      }
      if (name === 'banner') {
        setPreviewBanner(URL.createObjectURL(file));
        setErrors(prev => ({ ...prev, banner: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let posterStr = previewPoster;
      if (formData.poster instanceof File) {
        posterStr = await fileToDataUrl(formData.poster);
      }
      if (!posterStr || typeof posterStr !== "string") {
        setErrors((prev) => ({ ...prev, poster: "Cần poster (ảnh hoặc URL)" }));
        return;
      }
      let bannerStr = previewBanner;
      if (formData.banner instanceof File) {
        bannerStr = await fileToDataUrl(formData.banner);
      }
      const body = {
        genreId: Number(formData.genre_id),
        title: formData.title.trim(),
        description: formData.description || "",
        duration: Number(formData.duration),
        ageLimit: Number(formData.age_limit),
        releaseDate: formData.release_date,
        poster: posterStr,
        status: formData.status === "Active" ? 1 : 0,
        basePrice: Number(formData.base_price),
        author: formData.author?.trim() || null,
        nation: formData.nation?.trim() || null,
        content: formData.describe?.trim() || null,
        banner: typeof bannerStr === "string" && bannerStr ? bannerStr : null,
      };
      const movieId = editData?.id ?? editData?.movie_id;
      const url = movieId ? MOVIES.BY_ID(movieId) : MOVIES.LIST;
      const res = await apiFetch(url, {
        method: movieId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Lưu phim thất bại");
        return;
      }
      alert(movieId ? "Cập nhật phim thành công!" : "Thêm phim thành công!");
      navigate("/super-admin/movies");
    } catch {
      alert("Không thể kết nối server");
    }
  };

  return (
    <div className="create-movie p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 1000px;
          margin: 0 auto;
        }

        .form-group-custom {
          margin-bottom: 25px;
        }

        .form-label {
          font-weight: bold;
          color: black;
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        .custom-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .custom-textarea {
          width: 100%;
          padding: 15px 20px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
          min-height: 100px;
        }

        .custom-input:focus, .custom-textarea:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .error-message {
          color: #dc3545;
          font-size: 0.8rem;
          margin-top: 5px;
          font-weight: 500;
        }

        /* Phần hình ảnh */
        .image-upload-section {
          padding: 20px;
          border: 2px solid black;
          border-radius: 15px;
          background: whitesmoke;
          margin-bottom: 30px;
        }

        .preview-box {
          border: 2px solid black;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .poster-preview { width: 150px; height: 220px; }
        .banner-preview { width: 100%; height: 200px; }

        .preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-save {
          background: black;
          color: white;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .btn-save:hover {
          background: whitesmoke;
          color: black;
        }

        .btn-cancel {
          background: white;
          color: black;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          margin-right: 15px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: black;
          margin-bottom: 25px;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>
          {editData ? 'Cập Nhật Phim' : 'Thêm Phim Mới'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/movies')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          {/* Image Section */}
          <div className="image-upload-section">
            <h5 className="section-title">HÌNH ẢNH PHIM</h5>
            <div className="row g-4 text-center">
              <div className="col-md-4 d-flex flex-column align-items-center">
                <label className="form-label">Poster (Ảnh dọc)</label>
                <div className={`preview-box poster-preview ${errors.poster ? 'border-danger' : ''}`} onClick={() => document.getElementById('poster-input').click()}>
                  {previewPoster ? (
                    <img src={previewPoster} alt="Poster" />
                  ) : (
                    <div className="text-center p-3">
                      <i className="bi bi-image fs-1 text-dark"></i>
                      <div className="small fw-bold text-dark mt-2">CHỌN POSTER</div>
                    </div>
                  )}
                </div>
                {errors.poster && <div className="error-message">{errors.poster}</div>}
                <input type="file" id="poster-input" hidden accept="image/*" name="poster" onChange={handleFileChange} />
              </div>
              
              <div className="col-md-8 d-flex flex-column align-items-center">
                <label className="form-label">Banner (Ảnh ngang)</label>
                <div className={`preview-box banner-preview ${errors.banner ? 'border-danger' : ''}`} onClick={() => document.getElementById('banner-input').click()}>
                  {previewBanner ? (
                    <img src={previewBanner} alt="Banner" />
                  ) : (
                    <div className="text-center p-3">
                      <i className="bi bi-card-image fs-1 text-dark"></i>
                      <div className="small fw-bold text-dark mt-2">CHỌN BANNER</div>
                    </div>
                  )}
                </div>
                {errors.banner && <div className="error-message">{errors.banner}</div>}
                <input type="file" id="banner-input" hidden accept="image/*" name="banner" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <h5 className="section-title">THÔNG TIN CHI TIẾT PHIM</h5>
          <div className="row">
            <div className="col-md-8 form-group-custom">
              <label className="form-label">Tiêu đề phim</label>
              <input type="text" name="title" className={`custom-input ${errors.title ? 'is-invalid' : ''}`} placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước" value={formData.title} onChange={handleChange} />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Đạo diễn</label>
              <input type="text" name="author" className={`custom-input ${errors.author ? 'is-invalid' : ''}`} placeholder="Tên đạo diễn" value={formData.author} onChange={handleChange} />
              {errors.author && <div className="error-message">{errors.author}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Thời lượng (phút)</label>
              <input type="number" name="duration" className={`custom-input ${errors.duration ? 'is-invalid' : ''}`} placeholder="120" value={formData.duration} onChange={handleChange} />
              {errors.duration && <div className="error-message">{errors.duration}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Quốc gia</label>
              <input type="text" name="nation" className={`custom-input ${errors.nation ? 'is-invalid' : ''}`} placeholder="Việt Nam, Mỹ..." value={formData.nation} onChange={handleChange} />
              {errors.nation && <div className="error-message">{errors.nation}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Thể loại</label>
              <select name="genre_id" className={`custom-input ${errors.genre_id ? 'is-invalid' : ''}`} value={formData.genre_id} onChange={handleChange}>
                <option value="">-- Chọn thể loại --</option>
                {genreOptions.map((g) => (
                  <option key={g.genreId} value={g.genreId}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.genre_id && <div className="error-message">{errors.genre_id}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Ngày khởi chiếu</label>
              <input type="date" name="release_date" className={`custom-input ${errors.release_date ? 'is-invalid' : ''}`} value={formData.release_date} onChange={handleChange} />
              {errors.release_date && <div className="error-message">{errors.release_date}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Độ tuổi</label>
              <select name="age_limit" className={`custom-input ${errors.age_limit ? 'is-invalid' : ''}`} value={formData.age_limit} onChange={handleChange}>
                <option value="">-- Chọn giới hạn --</option>
                <option value="0">Mọi lứa tuổi (0)</option>
                <option value="13">T13 — trên 13</option>
                <option value="16">T16 — trên 16</option>
                <option value="18">T18 — trên 18</option>
              </select>
              {errors.age_limit && <div className="error-message">{errors.age_limit}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Giá vé cơ bản (VNĐ)</label>
              <input type="number" name="base_price" className={`custom-input ${errors.base_price ? 'is-invalid' : ''}`} placeholder="85000" value={formData.base_price} onChange={handleChange} />
              {errors.base_price && <div className="error-message">{errors.base_price}</div>}
            </div>

            <div className="col-12 form-group-custom">
              <label className="form-label">Mô tả</label>
              <textarea name="description" className="custom-textarea" placeholder="mô tả nội dung phim..." value={formData.description} onChange={handleChange}></textarea>
            </div>

            <div className="col-12 form-group-custom">
              <label className="form-label">Nội dung chi tiết</label>
              <textarea name="describe" className="custom-textarea" rows="5" placeholder="Nội dung đầy đủ cốt truyện và thông tin phim..." value={formData.describe} onChange={handleChange}></textarea>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trạng thái phát hành</label>
              <select name="status" className="custom-input" value={formData.status} onChange={handleChange}>
                <option value="Active">Đang chiếu</option>
                <option value="Inactive">Ngưng chiếu</option>
                <option value="Upcoming">Sắp chiếu</option>
              </select>
            </div>

            <div className="col-12 mt-4 border-top pt-4 text-center">
              <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/movies')}>
                HỦY BỎ
              </button>
              <button type="submit" className="btn btn-save">
                {editData ? 'CẬP NHẬT PHIM' : 'XÁC NHẬN LƯU PHIM'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMovie;
