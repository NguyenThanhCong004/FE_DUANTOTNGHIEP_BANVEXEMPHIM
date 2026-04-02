import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch, apiJson } from '../../utils/apiClient';
import { GENRES } from '../../constants/apiEndpoints';

const CreateMovieType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [genreName, setGenreName] = useState('');
  const [existingGenres, setExistingGenres] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    fetchGenres();
    if (editData) {
      setGenreName(editData.name || '');
    }
  }, [editData]);

  const fetchGenres = async () => {
    try {
      const res = await apiJson(GENRES.LIST);
      if (res.ok) {
        setExistingGenres(res.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thể loại:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    const trimmedName = genreName.trim();

    if (!trimmedName) {
      newErrors.genreName = 'Tên thể loại không được để trống';
    } else {
      // Bắt lỗi trùng tên
      const isDuplicate = existingGenres.some(g => 
        g.name.toLowerCase() === trimmedName.toLowerCase() && 
        (!editData || g.id !== editData.id)
      );
      
      if (isDuplicate) {
        newErrors.genreName = 'Tên thể loại này đã tồn tại';
      }
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

    setSubmitting(true);
    setServerError('');
    
    const gid = editData?.id;
    const url = gid ? GENRES.BY_ID(gid) : GENRES.LIST;
    
    try {
      const res = await apiFetch(url, {
        method: gid ? 'PUT' : 'POST',
        body: JSON.stringify({ name: genreName.trim() }),
      });
      
      if (res.ok) {
        navigate('/super-admin/movie-types');
      } else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu thể loại thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-tags-fill" : "bi-plus-square-fill"} 
      title={editData ? 'Cập nhật thể loại' : 'Thêm thể loại mới'} 
      description="Quản lý danh mục các thể loại phim trên hệ thống để phân loại phim chính xác."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className={`bi ${editData ? 'bi-pencil-square' : 'bi-tag-fill'} text-primary me-2`}></i>
            Thông tin thể loại
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && (
            <div className="alert alert-danger border-0 py-2 small mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="admin-form-label">Tên thể loại phim <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className={`admin-search-input w-100 ${errors.genreName ? 'border-danger' : ''}`}
                placeholder="Ví dụ: Hành động, Kinh dị, Tâm lý..." 
                value={genreName}
                onChange={handleChange}
                autoFocus
              />
              {errors.genreName && <small className="text-danger fw-medium">{errors.genreName}</small>}
            </div>

            <div className="mt-5 d-flex justify-content-center gap-3">
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                onClick={() => navigate('/super-admin/movie-types')}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                style={{ minWidth: '180px' }} 
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="bi bi-check-circle me-2"></i>
                )}
                {editData ? 'Cập nhật' : 'Lưu thể loại'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateMovieType;


