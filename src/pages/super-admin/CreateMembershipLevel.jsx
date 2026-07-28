import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import AdminFormListBack from '../../components/admin/AdminFormListBack';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiFetch } from '../../utils/apiClient';
import { MEMBERSHIP_RANKS } from '../../constants/apiEndpoints';
import { apiMessage, MESSAGES, resultToastType } from '../../utils/uiMessages';

const CreateMembershipLevel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { showToast, ToastComponent } = useAdminToast();

  const [formData, setFormData] = useState({
    rank_name: '',
    min_spending: '',
    description: '',
    discount_percent: '',
    bonus_point: '',
    status: '1'
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!editData) {
      navigate('/super-admin/membership-levels', { replace: true });
      return;
    }
    setFormData({
      rank_name: editData.rank_name || '',
      min_spending: editData.min_spending || '',
      description: editData.description || '',
      discount_percent: editData.discount_percent || '',
      bonus_point: editData.bonus_point || '',
      status: String(editData.status ?? 1)
    });
  }, [editData, navigate]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.rank_name.trim()) newErrors.rank_name = 'Tên hạng không được để trống';
    if (!formData.min_spending) {
      newErrors.min_spending = 'Chi tiêu tối thiểu không được để trống';
    } else if (parseFloat(formData.min_spending) < 0) {
      newErrors.min_spending = 'Chi tiêu không được là số âm';
    }
    if (!formData.discount_percent) {
      newErrors.discount_percent = 'Phần trăm giảm giá không được để trống';
    } else {
      const val = parseFloat(formData.discount_percent);
      if (val < 0 || val > 100) newErrors.discount_percent = 'Phần trăm phải từ 0 đến 100';
    }
    if (!formData.bonus_point) {
      newErrors.bonus_point = 'Hệ số điểm thưởng không được để trống';
    } else if (parseFloat(formData.bonus_point) < 1) {
      newErrors.bonus_point = 'Hệ số điểm thưởng phải lớn hơn hoặc bằng 1';
    }
    if (!['0', '1'].includes(String(formData.status))) {
      newErrors.status = 'Trạng thái không hợp lệ';
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
    const rid = editData?.id;
    if (!rid) return;
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError('');
    const body = {
      rankName: formData.rank_name.trim(),
      minSpending: parseFloat(formData.min_spending),
      description: formData.description || '',
      discountPercent: parseFloat(formData.discount_percent),
      bonusPoint: parseInt(formData.bonus_point, 10),
      status: parseInt(formData.status, 10),
    };
    const originalBody = {
      rankName: String(editData.rank_name ?? editData.rankName ?? '').trim(),
      minSpending: parseFloat(editData.min_spending ?? editData.minSpending ?? 0),
      description: editData.description || '',
      discountPercent: parseFloat(editData.discount_percent ?? editData.discountPercent ?? 0),
      bonusPoint: parseInt(editData.bonus_point ?? editData.bonusPoint ?? 0, 10),
      status: parseInt(editData.status ?? 1, 10),
    };
    if (JSON.stringify(body) === JSON.stringify(originalBody)) {
      showToast(MESSAGES.noChanges, 'warning');
      setSubmitting(false);
      return;
    }
    try {
      const res = await apiFetch(MEMBERSHIP_RANKS.BY_ID(rid), {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, 'Cập nhật hạng hội viên thành công');
        navigate('/super-admin/membership-levels', {
          state: {
            message,
            type: resultToastType(message),
          },
        });
      } else {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, 'Lưu hạng hội viên thất bại');
        
        // Điều hướng lỗi về đúng ô nhập liệu
        if (message.includes('Chi tiêu tối thiểu')) {
          setErrors(prev => ({ ...prev, min_spending: message }));
        } else if (message.includes('Tên hạng')) {
          setErrors(prev => ({ ...prev, rank_name: message }));
        } else {
          setServerError(message);
        }
      }
    } catch {
      setServerError(MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!editData) return null;

  return (
    <AdminPanelPage
      icon="bi-award-fill"
      title="Cập nhật hạng hội viên"
      headerRight={<AdminFormListBack to="/super-admin/membership-levels" />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4 className="mb-0">
            Thông tin hạng thành viên
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4">{serverError}</div>}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Tên hạng <span className="text-danger">*</span></label>
                <input 
                  type="text" name="rank_name" className={`admin-search-input w-100 ${errors.rank_name ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: SILVER, GOLD, DIAMOND..." value={formData.rank_name} onChange={handleChange}
                />
                {errors.rank_name && <small className="text-danger fw-medium">{errors.rank_name}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Chi tiêu tối thiểu (VNĐ) <span className="text-danger">*</span></label>
                <input 
                  type="number" name="min_spending" className={`admin-search-input w-100 ${errors.min_spending ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 5000000" value={formData.min_spending} onChange={handleChange}
                />
                {errors.min_spending && <small className="text-danger fw-medium">{errors.min_spending}</small>}
              </div>

              <div className="col-12 mb-4">
                <label className="admin-form-label">Mô tả đặc quyền</label>
                <textarea 
                  name="description" className="admin-search-input w-100" style={{ height: 'auto', minHeight: '100px', paddingTop: '10px' }}
                  placeholder="Nhập mô tả các đặc quyền của hạng này..." value={formData.description} onChange={handleChange}
                ></textarea>
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Giảm giá vé (%) <span className="text-danger">*</span></label>
                <input 
                  type="number" name="discount_percent" className={`admin-search-input w-100 ${errors.discount_percent ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 10" value={formData.discount_percent} onChange={handleChange}
                />
                {errors.discount_percent && <small className="text-danger fw-medium">{errors.discount_percent}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Hệ số điểm thưởng <span className="text-danger">*</span></label>
                <input 
                  type="number" name="bonus_point" className={`admin-search-input w-100 ${errors.bonus_point ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 2 (x2 điểm thưởng)" value={formData.bonus_point} onChange={handleChange}
                />
                {errors.bonus_point && <small className="text-danger fw-medium">{errors.bonus_point}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Trạng thái <span className="text-danger">*</span></label>
                <select
                  name="status"
                  className={`admin-search-input w-100 ${errors.status ? 'border-danger' : ''}`}
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="1">Hoạt động</option>
                  <option value="0">Ngừng hoạt động</option>
                </select>
                {errors.status && <small className="text-danger fw-medium">{errors.status}</small>}
              </div>
            </div>

            <div className="mt-3 d-flex justify-content-end">
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '200px' }} disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                Cập nhật hạng
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateMembershipLevel;
