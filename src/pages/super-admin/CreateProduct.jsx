import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'Active',
    image: null
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu sản phẩm mới:', formData);
    alert('Thêm sản phẩm thành công!');
    navigate('/super-admin/products');
  };

  return (
    <div className="create-product p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 900px;
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
          letter-spacing: 0.5px;
        }

        .custom-input, .custom-select {
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
          min-height: 100px;
        }

        .custom-input:focus, .custom-textarea:focus, .custom-select:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        /* Phần tải ảnh */
        .image-upload-section {
          padding: 20px;
          border: 2px solid black;
          border-radius: 15px;
          background: whitesmoke;
          margin-bottom: 30px;
        }

        .preview-box {
          width: 200px;
          height: 200px;
          border: 2px solid black;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
          cursor: pointer;
          margin: 0 auto;
        }

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
          margin-bottom: 25px;
          padding-bottom: 10px;
          color: black;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Sản Phẩm Mới</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/products')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="image-upload-section text-center">
            <h5 className="section-title">HÌNH ẢNH SẢN PHẨM</h5>
            <div className="preview-box mb-3" onClick={() => document.getElementById('product-image-input').click()}>
              {previewImage ? (
                <img src={previewImage} alt="Preview" />
              ) : (
                <div className="text-center p-3">
                  <i className="bi bi-cloud-arrow-up fs-1 text-muted"></i>
                  <div className="small fw-bold text-muted mt-2">TẢI ẢNH LÊN</div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id="product-image-input" 
              hidden 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <p className="text-muted small">Khuyên dùng ảnh vuông (1:1), định dạng JPG/PNG.</p>
          </div>

          <h5 className="section-title">THÔNG TIN CHI TIẾT</h5>
          
          <div className="row">
            <div className="col-md-8 form-group-custom">
              <label className="form-label">Tên sản phẩm</label>
              <input 
                type="text" 
                name="name"
                className="custom-input" 
                placeholder="Ví dụ: Bắp rang bơ vị Phô mai..." 
                required 
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Giá bán (VNĐ)</label>
              <input 
                type="number" 
                name="price"
                className="custom-input" 
                placeholder="Ví dụ: 45000" 
                required 
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 form-group-custom">
              <label className="form-label">Mô tả sản phẩm</label>
              <textarea 
                name="description"
                className="custom-textarea" 
                placeholder="Nhập mô tả chi tiết về sản phẩm..." 
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trạng thái kinh doanh</label>
              <select 
                name="status"
                className="custom-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Đang bán (Available)</option>
                <option value="Inactive">Ngưng bán (Unavailable)</option>
              </select>
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/products')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN LƯU SẢN PHẨM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
