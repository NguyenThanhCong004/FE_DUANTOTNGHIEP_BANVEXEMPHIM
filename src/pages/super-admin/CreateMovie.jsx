import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  useEffect(() => {
    if (editData) {
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
    if (!formData.author.trim()) newErrors.author = 'Đạo diễn không được để trống';
    
    if (!formData.duration) {
      newErrors.duration = 'Thời lượng không được để trống';
    } else if (parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Thời lượng phải là số dương';
    }

    if (!formData.nation.trim()) newErrors.nation = 'Quốc gia không được để trống';
    if (!formData.genre_id) newErrors.genre_id = 'Vui lòng chọn thể loại';
    if (!formData.release_date) newErrors.release_date = 'Ngày khởi chiếu không được để trống';
    if (!formData.age_limit) newErrors.age_limit = 'Vui lòng chọn giới hạn độ tuổi';
    
    if (!formData.base_price) {
      newErrors.base_price = 'Giá vé không được để trống';
    } else if (parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Giá vé phải là số dương';
    }

    if (!editData && !formData.poster) newErrors.poster = 'Vui lòng chọn poster';
    if (!editData && !formData.banner) newErrors.banner = 'Vui lòng chọn banner';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log('Dữ liệu phim mới:', formData);
    alert('Thêm phim mới thành công!');
    navigate('/super-admin/movies');
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
                <option value="1">Hành động</option>
                <option value="2">Tình cảm</option>
                <option value="3">Kinh dị</option>
                <option value="4">Hoạt hình</option>
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
                <option value="P">P - Mọi lứa tuổi</option>
                <option value="K">K - Dưới 13 tuổi</option>
                <option value="T13">T13 - Trên 13 tuổi</option>
                <option value="T16">T16 - Trên 16 tuổi</option>
                <option value="T18">T18 - Trên 18 tuổi</option>
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
