import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { CINEMAS } from '../../constants/apiEndpoints';

const CreateCinema = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state
      setFormData({
        name: editData.name || '',
        address: editData.address || '',
        status: editData.status || 'Active'
      });
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên cụm rạp không được để trống';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const body = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      status: formData.status === 'Active' ? 1 : 0,
    };
    const cid = editData?.id;
    const url = cid ? CINEMAS.BY_ID(cid) : CINEMAS.LIST;
    try {
      const res = await apiFetch(url, {
        method: cid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Lưu rạp thất bại');
        return;
      }
      alert(cid ? 'Cập nhật rạp thành công!' : 'Thêm rạp thành công!');
      navigate('/super-admin/cinemas');
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="create-cinema p-4">
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
          {editData ? 'Cập Nhật Cụm Rạp' : 'Thêm Cụm Rạp Mới'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/cinemas')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <h5 className="section-title">THÔNG TIN CHI TIẾT RẠP</h5>
          
          <div className="form-group-custom">
            <label className="form-label">Tên cụm rạp</label>
            <input 
              type="text" 
              name="name"
              className={`custom-input ${errors.name ? 'is-invalid' : ''}`}
              placeholder="Ví dụ: CGV Vincom Center..." 
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Địa chỉ chi tiết</label>
            <textarea 
              name="address"
              className={`custom-textarea ${errors.address ? 'is-invalid' : ''}`}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." 
              value={formData.address}
              onChange={handleChange}
            ></textarea>
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Trạng thái rạp</label>
            <select 
              name="status"
              className="custom-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Đang hoạt động</option>
              <option value="Inactive">Tạm ngưng hoạt động</option>
            </select>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/cinemas')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              {editData ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN LƯU RẠP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCinema;
