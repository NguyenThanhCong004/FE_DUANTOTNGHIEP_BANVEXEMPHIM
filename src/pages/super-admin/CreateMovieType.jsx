import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import { GENRES } from '../../constants/apiEndpoints';

const CreateMovieType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const [genreName, setGenreName] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from location.state
      setGenreName(editData.name || '');
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!genreName.trim()) {
      newErrors.genreName = 'Tên thể loại không được để trống';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setGenreName(e.target.value);
    if (errors.genreName) {
      setErrors(prev => ({ ...prev, genreName: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const gid = editData?.id;
    const url = gid ? GENRES.BY_ID(gid) : GENRES.LIST;
    try {
      const res = await apiFetch(url, {
        method: gid ? 'PUT' : 'POST',
        body: JSON.stringify({ name: genreName.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || 'Lưu thể loại thất bại');
        return;
      }
      alert(gid ? 'Cập nhật thể loại thành công!' : 'Thêm thể loại thành công!');
      navigate('/super-admin/movie-types');
    } catch {
      alert('Không thể kết nối server');
    }
  };

  return (
    <div className="create-movie-type p-4">
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

        /* Style ô nhập liệu đồng bộ với CreateMovie */
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
          {editData ? 'Cập Nhật Thể Loại Phim' : 'Thêm Thể Loại Phim'}
        </h1>
        <button className="btn btn-link text-dark p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/movie-types')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <h5 className="section-title">THÔNG TIN THỂ LOẠI</h5>
          
          <div className="form-group-custom">
            <label className="form-label">Tên thể loại phim</label>
            <input 
              type="text" 
              className={`custom-input ${errors.genreName ? 'is-invalid' : ''}`}
              placeholder="Ví dụ: Hành động, Kinh dị, Tâm lý..." 
              value={genreName}
              onChange={handleChange}
            />
            {errors.genreName && <div className="error-message">{errors.genreName}</div>}
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/movie-types')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              {editData ? 'XÁC NHẬN CẬP NHẬT' : 'XÁC NHẬN LƯU THỂ LOẠI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMovieType;
