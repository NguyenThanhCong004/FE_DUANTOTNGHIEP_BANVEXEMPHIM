import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import AdminFormListBack from '../../components/admin/AdminFormListBack';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiFetch } from '../../utils/apiClient';
import { PRODUCT_CATEGORIES } from '../../constants/apiEndpoints';
import { apiMessage, MESSAGES, resultToastType } from '../../utils/uiMessages';

const CreateProductType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { showToast, ToastComponent } = useAdminToast();
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
    if (tid && typeName.trim() === String(editData.name || '').trim()) {
      showToast(MESSAGES.noChanges, 'warning');
      setSubmitting(false);
      return;
    }
    const url = tid ? PRODUCT_CATEGORIES.BY_ID(tid) : PRODUCT_CATEGORIES.LIST;
    try {
      const res = await apiFetch(url, {
        method: tid ? 'PUT' : 'POST',
        body: JSON.stringify({ name: typeName.trim() }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, tid ? 'Cập nhật loại sản phẩm thành công' : 'Thêm loại sản phẩm thành công');
        navigate('/super-admin/product-types', {
          state: {
            message,
            type: resultToastType(message),
          },
        });
      } else {
        const json = await res.json().catch(() => null);
        setServerError(apiMessage(json, 'Lưu loại sản phẩm thất bại'));
      }
    } catch {
      setServerError(MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-grid-fill" : "bi-grid-plus"} 
      title={editData ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm mới'}
      headerRight={<AdminFormListBack to="/super-admin/product-types" />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4 className="mb-0">
            Thông tin loại sản phẩm
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4">{serverError}</div>}
          
          <form onSubmit={handleSubmit} noValidate>
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

            <div className="mt-4 d-flex justify-content-end">
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                {editData ? 'Cập nhật' : 'Lưu loại'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateProductType;
