import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { PRODUCTS, PRODUCT_CATEGORIES } from '../../constants/apiEndpoints';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const CreateProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'Active',
    category_id: '',
    image: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(PRODUCT_CATEGORIES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (mounted) setCategoryOptions(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setCategoryOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const pid = editData?.id;
    if (!pid) return;
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(PRODUCTS.BY_ID(pid));
        const json = await res.json().catch(() => null);
        const p = json?.data ?? json;
        if (!mounted || !res.ok || !p) return;
        setFormData({
          name: p.name || '',
          description: p.description || '',
          price: p.price != null ? String(p.price) : '',
          status: p.status === 1 ? 'Active' : 'Inactive',
          category_id: p.categoryId != null ? String(p.categoryId) : '',
          image: null,
        });
        if (p.image) setPreviewImage(p.image);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editData?.id]);

  useEffect(() => {
    if (editData?.id) return;
    if (editData) {
      setFormData({
        name: editData.name || '',
        description: editData.description || '',
        price: editData.price || '',
        status: editData.status || 'Active',
        category_id: editData.category_id != null ? String(editData.category_id) : '',
        image: null
      });
      if (editData.image) {
        setPreviewImage(editData.image);
      }
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = ' Tên sản phẩm không được để trống';
    }

    if (!formData.price) {
      newErrors.price = 'Giá bán không được để trống';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Giá bán phải là số dương';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Vui lòng chọn loại sản phẩm';
    }

    const editing = Boolean(editData?.id);
    if (!editing && !formData.image) {
      newErrors.image = 'Vui lòng tải ảnh sản phẩm';
    }
    if (editing && !formData.image && !previewImage) {
      newErrors.image = 'Cần ảnh (giữ ảnh cũ hoặc chọn ảnh mới)';
    }

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
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let imageStr = previewImage;
    if (formData.image instanceof File) {
      try {
        imageStr = await fileToDataUrl(formData.image);
      } catch {
        alert('Không đọc được file ảnh');
        return;
      }
    }
    if (!imageStr || typeof imageStr !== 'string') {
      setErrors((prev) => ({ ...prev, image: 'Thiếu ảnh sản phẩm' }));
      return;
    }

    const body = {
      name: formData.name.trim(),
      description: formData.description || '',
      price: parseFloat(formData.price),
      image: imageStr,
      status: formData.status === 'Active' ? 1 : 0,
      categoryId: Number(formData.category_id),
    };
    const pid = editData?.id;
    const url = pid ? PRODUCTS.BY_ID(pid) : PRODUCTS.LIST;
    try {
      const res = await apiFetch(url, {
        method: pid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Lưu sản phẩm thất bại');
        return;
      }
      alert(pid ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
      navigate('/super-admin/catalog-products');
    } catch {
      alert('Không thể kết nối server');
    }
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

        .error-message {
          color: #dc3545;
          font-size: 0.8rem;
          margin-top: 5px;
          font-weight: 500;
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
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>
          {editData ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/catalog-products')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          {/* Image Upload */}
          <div className="image-upload-section text-center">
            <h5 className="section-title">HÌNH ẢNH SẢN PHẨM</h5>
            <div className={`preview-box mb-3 ${errors.image ? 'border-danger' : ''}`} onClick={() => document.getElementById('product-image-input').click()}>
              {previewImage ? (
                <img src={previewImage} alt="Preview" />
              ) : (
                <div className="text-center p-3">
                  <i className="bi bi-cloud-arrow-up fs-1 text-dark"></i>
                  <div className="small fw-bold text-dark mt-2">TẢI ẢNH LÊN</div>
                </div>
              )}
            </div>
            {errors.image && <div className="error-message mb-2">{errors.image}</div>}
            <input 
              type="file" 
              id="product-image-input" 
              hidden 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <p className="text-dark small">Khuyên dùng ảnh vuông (1:1), định dạng JPG/PNG.</p>
          </div>

          <h5 className="section-title">THÔNG TIN CHI TIẾT</h5>
          
          <div className="row">
            <div className="col-md-8 form-group-custom">
              <label className="form-label">Tên sản phẩm</label>
              <input 
                type="text" 
                name="name"
                className={`custom-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: Bắp rang bơ vị Phô mai..." 
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="col-md-4 form-group-custom">
              <label className="form-label">Giá bán (VNĐ)</label>
              <input 
                type="number" 
                name="price"
                className={`custom-input ${errors.price ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: 45000" 
                value={formData.price}
                onChange={handleChange}
              />
              {errors.price && <div className="error-message">{errors.price}</div>}
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
              <label className="form-label">Loại sản phẩm</label>
              <select
                name="category_id"
                className={`custom-select ${errors.category_id ? 'is-invalid' : ''}`}
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">— Chọn loại —</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <div className="error-message">{errors.category_id}</div>}
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
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/catalog-products')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              {editData ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN LƯU SẢN PHẨM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
