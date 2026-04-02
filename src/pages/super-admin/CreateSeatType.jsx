import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { SEAT_TYPES } from '../../constants/apiEndpoints';

const CreateSeatType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        price: editData.price || ''
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên loại ghế không được để trống';
    if (!formData.price) {
      newErrors.price = 'Giá phụ thu không được để trống';
    } else if (parseFloat(formData.price) < 0) {
      newErrors.price = 'Giá phụ thu không được âm';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError('');
    const body = {
      name: formData.name.trim(),
      surcharge: parseFloat(formData.price),
    };
    const tid = editData?.id;
    const url = tid ? SEAT_TYPES.BY_ID(tid) : SEAT_TYPES.LIST;
    try {
      const res = await apiFetch(url, {
        method: tid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        navigate('/super-admin/seat-types');
      } else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu loại ghế thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-chair-fill" : "bi-chair"} 
      title={editData ? 'Cập nhật loại ghế' : 'Thêm loại ghế mới'} 
      description="Quản lý các loại ghế trong phòng chiếu và mức giá phụ thu tương ứng."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className={`bi ${editData ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
            Thông tin loại ghế
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="admin-form-label">Tên loại ghế <span className="text-danger">*</span></label>
              <input 
                type="text" name="name" className={`admin-search-input w-100 ${errors.name ? 'border-danger' : ''}`}
                placeholder="Ví dụ: Ghế VIP, Ghế Sweetbox, Ghế thường..." value={formData.name} onChange={handleChange}
              />
              {errors.name && <small className="text-danger fw-medium">{errors.name}</small>}
            </div>

            <div className="mb-4">
              <label className="admin-form-label">Giá phụ thu (VNĐ) <span className="text-danger">*</span></label>
              <input 
                type="number" name="price" className={`admin-search-input w-100 ${errors.price ? 'border-danger' : ''}`}
                placeholder="Ví dụ: 20000" value={formData.price} onChange={handleChange}
              />
              {errors.price && <small className="text-danger fw-medium">{errors.price}</small>}
              <p className="text-muted small mt-2">
                <i className="bi bi-info-circle me-1"></i>
                Mức giá này sẽ được cộng thêm vào giá vé cơ bản khi khách hàng chọn loại ghế này.
              </p>
            </div>

            <div className="mt-5 d-flex justify-content-center gap-3">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/seat-types')}>Hủy bỏ</button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                {editData ? 'Cập nhật' : 'Lưu loại ghế'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateSeatType;
