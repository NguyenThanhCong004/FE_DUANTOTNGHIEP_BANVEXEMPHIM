import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { VOUCHERS } from '../../constants/apiEndpoints';

const CreateVoucher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState({
    code: '',
    value: '',
    minOrderValue: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    pointVoucher: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [voucherList, setVoucherList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await apiFetch(VOUCHERS.LIST);
      const json = await res.json().catch(() => null);
      const list = json?.data ?? json ?? [];
      setVoucherList(Array.isArray(list) ? list : []);
    } catch {
      setVoucherList([]);
    }
  };

  useEffect(() => {
    if (editData) {
      const statusMap = {
        1: 'Active',
        0: 'Stopped',
        2: 'Scheduled',
        3: 'Expired'
      };
      setFormData({
        code: editData.code || '',
        value: editData.value || '',
        minOrderValue: editData.min_order_value || editData.minOrderValue || '',
        maxDiscountAmount: editData.max_discount_amount || editData.maxDiscountAmount || '',
        startDate: editData.start_date || editData.startDate || '',
        endDate: editData.end_date || editData.endDate || '',
        pointVoucher: editData.point_voucher || editData.pointVoucher || '',
        status: statusMap[editData.status] || 'Active'
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trimmedCode = formData.code.trim();
    if (!trimmedCode) {
      newErrors.code = 'Mã voucher không được để trống';
    } else {
      const isDuplicate = voucherList.some(v => {
        if (editData && v.id === editData.id) return false;
        return v.code?.trim().toUpperCase() === trimmedCode.toUpperCase();
      });
      if (isDuplicate) {
        newErrors.code = 'Mã voucher này đã tồn tại trên hệ thống';
      }
    }

    if (!formData.value) {
      newErrors.value = 'Phần trăm giảm giá không được để trống';
    } else {
      const val = parseFloat(formData.value);
      if (val <= 0 || val > 100) {
        newErrors.value = 'Giá trị phải từ 1% đến 100%';
      }
    }

    if (!formData.minOrderValue) {
      newErrors.minOrderValue = 'Giá trị đơn hàng tối thiểu không được để trống';
    } else if (parseFloat(formData.minOrderValue) < 0) {
      newErrors.minOrderValue = 'Giá trị không được âm';
    }

    if (!formData.maxDiscountAmount) {
      newErrors.maxDiscountAmount = 'Số tiền giảm tối đa không được để trống';
    } else if (parseFloat(formData.maxDiscountAmount) < 0) {
      newErrors.maxDiscountAmount = 'Giá trị không được âm';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    } 
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (end < start) {
        newErrors.endDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
      }

      if (formData.status === 'Active') {
        if (today < start) {
          newErrors.status = 'Chưa đến thời gian phát hành. Vui lòng chọn "Chờ phát hành" hoặc lùi ngày bắt đầu.';
        } else if (today > end) {
          newErrors.status = 'Voucher này đã kết thúc (quá ngày kết thúc).';
        }
      } else if (formData.status === 'Scheduled' && today >= start && today <= end) {
        newErrors.status = 'Đã đến thời gian phát hành. Vui lòng chọn trạng thái "Đang phát hành".';
      } else if (formData.status === 'Expired' && today <= end) {
        newErrors.status = 'Voucher vẫn còn trong thời hạn. Không thể chọn "Đã kết thúc".';
      }
    }

    if (!formData.pointVoucher) {
      newErrors.pointVoucher = 'Điểm đổi voucher không được để trống';
    } else if (parseInt(formData.pointVoucher) < 0) {
      newErrors.pointVoucher = 'Điểm không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'startDate' || name === 'endDate' || name === 'status') {
      setErrors(prev => ({ ...prev, status: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError('');

    const statusMap = {
      'Active': 1,
      'Stopped': 0,
      'Scheduled': 2,
      'Expired': 3
    };

    const body = {
      code: formData.code.trim(),
      value: parseFloat(formData.value),
      minOrderValue: parseFloat(formData.minOrderValue),
      maxDiscountAmount: parseFloat(formData.maxDiscountAmount),
      startDate: formData.startDate,
      endDate: formData.endDate,
      pointVoucher: parseInt(formData.pointVoucher, 10),
      status: statusMap[formData.status],
    };

    const vid = editData?.id;
    const url = vid ? VOUCHERS.BY_ID(vid) : VOUCHERS.LIST;
    try {
      const res = await apiFetch(url, {
        method: vid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        navigate('/super-admin/vouchers');
      } else {
        const json = await res.json().catch(() => null);
        const errorMessage = json?.message || 'Lưu voucher thất bại';
        setServerError(errorMessage);
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-ticket-perforated-fill" : "bi-ticket-perforated"} 
      title={editData ? 'Cập nhật voucher' : 'Tạo voucher mới'} 
      description="Thiết lập các mã giảm giá, chương trình ưu đãi và điểm đổi thưởng cho khách hàng."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className={`bi ${editData ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
            Cấu hình chương trình Voucher
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Mã Voucher <span className="text-danger">*</span></label>
                <input 
                  type="text" name="code" className={`admin-search-input w-100 ${errors.code ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: HE2024, CHAOXUAN..." value={formData.code} onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && <small className="text-danger fw-medium">{errors.code}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Phần trăm giảm giá (%) <span className="text-danger">*</span></label>
                <input 
                  type="number" name="value" className={`admin-search-input w-100 ${errors.value ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 10 (%)"
                  value={formData.value} onChange={handleChange}
                />
                {errors.value && <small className="text-danger fw-medium">{errors.value}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Đơn hàng tối thiểu (VNĐ) <span className="text-danger">*</span></label>
                <input 
                  type="number" name="minOrderValue" className={`admin-search-input w-100 ${errors.minOrderValue ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 100000" value={formData.minOrderValue} onChange={handleChange}
                />
                {errors.minOrderValue && <small className="text-danger fw-medium">{errors.minOrderValue}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Số tiền giảm tối đa (VNĐ) <span className="text-danger">*</span></label>
                <input 
                  type="number" name="maxDiscountAmount" className={`admin-search-input w-100 ${errors.maxDiscountAmount ? 'border-danger' : ''}`}
                  placeholder="Ví dụ: 50000" value={formData.maxDiscountAmount} onChange={handleChange}
                />
                {errors.maxDiscountAmount && <small className="text-danger fw-medium">{errors.maxDiscountAmount}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Ngày bắt đầu <span className="text-danger">*</span></label>
                <input type="date" name="startDate" className={`admin-search-input w-100 ${errors.startDate ? 'border-danger' : ''}`} value={formData.startDate} onChange={handleChange} />
                {errors.startDate && <small className="text-danger fw-medium">{errors.startDate}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Ngày kết thúc <span className="text-danger">*</span></label>
                <input type="date" name="endDate" className={`admin-search-input w-100 ${errors.endDate ? 'border-danger' : ''}`} value={formData.endDate} onChange={handleChange} />
                {errors.endDate && <small className="text-danger fw-medium">{errors.endDate}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Điểm đổi voucher <span className="text-danger">*</span></label>
                <input 
                  type="number" name="pointVoucher" className={`admin-search-input w-100 ${errors.pointVoucher ? 'border-danger' : ''}`}
                  placeholder="Số điểm tích lũy cần để đổi..." value={formData.pointVoucher} onChange={handleChange}
                />
                {errors.pointVoucher && <small className="text-danger fw-medium">{errors.pointVoucher}</small>}
              </div>

              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Trạng thái phát hành</label>
                <select 
                  name="status" 
                  className={`admin-search-input w-100 ${errors.status ? 'border-danger' : ''}`} 
                  value={formData.status} 
                  onChange={handleChange}
                >
                  <option value="Active">Đang phát hành</option>
                  <option value="Scheduled">Chờ phát hành</option>
                  <option value="Stopped">Dừng phát hành</option>
                  <option value="Expired">Đã kết thúc</option>
                </select>
                {errors.status && <small className="text-danger fw-medium">{errors.status}</small>}
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-center gap-3">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/vouchers')}>Hủy bỏ</button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '200px' }} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                {editData ? 'Cập nhật voucher' : 'Lưu voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateVoucher;
