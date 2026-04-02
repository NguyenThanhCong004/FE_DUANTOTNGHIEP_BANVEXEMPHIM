import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { PRODUCT_CATEGORIES } from '../../constants/apiEndpoints';

const CreateProductType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const [typeName, setTypeName] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (editData) {
      setTypeName(editData.name || '');
    }
    // Fetch danh sách hiện có để kiểm tra trùng tên
    (async () => {
      try {
        const res = await apiFetch(PRODUCT_CATEGORIES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        setProductTypes(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách loại sản phẩm:", err);
      }
    })();
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    const trimmedName = typeName.trim();
    
    if (!trimmedName) {
      newErrors.typeName = 'Tên loại sản phẩm không được để trống';
    } else {
      // Kiểm tra trùng tên (không phân biệt hoa thường)
      const isDuplicate = productTypes.some(type => {
        // Nếu đang sửa, bỏ qua chính nó dựa trên ID
        if (editData && (type.id === editData.id || type.categories_products_id === editData.id)) {
          return false;
        }
        return type.name?.trim().toLowerCase() === trimmedName.toLowerCase();
      });

      if (isDuplicate) {
        newErrors.typeName = 'Tên loại sản phẩm này đã tồn tại trong hệ thống';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setTypeName(e.target.value);
    if (errors.typeName) {
      setErrors(prev => ({ ...prev, typeName: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError('');
    const tid = editData?.id;
    const url = tid ? PRODUCT_CATEGORIES.BY_ID(tid) : PRODUCT_CATEGORIES.LIST;
    try {
      const res = await apiFetch(url, {
        method: tid ? 'PUT' : 'POST',
        body: JSON.stringify({ name: typeName.trim() }),
      });
      if (res.ok) {
        navigate('/super-admin/product-types');
      } else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu loại sản phẩm thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-grid-fill" : "bi-grid-plus"} 
      title={editData ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm mới'} 
      description="Quản lý các nhóm danh mục sản phẩm như Bắp, Nước, Combo..."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className={`bi ${editData ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
            Thông tin loại sản phẩm
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="admin-form-label">Tên loại sản phẩm <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className={`admin-search-input w-100 ${errors.typeName ? 'border-danger' : ''}`}
                placeholder="Ví dụ: Bắp rang, Đồ uống, Combo khuyến mãi..." 
                value={typeName}
                onChange={handleChange}
                autoFocus
              />
              {errors.typeName && <small className="text-danger fw-medium">{errors.typeName}</small>}
            </div>

            <div className="mt-5 d-flex justify-content-center gap-3">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/product-types')}>Hủy bỏ</button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                {editData ? 'Cập nhật' : 'Lưu loại'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateProductType;
