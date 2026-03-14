import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateMovie = () => {
  const navigate = useNavigate();
  
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

  const [previewPoster, setPreviewPoster] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [name]: file }));
      if (name === 'poster') setPreviewPoster(URL.createObjectURL(file));
      if (name === 'banner') setPreviewBanner(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Phim Mới</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/movies')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Image Section */}
          <div className="image-upload-section">
            <h5 className="section-title">HÌNH ẢNH PHIM</h5>
            <div className="row g-4 text-center">
              <div className="col-md-4 d-flex flex-column align-items-center">
                <label className="form-label">Poster (Ảnh dọc)</label>
                <div className="preview-box poster-preview" onClick={() => document.getElementById('poster-input').click()}>
                  {previewPoster ? (
                    <img src={previewPoster} alt="Poster" />
                  ) : (
                    <div className="text-center p-3">
                      <i className="bi bi-image fs-1 text-muted"></i>
                      <div className="small fw-bold text-muted mt-2">CHỌN POSTER</div>
                    </div>
                  )}
                </div>
                <input type="file" id="poster-input" hidden accept="image/*" name="poster" onChange={handleFileChange} />
              </div>
              
              <div className="col-md-8 d-flex flex-column align-items-center">
                <label className="form-label">Banner (Ảnh ngang)</label>
                <div className="preview-box banner-preview" onClick={() => document.getElementById('banner-input').click()}>
                  {previewBanner ? (
                    <img src={previewBanner} alt="Banner" />
                  ) : (
                    <div className="text-center p-3">
                      <i className="bi bi-card-image fs-1 text-muted"></i>
                      <div className="small fw-bold text-muted mt-2">CHỌN BANNER</div>
                    </div>
                  )}
                </div>
                <input type="file" id="banner-input" hidden accept="image/*" name="banner" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          <h5 className="section-title">THÔNG TIN CHI TIẾT PHIM</h5>
          <div className="row">
            <div className="col-md-8 form-group-custom">
              <label className="form-label">Tiêu đề phim</label>
              <input type="text" name="title" className="custom-input" placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước" required value={formData.title} onChange={handleChange} />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Đạo diễn</label>
              <input type="text" name="author" className="custom-input" placeholder="Tên đạo diễn" required value={formData.author} onChange={handleChange} />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Thời lượng (phút)</label>
              <input type="number" name="duration" className="custom-input" placeholder="120" required value={formData.duration} onChange={handleChange} />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Quốc gia</label>
              <input type="text" name="nation" className="custom-input" placeholder="Việt Nam, Mỹ..." required value={formData.nation} onChange={handleChange} />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Thể loại</label>
              <select name="genre_id" className="custom-input" required value={formData.genre_id} onChange={handleChange}>
                <option value="">-- Chọn thể loại --</option>
                <option value="1">Hành động</option>
                <option value="2">Tình cảm</option>
                <option value="3">Kinh dị</option>
                <option value="4">Hoạt hình</option>
              </select>
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Ngày khởi chiếu</label>
              <input type="date" name="release_date" className="custom-input" required value={formData.release_date} onChange={handleChange} />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Độ tuổi</label>
              <select name="age_limit" className="custom-input" required value={formData.age_limit} onChange={handleChange}>
                <option value="">-- Chọn giới hạn --</option>
                <option value="P">P - Mọi lứa tuổi</option>
                <option value="K">K - Dưới 13 tuổi</option>
                <option value="T13">T13 - Trên 13 tuổi</option>
                <option value="T16">T16 - Trên 16 tuổi</option>
                <option value="T18">T18 - Trên 18 tuổi</option>
              </select>
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Giá vé cơ bản (VNĐ)</label>
              <input type="number" name="base_price" className="custom-input" placeholder="85000" required value={formData.base_price} onChange={handleChange} />
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
                XÁC NHẬN LƯU PHIM
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMovie;
