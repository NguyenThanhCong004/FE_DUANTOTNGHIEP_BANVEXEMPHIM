import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
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
  const imageInputRef = useRef(null);

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
  const [productList, setProductList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiFetch(PRODUCT_CATEGORIES.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setCategoryOptions(Array.isArray(list) ? list : []);
    } catch {
      setCategoryOptions([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch(PRODUCTS.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setProductList(Array.isArray(list) ? list : []);
    } catch {
      setProductList([]);
    }
  };

  useEffect(() => {
    const pid = editData?.id;
    if (!pid) return;
    
    const fetchProductDetail = async () => {
      try {
        const res = await apiFetch(PRODUCTS.BY_ID(pid));
        const json = await res.json().catch(() => null);
        const p = json?.data ?? json;
        if (!res.ok || !p) return;
        setFormData({
          name: p.name || '',
          description: p.description || '',
          price: p.price != null ? String(p.price) : '',
          status: p.status === 1 ? 'Active' : 'Inactive',
          category_id: p.categoryId != null ? String(p.categoryId) : '',
          image: null,
        });
        if (p.image) setPreviewImage(p.image);
      } catch (error) {
        console.error("Lỗi lấy chi tiết sản phẩm:", error);
      }
    };
    fetchProductDetail();
  }, [editData?.id]);

  const validateForm = () => {
    let newErrors = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    } else {
      // Kiểm tra trùng tên (không phân biệt hoa thường)
      const isDuplicate = productList.some(p => {
        // Nếu đang sửa, bỏ qua chính nó dựa trên ID
        if (editData && p.id === editData.id) return false;
        return p.name?.trim().toLowerCase() === trimmedName.toLowerCase();
      });

      if (isDuplicate) {
        newErrors.name = 'Tên sản phẩm này đã tồn tại trong hệ thống';
      }
    }

    if (!formData.price) {
      newErrors.price = 'Giá bán không được để trống';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Giá bán phải là số dương';
    }
    if (!formData.category_id) newErrors.category_id = 'Vui lòng chọn loại sản phẩm';
    if (!editData?.id && !formData.image) newErrors.image = 'Vui lòng tải ảnh sản phẩm';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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

    setSubmitting(true);
    setServerError('');

    try {
      let imageStr = previewImage;
      if (formData.image instanceof File) {
        imageStr = await fileToDataUrl(formData.image);
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
      const res = await apiFetch(url, {
        method: pid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        navigate('/super-admin/catalog-products');
      } else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu sản phẩm thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-box-seam-fill" : "bi-box-seam"} 
      title={editData ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} 
      description="Quản lý danh mục sản phẩm bắp nước, combo và quà tặng trên hệ thống."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0"><i className="bi bi-image text-primary me-2"></i>Ảnh sản phẩm</h4>
              </div>
              <div className="admin-card-body p-4 text-center">
                <div 
                  className={`mx-auto mb-3 border-2 d-flex align-items-center justify-content-center overflow-hidden ${errors.image ? 'border-danger' : 'border-light'}`}
                  style={{ width: '100%', aspectRatio: '1/1', cursor: 'pointer', background: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  onClick={() => imageInputRef.current.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="text-muted text-center">
                      <i className="bi bi-cloud-arrow-up fs-1"></i>
                      <div className="small fw-bold mt-2">TẢI ẢNH (1:1)</div>
                    </div>
                  )}
                </div>
                <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleFileChange} />
                {errors.image && <div className="text-danger small fw-bold">{errors.image}</div>}
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="admin-card admin-slide-up h-100">
              <div className="admin-card-header">
                <h4 className="mb-0"><i className="bi bi-info-circle text-primary me-2"></i>Thông tin chi tiết</h4>
              </div>
              <div className="admin-card-body p-4">
                {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
                
                <div className="row">
                  <div className="col-md-8 mb-4">
                    <label className="admin-form-label">Tên sản phẩm <span className="text-danger">*</span></label>
                    <input 
                      type="text" name="name" className={`admin-search-input w-100 ${errors.name ? 'border-danger' : ''}`}
                      placeholder="Ví dụ: Bắp rang bơ vị Phô mai..." value={formData.name} onChange={handleChange} 
                    />
                    {errors.name && <small className="text-danger fw-medium">{errors.name}</small>}
                  </div>

                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Giá bán (VNĐ) <span className="text-danger">*</span></label>
                    <input 
                      type="number" name="price" className={`admin-search-input w-100 ${errors.price ? 'border-danger' : ''}`}
                      placeholder="45000" value={formData.price} onChange={handleChange} 
                    />
                    {errors.price && <small className="text-danger fw-medium">{errors.price}</small>}
                  </div>

                  <div className="col-md-6 mb-4">
                    <label className="admin-form-label">Loại sản phẩm <span className="text-danger">*</span></label>
                    <select
                      name="category_id" className={`admin-search-input w-100 ${errors.category_id ? 'border-danger' : ''}`}
                      value={formData.category_id} onChange={handleChange}
                    >
                      <option value="">— Chọn loại —</option>
                      {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <small className="text-danger fw-medium">{errors.category_id}</small>}
                  </div>

                  <div className="col-md-6 mb-4">
                    <label className="admin-form-label">Trạng thái kinh doanh</label>
                    <select name="status" className="admin-search-input w-100" value={formData.status} onChange={handleChange}>
                      <option value="Active">Đang bán (Available)</option>
                      <option value="Inactive">Ngưng bán (Unavailable)</option>
                    </select>
                  </div>

                  <div className="col-12 mb-4">
                    <label className="admin-form-label">Mô tả sản phẩm</label>
                    <textarea 
                      name="description" className="admin-search-input w-100" style={{ height: 'auto', minHeight: '80px', paddingTop: '10px' }}
                      placeholder="Nhập mô tả ngắn gọn về sản phẩm..." value={formData.description} onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                <div className="mt-2 d-flex justify-content-center gap-3">
                  <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/catalog-products')}>Hủy bỏ</button>
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '200px' }} disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                    {editData ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminPanelPage>
  );
};

export default CreateProduct;
