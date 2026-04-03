import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { VOUCHERS } from '../../constants/apiEndpoints';

const CreateVoucher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    value: '',
    min_order_value: '',
    start_date: '',
    end_date: '',
    point_voucher: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state
      setFormData({
        code: editData.code || '',
        discount_type: editData.discount_type || 'PERCENTAGE',
        value: editData.value || '',
        min_order_value: editData.min_order_value || '',
        start_date: editData.start_date || '',
        end_date: editData.end_date || '',
        point_voucher: editData.point_voucher || '',
        status: editData.status || 'Active'
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = 'Mã voucher không được để trống';
    }

    if (!formData.value) {
      newErrors.value = 'Giá trị giảm giá không được để trống';
    } else {
      const val = parseFloat(formData.value);
      if (val <= 0) {
        newErrors.value = 'Giá trị phải lớn hơn 0';
      } else if (formData.discount_type === 'PERCENTAGE' && val > 100) {
        newErrors.value = 'Phần trăm giảm không được vượt quá 100%';
      }
    }

    if (!formData.min_order_value) {
      newErrors.min_order_value = 'Giá trị đơn hàng tối thiểu không được để trống';
    } else if (parseFloat(formData.min_order_value) < 0) {
      newErrors.min_order_value = 'Giá trị không được âm';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu không được để trống';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'Ngày kết thúc không được để trống';
    } else if (formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (!formData.point_voucher) {
      newErrors.point_voucher = 'Điểm đổi voucher không được để trống';
    } else if (parseInt(formData.point_voucher) < 0) {
      newErrors.point_voucher = 'Điểm không được âm';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const body = {
      code: formData.code.trim(),
      discountType: formData.discount_type,
      value: parseFloat(formData.value),
      minOrderValue: parseFloat(formData.min_order_value),
      startDate: formData.start_date,
      endDate: formData.end_date,
      pointVoucher: parseInt(formData.point_voucher, 10),
      status: formData.status === 'Active' ? 1 : 0,
    };
    const vid = editData?.id;
    const url = vid ? VOUCHERS.BY_ID(vid) : VOUCHERS.LIST;
    try {
      const res = await apiFetch(url, {
        method: vid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        // Xử lý lỗi trùng lặp và các lỗi khác
        const errorMessage = json?.message || 'Lưu voucher thất bại';
        const fieldErrors = {};
        
        // Map các lỗi cụ thể vào field tương ứng
        if (errorMessage.includes('Mã voucher đã tồn tại') || errorMessage.includes('code already exists')) {
          fieldErrors.code = 'Mã voucher đã tồn tại';
        } else if (errorMessage.includes('code')) {
          fieldErrors.code = errorMessage;
        } else {
          // Nếu không phải lỗi field, hiển thị alert chung
          alert(errorMessage);
          return;
        }
        
        setErrors(fieldErrors);
        return;
      }
      alert(vid ? 'Cập nhật voucher thành công!' : 'Tạo voucher thành công!');
      navigate('/super-admin/vouchers');
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="create-voucher p-4">
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

        .custom-input:focus, .custom-select:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .custom-input.is-invalid,
        .custom-select.is-invalid {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.8rem;
          margin-top: 5px;
          font-weight: 500;
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
          {editData ? 'Cập Nhật Voucher' : 'Tạo Voucher Mới'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/vouchers')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <h5 className="section-title">CẤU HÌNH VOUCHER</h5>
          
          <div className="row">
            <div className="col-md-6 form-group-custom">
              <label className="form-label">Mã Voucher (Code)</label>
              <input 
                type="text" 
                name="code"
                className={`custom-input ${errors.code ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: KM50K, CHAOHE2024..." 
                value={formData.code}
                onChange={handleChange}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && <div className="error-message">{errors.code}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Loại giảm giá</label>
              <select 
                name="discount_type"
                className="custom-select"
                value={formData.discount_type}
                onChange={handleChange}
              >
                <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giá trị giảm giá</label>
              <input 
                type="number" 
                name="value"
                className={`custom-input ${errors.value ? 'is-invalid' : ''}`}
                placeholder={formData.discount_type === 'PERCENTAGE' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50000 (VNĐ)'}
                value={formData.value}
                onChange={handleChange}
              />
              {errors.value && <div className="error-message">{errors.value}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giá trị đơn hàng tối thiểu (VNĐ)</label>
              <input 
                type="number" 
                name="min_order_value"
                className={`custom-input ${errors.min_order_value ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: 150000" 
                value={formData.min_order_value}
                onChange={handleChange}
              />
              {errors.min_order_value && <div className="error-message">{errors.min_order_value}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Ngày bắt đầu</label>
              <input 
                type="date" 
                name="start_date"
                className={`custom-input ${errors.start_date ? 'is-invalid' : ''}`}
                value={formData.start_date}
                onChange={handleChange}
              />
              {errors.start_date && <div className="error-message">{errors.start_date}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Ngày kết thúc</label>
              <input 
                type="date" 
                name="end_date"
                className={`custom-input ${errors.end_date ? 'is-invalid' : ''}`}
                value={formData.end_date}
                onChange={handleChange}
              />
              {errors.end_date && <div className="error-message">{errors.end_date}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Điểm đổi voucher</label>
              <input 
                type="number" 
                name="point_voucher"
                className={`custom-input ${errors.point_voucher ? 'is-invalid' : ''}`}
                placeholder="Số điểm cần để đổi mã này..." 
                value={formData.point_voucher}
                onChange={handleChange}
              />
              {errors.point_voucher && <div className="error-message">{errors.point_voucher}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trạng thái mã</label>
              <select 
                name="status"
                className="custom-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Ngưng áp dụng</option>
              </select>
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/vouchers')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              {editData ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN TẠO VOUCHER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVoucher;
