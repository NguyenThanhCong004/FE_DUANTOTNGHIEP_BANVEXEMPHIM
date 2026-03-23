import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  useEffect(() => {
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state
      setFormData({
        name: editData.name || '',
        price: editData.price || ''
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên loại ghế không được để trống';
    }

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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Lưu loại ghế thất bại');
        return;
      }
      alert(tid ? 'Cập nhật loại ghế thành công!' : 'Thêm loại ghế thành công!');
      navigate('/super-admin/seat-types');
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="create-seat-type p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 800px;
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

        .custom-input {
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

        .custom-input:focus {
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
          color: black;
          margin-bottom: 25px;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>
          {editData ? 'Cập Nhật Loại Ghế' : 'Thêm Loại Ghế Mới'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/seat-types')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <h5 className="section-title">THÔNG TIN LOẠI GHẾ</h5>
          
          <div className="form-group-custom">
            <label className="form-label">Tên loại ghế</label>
            <input 
              type="text" 
              name="name"
              className={`custom-input ${errors.name ? 'is-invalid' : ''}`}
              placeholder="Ví dụ: Ghế VIP, Ghế Sweetbox..." 
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Giá phụ thu (VNĐ)</label>
            <input 
              type="number" 
              name="price"
              className={`custom-input ${errors.price ? 'is-invalid' : ''}`}
              placeholder="Ví dụ: 90000" 
              value={formData.price}
              onChange={handleChange}
            />
            {errors.price && <div className="error-message">{errors.price}</div>}
            <p className="text-dark small mt-2">Mức giá này sẽ được áp dụng khi khách hàng chọn loại ghế này.</p>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/seat-types')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              {editData ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN LƯU LOẠI GHẾ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSeatType;
