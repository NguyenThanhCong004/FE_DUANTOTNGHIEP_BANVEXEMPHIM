import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import AdminFormListBack from '../../components/admin/AdminFormListBack';
import { apiFetch, apiJson } from '../../utils/apiClient';
import { GENRES } from '../../constants/apiEndpoints';
import { useAdminToast } from '../../components/admin/AdminToast';
import { apiMessage, MESSAGES, resultToastType } from '../../utils/uiMessages';

const CreateMovieType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { showToast, ToastComponent } = useAdminToast();

  const [genreName, setGenreName] = useState('');
  const [existingGenres, setExistingGenres] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
      // Bắt lỗi trùng tên (loại trừ chính nó nếu đang edit)
      const isDuplicate = existingGenres.some(g => 
        g.name.toLowerCase() === trimmedName.toLowerCase() && 
        (!editData || (g.genreId !== editData.genreId && g.genreId !== editData.id))
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

    const trimmedName = genreName.trim();
    const gid = editData?.id || editData?.genreId;

    if (gid && editData.name === trimmedName) {
      showToast(MESSAGES.noChanges, 'warning');
      return;
    }

    setSubmitting(true);
    const url = gid ? GENRES.BY_ID(gid) : GENRES.LIST;
    
    try {
      const res = await apiFetch(url, {
        method: gid ? 'PUT' : 'POST',
        body: JSON.stringify({ name: trimmedName }),
      });
      
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, gid ? 'Cập nhật thể loại thành công' : 'Thêm thể loại thành công');
        const type = resultToastType(message);

        navigate('/super-admin/movie-types', {
          state: { message, type },
        });
      } else {
        const json = await res.json().catch(() => null);
        showToast(apiMessage(json, 'Lưu thể loại thất bại'), 'danger');
      }
    } catch {
      showToast(MESSAGES.networkError, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastComponent />
      <AdminPanelPage 
        icon={editData ? "bi-tags-fill" : "bi-plus-square-fill"} 
        title={editData ? 'Cập nhật thể loại' : 'Thêm thể loại mới'}
        description="Quản lý danh mục các thể loại phim trên hệ thống để phân loại phim chính xác."
        headerRight={<AdminFormListBack to="/super-admin/movie-types" />}
      >
        <div className="admin-form-page-wrap admin-form-compact">
        <div className="admin-card admin-slide-up">
          <div className="admin-card-header">
            <h4 className="mb-0">
              Thông tin thể loại
            </h4>
          </div>
          <div className="admin-card-body p-4">
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

              <div className="mt-4 d-flex justify-content-end">
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary" 
                  style={{ minWidth: '180px' }} 
                  disabled={submitting}
                >
                  {submitting && (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  )}
                  {editData ? 'Cập nhật' : 'Lưu thể loại'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </AdminPanelPage>
    </>
  );
};

export default CreateMovieType;

