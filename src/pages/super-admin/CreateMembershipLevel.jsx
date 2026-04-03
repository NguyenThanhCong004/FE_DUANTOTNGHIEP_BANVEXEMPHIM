import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { MEMBERSHIP_RANKS } from '../../constants/apiEndpoints';

const CreateMembershipLevel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState({
    rank_name: '',
    min_spending: '',
    description: '',
    discount_percent: '',
    bonus_point: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state
      setFormData({
        rank_name: editData.rank_name || '',
        min_spending: editData.min_spending || '',
        description: editData.description || '',
        discount_percent: editData.discount_percent || '',
        bonus_point: editData.bonus_point || ''
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.rank_name.trim()) {
      newErrors.rank_name = 'Tên hạng không được để trống';
    }

    if (!formData.min_spending) {
      newErrors.min_spending = 'Chi tiêu tối thiểu không được để trống';
    } else if (parseFloat(formData.min_spending) < 0) {
      newErrors.min_spending = 'Chi tiêu không được là số âm';
    }

    if (!formData.discount_percent) {
      newErrors.discount_percent = 'Phần trăm giảm giá không được để trống';
    } else {
      const val = parseFloat(formData.discount_percent);
      if (val < 0 || val > 100) {
        newErrors.discount_percent = 'Phần trăm phải từ 0 đến 100';
      }
    }

    if (!formData.bonus_point) {
      newErrors.bonus_point = 'Hệ số điểm thưởng không được để trống';
    } else if (parseFloat(formData.bonus_point) < 1) {
      newErrors.bonus_point = 'Hệ số điểm thưởng phải lớn hơn hoặc bằng 1';
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
      rankName: formData.rank_name.trim(),
      minSpending: parseFloat(formData.min_spending),
      description: formData.description || '',
      discountPercent: parseFloat(formData.discount_percent),
      bonusPoint: parseInt(formData.bonus_point, 10),
    };
    const rid = editData?.id;
    const url = rid ? MEMBERSHIP_RANKS.BY_ID(rid) : MEMBERSHIP_RANKS.LIST;
    try {
      const res = await apiFetch(url, {
        method: rid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Lưu hạng thất bại');
        return;
      }
      alert(rid ? 'Cập nhật mức độ hội viên thành công!' : 'Thêm mức độ hội viên thành công!');
      navigate('/super-admin/membership-levels');
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="create-membership p-4">
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

        .custom-input, .custom-textarea {
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
          min-height: 100px;
          padding-top: 12px;
        }

        .custom-input:focus, .custom-textarea:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
          margin-bottom: 25px;
          color: black;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>
          {editData ? 'CẬP NHẬT HẠNG HỘI VIÊN' : 'THÊM HẠNG HỘI VIÊN MỚI'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/membership-levels')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <h5 className="section-title">THÔNG TIN HẠNG THÀNH VIÊN</h5>
          
          <div className="row">
            <div className="col-md-6 form-group-custom">
              <label className="form-label">Tên hạng (Rank Name)</label>
              <input 
                type="text" 
                name="rank_name"
                className={`custom-input ${errors.rank_name ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: SILVER, GOLD, DIAMOND..." 
                value={formData.rank_name}
                onChange={handleChange}
              />
              {errors.rank_name && <div className="error-message">{errors.rank_name}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Chi tiêu tối thiểu (VNĐ)</label>
              <input 
                type="number" 
                name="min_spending"
                className={`custom-input ${errors.min_spending ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: 5000000" 
                value={formData.min_spending}
                onChange={handleChange}
              />
              {errors.min_spending && <div className="error-message">{errors.min_spending}</div>}
            </div>

            <div className="col-12 form-group-custom">
              <label className="form-label">Mô tả hạng hội viên</label>
              <textarea 
                name="description"
                className="custom-textarea" 
                placeholder="Nhập mô tả các đặc quyền của hạng này..." 
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giảm giá vé (%)</label>
              <input 
                type="number" 
                name="discount_percent"
                className={`custom-input ${errors.discount_percent ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: 10" 
                value={formData.discount_percent}
                onChange={handleChange}
              />
              {errors.discount_percent && <div className="error-message">{errors.discount_percent}</div>}
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Hệ số điểm thưởng (Bonus Point)</label>
              <input 
                type="number" 
                name="bonus_point"
                className={`custom-input ${errors.bonus_point ? 'is-invalid' : ''}`}
                placeholder="Ví dụ: 2 (x2 điểm thưởng)" 
                value={formData.bonus_point}
                onChange={handleChange}
              />
              {errors.bonus_point && <div className="error-message">{errors.bonus_point}</div>}
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/membership-levels')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN LƯU MỨC ĐỘ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMembershipLevel;
