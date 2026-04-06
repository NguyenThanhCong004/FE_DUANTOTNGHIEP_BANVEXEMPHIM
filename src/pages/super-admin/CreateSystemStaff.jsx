import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiJson, apiFetch } from '../../utils/apiClient';
import { STAFF, CINEMAS } from '../../constants/apiEndpoints';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const CreateSystemStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.editId;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    username: '', // Trường username riêng biệt
    phone: '',
    birthday: '',
    role: 'STAFF',
    status: 1,
    avatar: '',
    cinemaId: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cinemas, setCinemas] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCinemas();
    if (editId) fetchStaffDetail();
  }, [editId]);

  const fetchCinemas = async () => {
    try {
      const res = await apiJson(CINEMAS.LIST);
      if (res.ok) setCinemas(res.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách rạp:", error);
    }
  };

  const fetchStaffDetail = async () => {
    setLoading(true);
    try {
      const res = await apiJson(STAFF.BY_ID(editId));
      if (res.ok && res.data) {
        const d = res.data;
        setFormData({
          fullname: d.fullname || '',
          email: d.email || '',
          username: d.username || '',
          phone: d.phone || '',
          birthday: d.birthday || '',
          role: d.role?.toUpperCase() || 'STAFF',
          status: d.status ?? 1,
          avatar: d.avatar || '',
          cinemaId: d.cinemaId || ''
        });
        if (d.avatar) setPreviewUrl(d.avatar);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhân sự:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validate = () => {
    let newErrors = {};
    const now = new Date();
    
    if (!formData.fullname.trim()) newErrors.fullname = 'Họ tên không được để trống';
    
    // Bắt lỗi Username
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (formData.username.trim().length < 4) {
      newErrors.username = 'Tên đăng nhập phải ít nhất 4 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!formData.email.match(/^[a-z0-9._%+-]+@gmail\.com$/i)) {
      newErrors.email = 'Email phải có đuôi @gmail.com';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!formData.phone.match(/^(0[3|5|7|8|9])[0-9]{8}$/)) {
      newErrors.phone = 'SĐT không đúng định dạng VN (10 số)';
    }
    
    if (!formData.birthday) {
      newErrors.birthday = 'Vui lòng chọn ngày sinh';
    } else {
      const birthDate = new Date(formData.birthday);
      let age = now.getFullYear() - birthDate.getFullYear();
      if (age < 18) newErrors.birthday = 'Nhân viên phải từ 18 tuổi trở lên';
    }
    
    if (!formData.cinemaId) newErrors.cinemaId = 'Vui lòng chọn rạp làm việc';
    if (!editId && !selectedFile) newErrors.file = 'Vui lòng chọn ảnh đại diện';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      let finalAvatar = formData.avatar;
      if (selectedFile) finalAvatar = await fileToDataUrl(selectedFile);

      const body = {
        ...formData,
        avatar: finalAvatar,
        role: formData.role,
        cinemaId: Number(formData.cinemaId)
      };

      const res = await apiFetch(editId ? STAFF.BY_ID(editId) : STAFF.LIST, {
        method: editId ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        navigate('/super-admin/system-staff');
      } else {
        const msg = json?.message || '';
        let backendErrors = {};
        if (msg.toLowerCase().includes('email')) {
          backendErrors.email = msg;
        } else if (msg.toLowerCase().includes('username') || msg.toLowerCase().includes('đăng nhập')) {
          backendErrors.username = msg;
        } else if (msg.toLowerCase().includes('điện thoại') || msg.toLowerCase().includes('phone')) {
          backendErrors.phone = msg;
        } else if (msg.toLowerCase().includes('admin') || msg.toLowerCase().includes('rạp')) {
          // Lỗi liên quan đến việc rạp đã có Admin hoạt động -> Gán vào cả rạp và vai trò để gây chú ý
          backendErrors.cinemaId = msg;
          backendErrors.role = msg;
        } else {
          setErrors({ general: msg || "Có lỗi xảy ra khi lưu nhân sự" });
        }
        setErrors(prev => ({ ...prev, ...backendErrors }));
      }
    } catch (error) {
      setErrors({ general: 'Lỗi kết nối máy chủ' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminPanelPage title="Đang tải..."><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></AdminPanelPage>;

  return (
    <AdminPanelPage
      icon={editId ? "bi-person-gear" : "bi-person-plus-fill"}
      title={editId ? "Cập nhật nhân sự" : "Thêm nhân sự mới"}
      description="Tách biệt Tên đăng nhập và Email để quản lý tài khoản chính xác hơn."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0"><i className="bi bi-person-lines-fill text-primary me-2"></i>Thông tin tài khoản</h4>
        </div>
        <div className="admin-card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* General Error Message */}
            {errors.general && (
              <div className="alert alert-danger border-0 mb-4 py-2 small d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errors.general}
              </div>
            )}

            {/* Image Upload Section */}
            <div className="row mb-5">
              <div className="col-md-12 text-center">
                <div 
                  className={`mx-auto mb-3 rounded-circle overflow-hidden d-flex align-items-center justify-content-center border-2 ${errors.file ? 'border-danger' : 'border-light'}`}
                  style={{ width: '140px', height: '140px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#fff' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  {previewUrl ? <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bi bi-person-bounding-box fs-1 text-muted"></i>}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                {errors.file && <div className="text-danger small fw-bold">{errors.file}</div>}
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => fileInputRef.current.click()}>Tải ảnh đại diện</button>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Họ và tên <span className="text-danger">*</span></label>
                <input 
                  type="text" className={`admin-search-input w-100 ${errors.fullname ? 'border-danger' : ''}`}
                  value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
                {errors.fullname && <small className="text-danger fw-medium">{errors.fullname}</small>}
              </div>
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Tên đăng nhập (Username) <span className="text-danger">*</span></label>
                <input 
                  type="text" className={`admin-search-input w-100 ${errors.username ? 'border-danger' : ''}`}
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="Ví dụ: nhanvien01" disabled={editId} // Thường không đổi username khi sửa
                />
                {errors.username && <small className="text-danger fw-medium">{errors.username}</small>}
              </div>            
            </div>

            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Email <span className="text-danger">*</span></label>
                <input 
                  type="email" className={`admin-search-input w-100 ${errors.email ? 'border-danger' : ''}`}
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="example@gmail.com"
                />
                {errors.email && <small className="text-danger fw-medium">{errors.email}</small>}
              </div>
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Số điện thoại <span className="text-danger">*</span></label>
                <input 
                  type="text" className={`admin-search-input w-100 ${errors.phone ? 'border-danger' : ''}`}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="0xxxxxxxxx"
                />
                {errors.phone && <small className="text-danger fw-medium">{errors.phone}</small>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Ngày sinh <span className="text-danger">*</span></label>
                <input 
                  type="date" className={`admin-search-input w-100 ${errors.birthday ? 'border-danger' : ''}`}
                  value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})}
                />
                {errors.birthday && <small className="text-danger fw-medium">{errors.birthday}</small>}
              </div>
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Rạp làm việc <span className="text-danger">*</span></label>
                <select className={`admin-search-input w-100 ${errors.cinemaId ? 'border-danger' : ''}`} value={formData.cinemaId} onChange={e => setFormData({...formData, cinemaId: e.target.value})}>
                  <option value="">-- Chọn chi nhánh --</option>
                  {cinemas.map(c => (
                    <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.cinemaId && <small className="text-danger fw-medium">{errors.cinemaId}</small>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Vai trò</label>
                <select className={`admin-search-input w-100 ${errors.role ? 'border-danger' : ''}`} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="STAFF">Nhân viên (STAFF)</option>
                  <option value="ADMIN">Quản lý rạp (ADMIN)</option>
                </select>
                {errors.role && <small className="text-danger fw-medium">{errors.role}</small>}
              </div>
              <div className="col-md-6 mb-4">
                <label className="admin-form-label">Trạng thái</label>
                <select className="admin-search-input w-100" value={formData.status} onChange={e => setFormData({...formData, status: Number(e.target.value)})}>
                  <option value={1}>Đang hoạt động</option>
                  <option value={0}>Đang khóa</option>
                </select>
              </div>
            </div>

            {!editId && <div className="alert alert-info py-2 small border-0"><i className="bi bi-info-circle me-2"></i>Mật khẩu mặc định là <strong>12345678</strong></div>}

            <div className="mt-4 d-flex justify-content-center gap-3">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/system-staff')}>Hủy bỏ</button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                {editId ? 'Cập nhật' : 'Lưu nhân sự'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateSystemStaff;
